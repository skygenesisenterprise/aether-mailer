import { db } from "@notploy/server/db";
import {
	organization,
	organizationRole,
} from "@notploy/server/db/schema";
import { and, eq } from "drizzle-orm";

/**
 * Resolves the role a new organization member should receive by default.
 *
 * Static roles are returned as-is. Custom roles are resolved only when they
 * actually exist for the organization, otherwise the member falls back to
 * `member`.
 */
export const resolveOrganizationDefaultRole = async (
	organizationId: string,
) => {
	const org = await db.query.organization.findFirst({
		where: eq(organization.id, organizationId),
		columns: { defaultRole: true },
	});
	const defaultRole = org?.defaultRole;

	if (!defaultRole || defaultRole === "owner") {
		return "member";
	}

	if (defaultRole === "admin" || defaultRole === "member") {
		return defaultRole;
	}

	const customRole = await db.query.organizationRole.findFirst({
		where: and(
			eq(organizationRole.organizationId, organizationId),
			eq(organizationRole.role, defaultRole),
		),
		columns: { id: true },
	});

	if (!customRole) {
		return "member";
	}

	return defaultRole;
};