import { dnsRecordTypes, type DnsRecordType } from "@notploy/server/db/schema";
import type { DnsRecord, DnsRecordInput } from "./types";

/**
 * Minimal RFC 1035 zone-file support, shared by the import and export tRPC
 * endpoints. It intentionally covers the record types Notploy manages and the
 * syntax the common providers emit; anything else (SOA, DNSSEC inline data,
 * `$INCLUDE`) is skipped rather than rejected.
 */

type ParsedRecord = Omit<DnsRecordInput, "zoneId">;

const RECORD_TYPES = new Set<string>(dnsRecordTypes);

const unquote = (value: string) => {
	const trimmed = value.trim();
	if (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 2) {
		return trimmed.slice(1, -1).replace(/\\"/g, '"');
	}
	return trimmed;
};

/** Removes `;` comments while respecting double-quoted segments. */
const stripComment = (line: string) => {
	let inQuotes = false;
	for (let index = 0; index < line.length; index += 1) {
		const char = line[index];
		if (char === '"' && line[index - 1] !== "\\") {
			inQuotes = !inQuotes;
		} else if (char === ";" && !inQuotes) {
			return line.slice(0, index);
		}
	}
	return line;
};

/** Splits on whitespace, keeping double-quoted groups as single tokens. */
const tokenize = (line: string) => {
	const tokens: string[] = [];
	let current = "";
	let inQuotes = false;
	for (const char of line) {
		if (char === '"') {
			inQuotes = !inQuotes;
			current += char;
			continue;
		}
		if (!inQuotes && /\s/.test(char)) {
			if (current) {
				tokens.push(current);
				current = "";
			}
			continue;
		}
		current += char;
	}
	if (current) tokens.push(current);
	return tokens;
};

const normalizeName = (name: string, origin: string) => {
	if (name === "@" || name === "") return origin;
	if (name.endsWith(".")) return name.replace(/\.$/, "");
	if (name.endsWith(`.${origin}`)) return name;
	return `${name}.${origin}`;
};

/**
 * Parses a zone file into record inputs. The caller supplies the zone name used
 * to resolve `@` and relative names.
 */
export const parseZoneFile = (
	content: string,
	zoneName: string,
): { records: ParsedRecord[]; errors: string[] } => {
	const origin = zoneName.replace(/\.$/, "");
	const records: ParsedRecord[] = [];
	const errors: string[] = [];
	let defaultTtl: number | undefined;
	let lastName: string | null = null;

	// Fold continuation lines inside parentheses into a single logical line.
	const logicalLines: string[] = [];
	let buffer = "";
	let depth = 0;
	for (const rawLine of content.split(/\r?\n/)) {
		const line = stripComment(rawLine).trim();
		if (!line) continue;
		const open = (line.match(/\(/g) ?? []).length;
		const close = (line.match(/\)/g) ?? []).length;
		buffer = buffer ? `${buffer} ${line}` : line;
		depth += open - close;
		if (depth <= 0) {
			logicalLines.push(buffer.replace(/[()]/g, " "));
			buffer = "";
			depth = 0;
		}
	}
	if (buffer) logicalLines.push(buffer.replace(/[()]/g, " "));

	for (const line of logicalLines) {
		const trimmed = line.trim();
		if (trimmed.startsWith("$")) {
			const [directive, ...rest] = tokenize(trimmed);
			if (!directive) continue;
			if (directive.toUpperCase() === "$TTL" && rest[0]) {
				const ttl = Number(rest[0]);
				if (Number.isFinite(ttl)) defaultTtl = ttl;
			}
			continue;
		}

		const tokens = tokenize(trimmed);
		if (!tokens.length) continue;

		let cursor = 0;
		let name: string;
		if (RECORD_TYPES.has(tokens[0]!.toUpperCase())) {
			// Record with an omitted name: reuse the previous owner.
			name = lastName ?? "@";
		} else {
			name = tokens[0]!;
			cursor = 1;
		}

		let ttl: number | undefined;
		// Optional TTL and class before the type.
		while (cursor < tokens.length) {
			const token = tokens[cursor]!;
			if (/^\d+$/.test(token)) {
				ttl = Number(token);
				cursor += 1;
				continue;
			}
			if (["IN", "CH", "HS"].includes(token.toUpperCase())) {
				cursor += 1;
				continue;
			}
			break;
		}

		const typeToken = tokens[cursor]?.toUpperCase();
		if (!typeToken || !RECORD_TYPES.has(typeToken)) {
			errors.push(`Skipped unsupported record: ${trimmed}`);
			continue;
		}
		cursor += 1;

		const content = tokens
			.slice(cursor)
			.map(unquote)
			.join(" ")
			.trim();
		if (!content) {
			errors.push(`Skipped record without content: ${trimmed}`);
			continue;
		}

		lastName = name;
		records.push({
			type: typeToken as DnsRecordType,
			name: normalizeName(name, origin),
			content,
			ttl: ttl ?? defaultTtl,
		});
	}

	return { records, errors };
};

/** Serializes records into a BIND-style zone file. */
export const serializeZoneFile = (
	zoneName: string,
	records: DnsRecord[],
): string => {
	const origin = zoneName.replace(/\.$/, "");
	const lines = [`$ORIGIN ${origin}.`, ""];

	for (const record of records) {
		const relative =
			record.name === origin || record.name === "@"
				? "@"
				: record.name.endsWith(`.${origin}`)
					? record.name.slice(0, -(origin.length + 1))
					: record.name.replace(/\.$/, "");
		const content =
			record.type === "TXT" && !record.content.startsWith('"')
				? `"${record.content.replace(/"/g, '\\"')}"`
				: record.content;
		lines.push(
			`${relative}\t${record.ttl}\tIN\t${record.type}\t${content}`,
		);
	}

	lines.push("");
	return lines.join("\n");
};
