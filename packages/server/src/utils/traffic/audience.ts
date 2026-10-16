import { z } from "zod";
import { normalizeRoute, referrerHostOf } from "./parse";

/**
 * Contract of the web instrumentation (`traffic.js` → `POST /api/traffic/events`).
 *
 * The payload is deliberately tiny and strict: unknown keys are rejected, so a
 * site cannot smuggle extra personal data into the collector by hoping the
 * server ignores it. What the browser may send is limited to what the Traffic
 * Manager actually reports:
 *
 * - a page view or an explicit event name (never an arbitrary property bag);
 * - the path, normalised server-side;
 * - the referrer, reduced to its host and dropped when it is internal;
 * - two random identifiers (session, visitor) generated and stored client-side.
 *
 * The device category is **derived on the server** from the `User-Agent` of the
 * ingest request and the raw header is never stored — the browser does not send
 * one at all.
 */

export const MAX_AUDIENCE_EVENTS_PER_REQUEST = 20;
export const MAX_AUDIENCE_PAYLOAD_BYTES = 16 * 1024;
const MAX_PATH_LENGTH = 512;
const MAX_IDENTIFIER_LENGTH = 64;
/** Timestamps further from now than this are clamped to the ingest time. */
const MAX_TIMESTAMP_SKEW_MS = 7 * 24 * 60 * 60 * 1000;

const identifier = z
	.string()
	.trim()
	.min(1)
	.max(MAX_IDENTIFIER_LENGTH)
	.regex(/^[A-Za-z0-9_-]+$/);

export const audienceEventSchema = z.strictObject({
	type: z.enum(["pageview", "event"]),
	/** Route of the page the visitor is on, when the event is a page view. */
	path: z.string().trim().max(MAX_PATH_LENGTH).optional(),
	/** Explicit event name, e.g. `signup_completed`. */
	name: z
		.string()
		.trim()
		.min(1)
		.max(64)
		.regex(/^[a-z0-9_.:-]+$/)
		.optional(),
	/** Full referrer URL; only its host is kept. */
	referrer: z.string().trim().max(MAX_PATH_LENGTH).optional(),
	sessionId: identifier,
	visitorId: identifier,
	timestamp: z.string().trim().max(40).optional(),
});

export const audienceIngestPayloadSchema = z.strictObject({
	publicKey: z.string().trim().min(8).max(128),
	events: z
		.array(audienceEventSchema)
		.min(1)
		.max(MAX_AUDIENCE_EVENTS_PER_REQUEST),
});

export type AudienceIngestPayload = z.infer<typeof audienceIngestPayloadSchema>;
export type AudienceEventInput = z.infer<typeof audienceEventSchema>;

/** One scored audience event, ready to be written as an aggregate. */
export interface NormalizedAudienceEvent {
	kind: "pageview" | "event";
	/** Normalised page path (page views) or event name (explicit events). */
	path: string;
	name: string;
	referrerHost: string;
	timestamp: Date;
	sessionId: string;
	visitorId: string;
}

/** Accept a timestamp only when it is plausible, otherwise use the ingest time. */
const resolveTimestamp = (value: string | undefined, now: Date): Date => {
	if (!value) {
		return now;
	}
	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) {
		return now;
	}
	const skew = Math.abs(parsed.getTime() - now.getTime());
	return skew > MAX_TIMESTAMP_SKEW_MS ? now : parsed;
};

/**
 * Normalise validated events, dropping the events that cannot produce a useful
 * aggregate: an event without a name, or a page view without a path.
 *
 * `siteHost` is the property domain: a referrer pointing at the site itself is
 * an internal navigation, not an acquisition source, so it is stored as an
 * empty referrer rather than inflating the "direct/internal" bucket with the
 * site's own host.
 */
export const normalizeAudienceEvents = (
	payload: AudienceIngestPayload,
	options: { now?: Date; siteHost?: string } = {},
): NormalizedAudienceEvent[] => {
	const now = options.now ?? new Date();
	const siteHost = options.siteHost ?? "";

	return payload.events.flatMap<NormalizedAudienceEvent>((event) => {
		const rawReferrerHost = referrerHostOf(event.referrer);
		const referrerHost =
			siteHost !== "" && rawReferrerHost.endsWith(siteHost)
				? ""
				: rawReferrerHost;

		if (event.type === "event") {
			if (!event.name) {
				return [];
			}
			return [
				{
					kind: "event",
					path: normalizeRoute(event.path),
					name: event.name,
					referrerHost,
					timestamp: resolveTimestamp(event.timestamp, now),
					sessionId: event.sessionId,
					visitorId: event.visitorId,
				},
			];
		}

		return [
			{
				kind: "pageview",
				path: normalizeRoute(event.path),
				name: "pageview",
				referrerHost,
				timestamp: resolveTimestamp(event.timestamp, now),
				sessionId: event.sessionId,
				visitorId: event.visitorId,
			},
		];
	});
};

/** Cheap pre-validation: reject oversized bodies before parsing JSON. */
export const isAudiencePayloadSizeAcceptable = (
	rawBody: string | null | undefined,
): boolean =>
	typeof rawBody === "string" && rawBody.length <= MAX_AUDIENCE_PAYLOAD_BYTES;
