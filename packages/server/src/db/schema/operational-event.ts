import { relations } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	pgEnum,
	pgTable,
	text,
	uniqueIndex,
} from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";
import { organization } from "./account";

export const operationalEventCategory = pgEnum("operationalEventCategory", [
	"deployment",
	"server",
	"monitoring",
	"dns",
	"tls",
	"secrets",
	"git-provider",
	"security",
	"system",
]);

export const operationalEventSeverity = pgEnum("operationalEventSeverity", [
	"critical",
	"warning",
	"info",
	"success",
]);

export const operationalEvents = pgTable(
	"operational_event",
	{
		eventId: text("eventId")
			.notNull()
			.primaryKey()
			.$defaultFn(() => nanoid()),
		organizationId: text("organizationId")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		category: operationalEventCategory("category").notNull(),
		severity: operationalEventSeverity("severity").notNull(),
		title: text("title").notNull(),
		message: text("message").notNull(),
		fingerprint: text("fingerprint").notNull(),
		resourceType: text("resourceType"),
		resourceId: text("resourceId"),
		resourceName: text("resourceName"),
		resourceHref: text("resourceHref"),
		requiresAction: boolean("requiresAction").notNull().default(false),
		acknowledgedAt: text("acknowledgedAt"),
		resolvedAt: text("resolvedAt"),
		occurrenceCount: integer("occurrenceCount").notNull().default(1),
		createdAt: text("createdAt")
			.notNull()
			.$defaultFn(() => new Date().toISOString()),
		updatedAt: text("updatedAt")
			.notNull()
			.$defaultFn(() => new Date().toISOString()),
		lastSeenAt: text("lastSeenAt")
			.notNull()
			.$defaultFn(() => new Date().toISOString()),
	},
	(table) => [
		uniqueIndex("operational_event_org_fingerprint_idx").on(
			table.organizationId,
			table.fingerprint,
		),
		index("operational_event_org_recent_idx").on(
			table.organizationId,
			table.lastSeenAt,
		),
		index("operational_event_org_action_idx").on(
			table.organizationId,
			table.requiresAction,
			table.acknowledgedAt,
			table.resolvedAt,
		),
	],
);

export const operationalEventsRelations = relations(
	operationalEvents,
	({ one }) => ({
		organization: one(organization, {
			fields: [operationalEvents.organizationId],
			references: [organization.id],
		}),
	}),
);

export type OperationalEventCategory =
	(typeof operationalEventCategory.enumValues)[number];
export type OperationalEventSeverity =
	(typeof operationalEventSeverity.enumValues)[number];
