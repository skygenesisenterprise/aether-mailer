import { TRPCError } from "@trpc/server";
import { z } from "zod";

/**
 * Operations a CI/CD token may perform against the CI/CD API.
 *
 * Each one maps 1:1 to a procedure of the `cicd` router, so a token can be
 * narrowed down to exactly what a workflow needs (for example a read-only token
 * for a repository that only reports deployment status).
 */
export const CICD_ACTIONS = [
	"resolve",
	"deploy",
	"status",
	"logs",
	"cancel",
	"redeploy",
] as const;

export type CicdAction = (typeof CICD_ACTIONS)[number];

export const cicdActionSchema = z.enum(CICD_ACTIONS);

/**
 * Actions granted when a token's metadata does not list any.
 *
 * Deliberately minimal: a hand-written (or migrated) token without an explicit
 * action list gets what a deploy workflow needs and nothing else, so the
 * dangerous operations stay opt-in.
 */
export const CICD_DEFAULT_ACTIONS: CicdAction[] = ["resolve", "deploy", "status"];

export const cicdProviders = [
	"github",
	"gitlab",
	"bitbucket",
	"gitea",
	"generic",
] as const;

export type CicdProvider = (typeof cicdProviders)[number];

/**
 * What a CI/CD token is allowed to touch.
 *
 * Stored as JSON inside the API key's `metadata` column (the `apikey` table has
 * no organization/project foreign key, so this blob is the single source of
 * truth for a token's scope — the same reason `parseApiKeyOrganizationId` owns
 * the organization). A missing or empty list means "every environment" /
 * "every application" of the project; the project itself is always required.
 */
export interface CicdTokenScope {
	projectId: string;
	environmentIds?: string[];
	applicationIds?: string[];
	actions?: CicdAction[];
	/** Restricts the token to one CI provider. */
	provider?: CicdProvider;
	/** Restricts the token to one repository, `owner/name`. */
	repository?: string;
}

const cicdScopeSchema = z.object({
	projectId: z.string().min(1),
	environmentIds: z.array(z.string().min(1)).optional(),
	applicationIds: z.array(z.string().min(1)).optional(),
	actions: z.array(cicdActionSchema).optional(),
	provider: z.enum(cicdProviders).optional(),
	repository: z.string().min(1).optional(),
});

/**
 * Reads the CI/CD scope out of an API key's `metadata` column.
 *
 * Returns `undefined` for missing, unparsable or incomplete metadata: a token
 * without a scope is a regular personal API key and must never be accepted by
 * the CI/CD API, which is why callers treat `undefined` as "not a CI/CD token".
 */
export function parseCicdTokenScope(
	metadata: string | null | undefined,
): CicdTokenScope | undefined {
	if (!metadata) return undefined;
	try {
		const parsed: unknown = JSON.parse(metadata);
		if (!parsed || typeof parsed !== "object") return undefined;
		const { cicd } = parsed as { cicd?: unknown };
		const result = cicdScopeSchema.safeParse(cicd);
		if (!result.success) return undefined;
		return result.data;
	} catch {
		return undefined;
	}
}

/**
 * Builds the `metadata` blob for a CI/CD token.
 *
 * `organizationId` sits next to the scope because `validateRequest` reads it to
 * build the synthetic session every `x-api-key` request runs with.
 */
export function buildCicdApiKeyMetadata(input: {
	organizationId: string;
	scope: CicdTokenScope;
}): string {
	return JSON.stringify({
		organizationId: input.organizationId,
		cicd: {
			projectId: input.scope.projectId,
			...(input.scope.environmentIds?.length
				? { environmentIds: input.scope.environmentIds }
				: {}),
			...(input.scope.applicationIds?.length
				? { applicationIds: input.scope.applicationIds }
				: {}),
			...(input.scope.actions?.length
				? { actions: input.scope.actions }
				: {}),
			...(input.scope.provider ? { provider: input.scope.provider } : {}),
			...(input.scope.repository
				? { repository: input.scope.repository }
				: {}),
		},
	});
}

/**
 * Actions actually granted by a scope, filling in the defaults.
 */
export function resolveCicdActions(scope: CicdTokenScope): CicdAction[] {
	const actions = scope.actions?.length ? scope.actions : CICD_DEFAULT_ACTIONS;
	return [...new Set(actions)];
}

/**
 * `true` when the scope grants `action`.
 */
export function cicdScopeAllows(
	scope: CicdTokenScope,
	action: CicdAction,
): boolean {
	return resolveCicdActions(scope).includes(action);
}

/**
 * Throws unless `scope` covers `target` for `action`.
 *
 * Returns the error message instead of throwing so callers can decide between a
 * `FORBIDDEN` (the token is not allowed here) and a `NOT_FOUND` (the target does
 * not exist for this token), which keeps a token from being used to probe the
 * existence of resources outside its project.
 */
export function checkCicdTarget(
	scope: CicdTokenScope,
	action: CicdAction,
	target: {
		projectId: string;
		environmentId?: string | null;
		applicationId?: string | null;
		provider?: string | null;
		repository?: string | null;
	},
): string | undefined {
	if (!cicdScopeAllows(scope, action)) {
		return `This CI/CD token is not allowed to ${action}`;
	}

	if (scope.projectId !== target.projectId) {
		return `This CI/CD token is scoped to another project`;
	}

	if (
		scope.environmentIds?.length &&
		target.environmentId &&
		!scope.environmentIds.includes(target.environmentId)
	) {
		return "This CI/CD token is not allowed to deploy to this environment";
	}

	if (
		scope.applicationIds?.length &&
		target.applicationId &&
		!scope.applicationIds.includes(target.applicationId)
	) {
		return "This CI/CD token is not allowed to deploy this application";
	}

	if (scope.provider && target.provider && scope.provider !== target.provider) {
		return `This CI/CD token is restricted to ${scope.provider}`;
	}

	if (
		scope.repository &&
		target.repository &&
		scope.repository.toLowerCase() !== target.repository.toLowerCase()
	) {
		return `This CI/CD token is restricted to ${scope.repository}`;
	}

	return undefined;
}

/**
 * Same as {@link checkCicdTarget} but throws a `FORBIDDEN` tRPC error.
 *
 * Used by the CI/CD router; the pure {@link checkCicdTarget} stays testable
 * without a tRPC context.
 */
export function assertCicdTarget(
	scope: CicdTokenScope,
	action: CicdAction,
	target: Parameters<typeof checkCicdTarget>[2],
): void {
	const message = checkCicdTarget(scope, action, target);
	if (message) {
		throw new TRPCError({ code: "FORBIDDEN", message });
	}
}
