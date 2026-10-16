/**
 * Address classification shared by the server and the web client.
 *
 * This module intentionally avoids Node built-ins (`node:net`), because the
 * domain/server-console components import it from the browser bundle, and
 * Turbopack cannot chunk external Node modules into a client chunk.
 */

/**
 * Where an address lives. `private`, `unique-local`, `link-local` and `loopback`
 * never exist on the public internet; `public` is routable from anywhere.
 */
export type IpAddressScope =
	| "public"
	| "private"
	| "loopback"
	| "link-local"
	| "unique-local";

export interface IpAddressCandidate {
	address: string;
	scope: IpAddressScope;
}

const IPV4_PATTERN = /^(?:\d{1,3}\.){3}\d{1,3}$/;
const IPV6_GROUP_PATTERN = /^[0-9a-f]{1,4}$/i;

const ipv4Octets = (address: string): number[] | null => {
	if (!IPV4_PATTERN.test(address)) {
		return null;
	}
	const octets = address.split(".").map((part) => Number.parseInt(part, 10));
	return octets.every(
		(octet) => Number.isInteger(octet) && octet >= 0 && octet <= 255,
	)
		? octets
		: null;
};

/**
 * Validates an IPv6 address, including `::` compression and an embedded IPv4
 * tail (`::ffff:192.168.1.1`). A zone id (`fe80::1%eth0`) is accepted.
 */
const isIpv6Address = (address: string): boolean => {
	const value = address.split("%")[0] ?? "";
	if (!value.includes(":")) {
		return false;
	}
	if ((value.match(/::/g) ?? []).length > 1) {
		return false;
	}

	const [headPart, tailPart] = value.split("::") as [
		string,
		string | undefined,
	];
	const headGroups = headPart ? headPart.split(":") : [];
	const tailGroups = tailPart ? tailPart.split(":") : [];
	const groups = [...headGroups, ...tailGroups];

	let groupCount = 0;
	for (let index = 0; index < groups.length; index += 1) {
		const group = groups[index] ?? "";
		if (group.includes(".")) {
			// An embedded IPv4 address is only valid as the final group and
			// stands for two 16-bit groups.
			if (index !== groups.length - 1 || !ipv4Octets(group)) {
				return false;
			}
			groupCount += 2;
		} else if (IPV6_GROUP_PATTERN.test(group)) {
			groupCount += 1;
		} else {
			return false;
		}
	}

	// `::` may stand for one or more all-zero groups; without compression an
	// address always has exactly eight groups.
	return tailPart !== undefined ? groupCount <= 7 : groupCount === 8;
};

export const isValidIpAddress = (address: string): boolean => {
	const trimmed = address.trim();
	return ipv4Octets(trimmed) !== null || isIpv6Address(trimmed);
};

/**
 * Classifies an address so the UI can tell the user whether the address they
 * declare is reachable only inside their network (RFC 1918, RFC 4193, loopback
 * or link-local) or from the public internet.
 */
export const classifyIpAddress = (address: string): IpAddressScope => {
	const trimmed = address.trim();

	const octets = ipv4Octets(trimmed);
	if (octets) {
		const first = octets[0] ?? 0;
		const second = octets[1] ?? 0;
		if (first === 127) {
			return "loopback";
		}
		if (first === 10) {
			return "private";
		}
		if (first === 172 && second >= 16 && second <= 31) {
			return "private";
		}
		if (first === 192 && second === 168) {
			return "private";
		}
		if (first === 169 && second === 254) {
			return "link-local";
		}
		return "public";
	}

	if (isIpv6Address(trimmed)) {
		const normalized = (trimmed.split("%")[0] ?? "").toLowerCase();
		if (normalized === "::1") {
			return "loopback";
		}
		if (normalized.startsWith("fe80")) {
			return "link-local";
		}
		if (normalized.startsWith("fc") || normalized.startsWith("fd")) {
			return "unique-local";
		}
		return "public";
	}

	return "public";
};

const SCOPE_LABELS: Record<IpAddressScope, string> = {
	private: "Local network",
	"unique-local": "Local network (IPv6)",
	"link-local": "Link-local",
	loopback: "Loopback",
	public: "Public",
};

export const describeIpScope = (scope: IpAddressScope): string =>
	SCOPE_LABELS[scope];

/** Private/loopback/link-local addresses only resolve inside the network. */
export const isLocalIpScope = (scope: IpAddressScope): boolean =>
	scope !== "public";

const SORT_ORDER: Record<IpAddressScope, number> = {
	private: 0,
	"unique-local": 1,
	public: 2,
	"link-local": 3,
	loopback: 4,
};

/**
 * De-duplicates and orders candidate addresses so the machine's LAN address is
 * offered before its public or link-local ones.
 */
export const sortIpCandidates = (addresses: string[]): IpAddressCandidate[] =>
	Array.from(new Set(addresses))
		.filter(isValidIpAddress)
		.map((address) => ({ address, scope: classifyIpAddress(address) }))
		.sort(
			(a, b) =>
				SORT_ORDER[a.scope] - SORT_ORDER[b.scope] ||
				a.address.localeCompare(b.address),
		);
