import dgram from "node:dgram";
import net from "node:net";
import { db } from "@notploy/server/db";
import { dnsRecord } from "@notploy/server/db/schema";
import { and, eq } from "drizzle-orm";

/**
 * Minimal authoritative-forwarding DNS server. Names that fall inside a
 * Notploy Internal DNS zone (`dns_zone` rows owned by a `notploy-internal`
 * provider) are answered from `dns_record`; every other name is forwarded to
 * the configured upstream resolvers. That is what makes `gitlab.notploy.lan`
 * resolve for LAN clients while the rest of DNS keeps working.
 */

const TYPE_CODES: Record<string, number> = {
	A: 1,
	NS: 2,
	CNAME: 5,
	PTR: 12,
	MX: 15,
	TXT: 16,
	AAAA: 28,
	SRV: 33,
	CAA: 257,
};

const TYPE_NAMES = Object.fromEntries(
	Object.entries(TYPE_CODES).map(([name, code]) => [code, name]),
) as Record<number, string>;

const CLASS_IN = 1;
const DEFAULT_TTL = 300;
const ZONE_CACHE_MS = 5_000;

interface InternalZone {
	dnsZoneId: string;
	name: string;
}

const normalizeName = (name: string) =>
	name.toLowerCase().replace(/\.$/, "").replace(/^\.+/, "");

const encodeName = (name: string) => {
	const labels = normalizeName(name).split(".").filter(Boolean);
	const chunks: Buffer[] = [];
	for (const label of labels) {
		const buffer = Buffer.from(label, "ascii");
		chunks.push(Buffer.from([buffer.length]), buffer);
	}
	chunks.push(Buffer.from([0]));
	return Buffer.concat(chunks);
};

const ipv4ToBuffer = (value: string) => {
	const parts = value.trim().split(".");
	if (parts.length !== 4) return null;
	const bytes = parts.map((part) => Number.parseInt(part, 10));
	if (bytes.some((byte) => !Number.isInteger(byte) || byte < 0 || byte > 255)) {
		return null;
	}
	return Buffer.from(bytes);
};

const ipv6ToBuffer = (value: string) => {
	const address = value.trim().toLowerCase();
	if (!address.includes(":")) return null;
	const [head, tail] = address.split("::");
	const headGroups = head ? head.split(":").filter(Boolean) : [];
	const tailGroups = tail ? tail.split(":").filter(Boolean) : [];
	const missing = 8 - headGroups.length - tailGroups.length;
	if (missing < 0) return null;
	const groups = [
		...headGroups,
		...Array.from({ length: missing }, () => "0"),
		...tailGroups,
	];
	if (groups.length !== 8) return null;
	const buffer = Buffer.alloc(16);
	for (let index = 0; index < 8; index += 1) {
		const group = groups[index];
		if (!group) return null;
		const parsed = Number.parseInt(group, 16);
		if (Number.isNaN(parsed) || parsed < 0 || parsed > 0xffff) return null;
		buffer.writeUInt16BE(parsed, index * 2);
	}
	return buffer;
};

const encodeTxt = (value: string) => {
	const text = value.startsWith('"') && value.endsWith('"')
		? value.slice(1, -1)
		: value;
	const bytes = Buffer.from(text, "utf8");
	const chunks: Buffer[] = [];
	for (let offset = 0; offset < bytes.length || offset === 0; offset += 255) {
		const slice = bytes.subarray(offset, offset + 255);
		chunks.push(Buffer.from([slice.length]), slice);
	}
	return Buffer.concat(chunks);
};

