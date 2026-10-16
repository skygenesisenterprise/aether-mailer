/**
 * CIDR parsing and validation helpers shared by the network provider layer.
 *
 * VPN providers (WireGuard, Tailscale, OpenVPN) are declarative: a network is
 * described by a CIDR and a set of peers. Before any of that is persisted we
 * need to reject malformed CIDRs, peer addresses outside the network, and
 * overlapping subnets, which is what this module provides.
 *
 * The implementation is dependency-free and pure so it can run on the server
 * and, if needed, inside a worker without pulling in Node built-ins.
 */

const IPV4_PATTERN = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
const IPV6_GROUP_PATTERN = /^[0-9a-f]{1,4}$/i;

const ipv4ToBigInt = (address: string): bigint | null => {
	const match = IPV4_PATTERN.exec(address.trim());
	if (!match) {
		return null;
	}
	let value = 0n;
	for (let index = 1; index <= 4; index += 1) {
		const octet = Number(match[index]);
		if (!Number.isInteger(octet) || octet < 0 || octet > 255) {
			return null;
		}
		value = (value << 8n) | BigInt(octet);
	}
	return value;
};

const expandIpv6Groups = (groups: string[]): number[] | null => {
	const out: number[] = [];
	for (const group of groups) {
		if (group.includes(".")) {
			// An embedded IPv4 tail stands for two 16-bit groups.
			const value = ipv4ToBigInt(group);
			if (value === null) {
				return null;
			}
			out.push(Number((value >> 16n) & 0xffffn));
			out.push(Number(value & 0xffffn));
		} else if (IPV6_GROUP_PATTERN.test(group)) {
			out.push(Number.parseInt(group, 16));
		} else {
			return null;
		}
	}
	return out;
};

const ipv6ToBigInt = (address: string): bigint | null => {
	const value = (address.split("%")[0] ?? "").trim();
	if (!value.includes(":")) {
		return null;
	}
	if ((value.match(/::/g) ?? []).length > 1) {
		return null;
	}

	const [head, tail] = value.split("::") as [string, string | undefined];
	const headGroups = head ? head.split(":") : [];
	const tailGroups = tail ? tail.split(":") : [];
	const headParts = expandIpv6Groups(headGroups);
	const tailParts = expandIpv6Groups(tailGroups);
	if (!headParts || !tailParts) {
		return null;
	}

	if (tail === undefined) {
		if (headParts.length !== 8) {
			return null;
		}
	} else if (headParts.length + tailParts.length > 7) {
		// `::` must stand for at least one group.
		return null;
	}

	const missing = 8 - headParts.length - tailParts.length;
	const groups =
		tail === undefined
			? headParts
			: [...headParts, ...new Array(missing).fill(0), ...tailParts];
	if (groups.length !== 8) {
		return null;
	}

	let result = 0n;
	for (const group of groups) {
		result = (result << 16n) | BigInt(group);
	}
	return result;
};

const ipToBigInt = (address: string): bigint | null =>
	ipv4ToBigInt(address) ?? ipv6ToBigInt(address);

export interface ParsedCidr {
	address: bigint;
	prefix: number;
	version: 4 | 6;
}

const bitsForVersion = (version: 4 | 6) => (version === 4 ? 32 : 128);

/**
 * Parses `10.80.0.0/16`, `fd00::/64`, or a bare address treated as a `/32`
 * (IPv4) or `/128` (IPv6) host route. Returns `null` when the input is invalid.
 */
export const parseCidr = (cidr: string): ParsedCidr | null => {
	const trimmed = cidr.trim();
	if (!trimmed) {
		return null;
	}
	const [addressPart, prefixPart, ...rest] = trimmed.split("/");
	if (rest.length > 0 || !addressPart) {
		return null;
	}
	if (prefixPart !== undefined && prefixPart.trim() === "") {
		return null;
	}

	const ipv4 = ipv4ToBigInt(addressPart);
	if (ipv4 !== null) {
		const prefix = prefixPart === undefined ? 32 : Number(prefixPart);
		if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
			return null;
		}
		return { address: ipv4, prefix, version: 4 };
	}

	const ipv6 = ipv6ToBigInt(addressPart);
	if (ipv6 !== null) {
		const prefix = prefixPart === undefined ? 128 : Number(prefixPart);
		if (!Number.isInteger(prefix) || prefix < 0 || prefix > 128) {
			return null;
		}
		return { address: ipv6, prefix, version: 6 };
	}

	return null;
};

export const isValidCidr = (cidr: string): boolean => parseCidr(cidr) !== null;

export const isValidIp = (address: string): boolean =>
	ipToBigInt(address) !== null;

const networkRange = (parsed: ParsedCidr) => {
	const bits = bitsForVersion(parsed.version);
	if (parsed.prefix === 0) {
		return { start: 0n, end: (1n << BigInt(bits)) - 1n };
	}
	const hostMask = (1n << BigInt(bits - parsed.prefix)) - 1n;
	const start = parsed.address & ~hostMask;
	return { start, end: start | hostMask };
};

/** True when two CIDRs of the same family share any address. */
export const cidrOverlaps = (a: string, b: string): boolean => {
	const parsedA = parseCidr(a);
	const parsedB = parseCidr(b);
	if (!parsedA || !parsedB || parsedA.version !== parsedB.version) {
		return false;
	}
	const rangeA = networkRange(parsedA);
	const rangeB = networkRange(parsedB);
	return rangeA.start <= rangeB.end && rangeB.start <= rangeA.end;
};

/** True when `address` falls inside `cidr` (same address family). */
export const isIpInCidr = (address: string, cidr: string): boolean => {
	const ip = ipToBigInt(address);
	const parsed = parseCidr(cidr);
	if (ip === null || !parsed) {
		return false;
	}
	const bits = bitsForVersion(parsed.version);
	// A bare address has no family on its own; infer it from the CIDR.
	const ipIsV4 = ipv4ToBigInt(address) !== null;
	if (ipIsV4 !== (parsed.version === 4)) {
		return false;
	}
	const range = networkRange(parsed);
	return ip >= range.start && ip <= range.end && bits >= 0;
};

/** Returns the first overlapping pair, or `null` when every subnet is disjoint. */
export const findOverlappingCidr = (
	cidrs: string[],
): [string, string] | null => {
	for (let index = 0; index < cidrs.length; index += 1) {
		for (let other = index + 1; other < cidrs.length; other += 1) {
			if (cidrOverlaps(cidrs[index]!, cidrs[other]!)) {
				return [cidrs[index]!, cidrs[other]!];
			}
		}
	}
	return null;
};
