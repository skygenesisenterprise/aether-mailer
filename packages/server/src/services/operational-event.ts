import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "../db";
import {
	type OperationalEventCategory,
	type OperationalEventSeverity,
	operationalEvents,
} from "../db/schema";

export interface PublishOperationalEventInput {
	organizationId: string;
	category: OperationalEventCategory;
	severity: OperationalEventSeverity;
	title: string;
	message: string;
	fingerprint: string;
	requiresAction?: boolean;
	resourceType?: string;
	resourceId?: string;
	resourceName?: string;
	resourceHref?: string;
}

export async function publishOperationalEvent(
	event: PublishOperationalEventInput,
) {
	const now = new Date().toISOString();

	await db
		.insert(operationalEvents)
		.values({
			...event,
			requiresAction: event.requiresAction ?? false,
			createdAt: now,
			updatedAt: now,
			lastSeenAt: now,
		})
		.onConflictDoUpdate({
			target: [
				operationalEvents.organizationId,
				operationalEvents.fingerprint,
			],
			set: {
				category: event.category,
				severity: event.severity,
				title: event.title,
				message: event.message,
				resourceType: event.resourceType ?? null,
				resourceId: event.resourceId ?? null,
				resourceName: event.resourceName ?? null,
				resourceHref: event.resourceHref ?? null,
				requiresAction: event.requiresAction ?? false,
				acknowledgedAt: sql`CASE
					WHEN ${operationalEvents.resolvedAt} IS NOT NULL THEN NULL
					ELSE ${operationalEvents.acknowledgedAt}
				END`,
				resolvedAt: null,
				occurrenceCount: sql`${operationalEvents.occurrenceCount} + 1`,
				updatedAt: now,
				lastSeenAt: now,
			},
		});
}

export async function resolveOperationalEvent(
	organizationId: string,
	fingerprint: string,
) {
	const now = new Date().toISOString();

	await db
		.update(operationalEvents)
		.set({ resolvedAt: now, updatedAt: now })
		.where(
			and(
				eq(operationalEvents.organizationId, organizationId),
				eq(operationalEvents.fingerprint, fingerprint),
				isNull(operationalEvents.resolvedAt),
			),
		);
}