const encodeRecordData = (
	record: { type: string; content: string; ttl: number },
): Buffer | null => {
	const content = record.content.trim();
	switch (record.type) {
		case "A":
			return ipv4ToBuffer(content);
		case "AAAA":
			return ipv6ToBuffer(content);
		case "CNAME":
		case "NS":
		case "PTR":
			return encodeName(content);
		case "TXT":
			return encodeTxt(content);
		case "MX": {
			const [priority, exchange] = content.split(/\s+/, 2);
			if (!exchange) return null;
			const pref = Buffer.alloc(2);
			pref.writeUInt16BE(Number.parseInt(priority ?? "10", 10) || 10, 0);
			return Buffer.concat([pref, encodeName(exchange)]);
		}
		case "SRV": {
			const [priority, weight, port, target] = content.split(/\s+/);
			if (!target) return null;
			const header = Buffer.alloc(6);
			header.writeUInt16BE(Number.parseInt(priority ?? "0", 10) || 0, 0);
			header.writeUInt16BE(Number.parseInt(weight ?? "0", 10) || 0, 2);
			header.writeUInt16BE(Number.parseInt(port ?? "0", 10) || 0, 4);
			return Buffer.concat([header, encodeName(target)]);
		}
		case "CAA": {
			const match = /^(\d+)\s+(\S+)\s+"?([^"]*)"?$/.exec(content);
			if (!match) return null;
			const flags = Buffer.from([Number.parseInt(match[1] ?? "0", 10) || 0]);
			const tag = Buffer.from(match[2] ?? "", "ascii");
			const value = Buffer.from(match[3] ?? "", "utf8");
			return Buffer.concat([
				flags,
				Buffer.from([tag.length]),
				tag,
				value,
			]);
		}
		default:
			return null;
	}
};

const buildAnswer = (record: {
	type: string;
	content: string;
	ttl: number;
}) => {
	const code = TYPE_CODES[record.type];
	if (!code) return null;
	const rdata = encodeRecordData(record);
	if (!rdata) return null;
	const header = Buffer.alloc(12);
	// Compress the owner name to the question name at offset 12.
	header.writeUInt16BE(0xc00c, 0);
	header.writeUInt16BE(code, 2);
	header.writeUInt16BE(CLASS_IN, 4);
	header.writeUInt32BE(record.ttl || DEFAULT_TTL, 6);
	header.writeUInt16BE(rdata.length, 10);
	return Buffer.concat([header, rdata]);
};

const parseQuestion = (message: Buffer) => {
	if (message.length < 12) return null;
	const qdcount = message.readUInt16BE(4);
	if (qdcount < 1) return null;
	let offset = 12;
	const labels: string[] = [];
	while (offset < message.length) {
		const length = message[offset] ?? 0;
		if (length === 0) {
			offset += 1;
			break;
		}
		if ((length & 0xc0) !== 0) return null;
		offset += 1;
		labels.push(message.toString("ascii", offset, offset + length));
		offset += length;
	}
	if (offset + 4 > message.length) return null;
	const qtype = message.readUInt16BE(offset);
	offset += 2;
	offset += 2; // qclass
	return { name: normalizeName(labels.join(".")), qtype, questionEnd: offset };
};

const buildResponse = (
	query: Buffer,
	questionEnd: number,
	answers: Buffer[],
	rcode = 0,
) => {
	const header = Buffer.alloc(12);
	query.copy(header, 0, 0, 2);
	// QR=1, RD=1, RA=1 plus rcode.
	header.writeUInt16BE(0x8180 | (rcode & 0x0f), 2);
	header.writeUInt16BE(1, 4);
	header.writeUInt16BE(answers.length, 6);
	const question = query.subarray(12, questionEnd);
	return Buffer.concat([header, question, ...answers]);
};

let zoneCache: { at: number; zones: InternalZone[] } | null = null;

const getInternalZones = async (): Promise<InternalZone[]> => {
	if (zoneCache && Date.now() - zoneCache.at < ZONE_CACHE_MS) {
		return zoneCache.zones;
	}
	const zones = await db.query.dnsZone.findMany({ with: { provider: true } });
	const internal = zones
		.filter((zone) => zone.provider?.providerType === "notploy-internal")
		.map((zone) => ({ dnsZoneId: zone.dnsZoneId, name: normalizeName(zone.name) }));
	zoneCache = { at: Date.now(), zones: internal };
	return internal;
};

const resolveInternal = async (
	name: string,
	qtype: number,
): Promise<Buffer[] | null> => {
	const zones = await getInternalZones();
	const zone = zones
		.filter((candidate) => name === candidate.name || name.endsWith(`.${candidate.name}`))
		.sort((a, b) => b.name.length - a.name.length)[0];
	if (!zone) return null;

	const records = await db.query.dnsRecord.findMany({
		where: and(
			eq(dnsRecord.dnsZoneId, zone.dnsZoneId),
			eq(dnsRecord.name, name),
		),
	});
	if (records.length === 0) {
		// No record for this exact name: if it is the apex, answer NODATA.
		return name === zone.name ? [] : null;
	}

	const matching = records.filter(
		(record) => TYPE_CODES[record.type] === qtype,
	);
	const chosen = matching.length
		? matching
		: records.filter((record) => record.type === "CNAME");
	if (chosen.length === 0) return [];
	const answers: Buffer[] = [];
	for (const record of chosen) {
		const answer = buildAnswer({
			type: record.type,
			content: record.content,
			ttl: record.ttl,
		});
		if (answer) answers.push(answer);
	}
	return answers;
};

const parseUpstreams = () =>
	(process.env.NOTPLOY_DNS_UPSTREAM ?? "1.1.1.1,8.8.8.8")
		.split(",")
		.map((server) => server.trim())
		.filter(Boolean);

const forwardUdp = (query: Buffer, upstream: string) =>
	new Promise<Buffer | null>((resolve) => {
		const socket = dgram.createSocket("udp4");
		let settled = false;
		const finish = (value: Buffer | null) => {
			if (settled) return;
			settled = true;
			try {
				socket.close();
			} catch {
				// already closed
			}
			resolve(value);
		};
		socket.on("message", (message) => finish(message));
		socket.on("error", () => finish(null));
		socket.send(query, 53, upstream, (error) => {
			if (error) finish(null);
		});
		setTimeout(() => finish(null), 4_000);
	});

const handleQuery = async (query: Buffer): Promise<Buffer | null> => {
	const question = parseQuestion(query);
	if (!question) return null;
	try {
		const internal = await resolveInternal(question.name, question.qtype);
		if (internal) {
			return buildResponse(query, question.questionEnd, internal);
		}
	} catch (error) {
		console.error("[dns] internal lookup failed", error);
	}
	for (const upstream of parseUpstreams()) {
		const forwarded = await forwardUdp(query, upstream);
		if (forwarded) return forwarded;
	}
	return buildResponse(query, question.questionEnd, [], 3); // NXDOMAIN
};

export interface InternalDnsServerOptions {
	host?: string;
	port?: number;
	enabled?: boolean;
}

/**
 * Starts the UDP and TCP listeners. Binding is best-effort: an unavailable
 * port (for example 53 in a container without the capability) is logged and
 * never crashes the main Notploy server.
 */
export const startInternalDnsServer = (options: InternalDnsServerOptions = {}) => {
	const enabled =
		options.enabled ?? process.env.NOTPLOY_DNS_SERVER !== "false";
	if (!enabled) {
		return;
	}
	const host = options.host ?? process.env.NOTPLOY_DNS_HOST ?? "0.0.0.0";
	const port = options.port ?? Number.parseInt(process.env.NOTPLOY_DNS_PORT ?? "53", 10);

	const udp = dgram.createSocket("udp4");
	udp.on("message", (message, remote) => {
		void handleQuery(Buffer.from(message)).then((response) => {
			if (response) {
				udp.send(response, remote.port, remote.address);
			}
		});
	});
	udp.on("error", (error) => {
		console.error(`[dns] UDP server error: ${error.message}`);
	});
	udp.bind(port, host, () => {
		console.log(`[dns] internal DNS server listening on udp://${host}:${port}`);
	});

	const tcp = net.createServer((socket) => {
		let buffer = Buffer.alloc(0);
		socket.on("data", (chunk) => {
			buffer = Buffer.concat([buffer, chunk]);
			if (buffer.length < 2) return;
			const length = buffer.readUInt16BE(0);
			if (buffer.length < 2 + length) return;
			const query = buffer.subarray(2, 2 + length);
			buffer = buffer.subarray(2 + length);
			void handleQuery(query).then((response) => {
				if (!response) return;
				const prefix = Buffer.alloc(2);
				prefix.writeUInt16BE(response.length, 0);
				socket.write(Buffer.concat([prefix, response]));
			});
		});
		socket.on("error", () => socket.destroy());
	});
	tcp.on("error", (error) => {
		console.error(`[dns] TCP server error: ${error.message}`);
	});
	tcp.listen(port, host, () => {
		console.log(`[dns] internal DNS server listening on tcp://${host}:${port}`);
	});
};

export { TYPE_CODES, TYPE_NAMES };
