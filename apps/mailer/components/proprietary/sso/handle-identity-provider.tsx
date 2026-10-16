"use client";

import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { PenBoxIcon, PlusIcon } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { identityProviderIcon } from "@/components/icons/identity-provider-icons";
import { AlertBlock } from "@/components/shared/alert-block";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { api } from "@/utils/api";
import { useUrl } from "@/utils/hooks/use-url";
import {
	isProviderProtocolImplemented,
	providerProtocolLabels,
	resolveProviderProtocol,
} from "./sso-provider-meta";
import {
	findProviderPreset,
	identityProviderPresets,
	presetForProvider,
	providerPresetGroups,
} from "./sso-provider-presets";

const PROTOCOLS = [
	"oidc",
	"saml",
	"ldap",
	"active-directory",
	"oauth2",
] as const;
type Protocol = (typeof PROTOCOLS)[number];

const isDirectoryProtocol = (
	protocol: Protocol,
): protocol is "ldap" | "active-directory" =>
	protocol === "ldap" || protocol === "active-directory";

/** Protocols whose issuer is typed by the operator; the rest fix it. */
const isFederatedProtocol = (protocol: Protocol) =>
	protocol === "oidc" || protocol === "saml";

const DEFAULT_SCOPES = ["openid", "email", "profile"];

const parseDomains = (value: string) =>
	value
		.split(/[\n,]/)
		.map((domain) => domain.trim().toLowerCase())
		.filter(Boolean);

const parseScopes = (value: string) =>
	value
		.split(/[\s,]+/)
		.map((scope) => scope.trim())
		.filter(Boolean);

const optional = (value: string) => (value.trim() ? value.trim() : undefined);

const identityProviderSchema = z.object({
	protocol: z.enum(PROTOCOLS),
	preset: z.string().min(1, "Provider is required"),
	providerId: z.string().min(1, "Provider ID is required").trim(),
	issuer: z.string().trim(),
	domains: z.string().superRefine((value, ctx) => {
		if (parseDomains(value).length < 1) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "At least one domain is required",
				path: [],
			});
		}
	}),
	// OIDC
	clientId: z.string(),
	clientSecret: z.string(),
	scopes: z.string(),
	mappingId: z.string(),
	mappingEmail: z.string(),
	mappingEmailVerified: z.string(),
	mappingName: z.string(),
	mappingImage: z.string(),
	// SAML
	entryPoint: z.string(),
	cert: z.string(),
	idpMetadataXml: z.string(),
	// LDAP / Active Directory
	ldapUrl: z.string(),
	ldapBindDn: z.string(),
	ldapBindPassword: z.string(),
	ldapBaseDn: z.string(),
	ldapUserSearchFilter: z.string(),
	ldapEmailAttribute: z.string(),
	ldapNameAttribute: z.string(),
	ldapIdAttribute: z.string(),
	ldapStartTls: z.boolean(),
	ldapTlsSkipVerify: z.boolean(),
});

type IdentityProviderForm = z.infer<typeof identityProviderSchema>;

interface ClaimMapping {
	id: string;
	email: string;
	emailVerified: string;
	name: string;
	image: string;
}

const genericMapping: ClaimMapping = {
	id: "sub",
	email: "email",
	emailVerified: "email_verified",
	name: "preferred_username",
	image: "picture",
};

// Microsoft Graph UserInfo returns `email`, not `preferred_username`, so
// discovery-based login needs the `email` claim for Azure/Entra providers.
const azureMapping: ClaimMapping = {
	id: "sub",
	email: "email",
	emailVerified: "email_verified",
	name: "name",
	image: "",
};

const isAzureIssuer = (issuer: string) =>
	issuer.includes("login.microsoftonline.com");

const defaultMappingFor = (issuer: string): ClaimMapping =>
	isAzureIssuer(issuer) ? azureMapping : genericMapping;

const MAPPING_FIELDS: Array<{
	name:
		| "mappingId"
		| "mappingEmail"
		| "mappingEmailVerified"
		| "mappingName"
		| "mappingImage";
	label: string;
	placeholder: string;
	optional?: boolean;
}> = [
	{ name: "mappingId", label: "User ID", placeholder: "sub" },
	{ name: "mappingEmail", label: "Email", placeholder: "email" },
	{
		name: "mappingEmailVerified",
		label: "Email verified",
		placeholder: "email_verified",
		optional: true,
	},
	{ name: "mappingName", label: "Name", placeholder: "name" },
	{
		name: "mappingImage",
		label: "Image",
		placeholder: "picture",
		optional: true,
	},
];

const defaultValues: IdentityProviderForm = {
	protocol: "oidc",
	preset: "oidc",
	providerId: "",
	issuer: "",
	domains: "",
	clientId: "",
	clientSecret: "",
	scopes: DEFAULT_SCOPES.join(", "),
	mappingId: genericMapping.id,
	mappingEmail: genericMapping.email,
	mappingEmailVerified: genericMapping.emailVerified,
	mappingName: genericMapping.name,
	mappingImage: genericMapping.image,
	entryPoint: "",
	cert: "",
	idpMetadataXml: "",
	ldapUrl: "",
	ldapBindDn: "",
	ldapBindPassword: "",
	ldapBaseDn: "",
	ldapUserSearchFilter: "(mail={{username}})",
	ldapEmailAttribute: "mail",
	ldapNameAttribute: "cn",
	ldapIdAttribute: "entryUUID",
	ldapStartTls: false,
	ldapTlsSkipVerify: false,
};

function parseOidcConfig(oidcConfig: string | null): {
	clientId?: string;
	scopes?: string[];
	mapping?: Partial<ClaimMapping>;
} | null {
	if (!oidcConfig) return null;
	try {
		const parsed = JSON.parse(oidcConfig) as {
			clientId?: string;
			scopes?: string[];
			mapping?: Partial<ClaimMapping>;
		};
		return {
			clientId: parsed.clientId,
			scopes: Array.isArray(parsed.scopes) ? parsed.scopes : undefined,
			mapping:
				parsed.mapping && typeof parsed.mapping === "object"
					? parsed.mapping
					: undefined,
		};
	} catch {
		return null;
	}
}

function parseSamlConfig(samlConfig: string | null): {
	entryPoint?: string;
	idpMetadataXml?: string;
} | null {
	if (!samlConfig) return null;
	try {
		const parsed = JSON.parse(samlConfig) as {
			entryPoint?: string;
			idpMetadata?: { metadata?: string };
		};
		return {
			entryPoint: parsed.entryPoint,
			idpMetadataXml: parsed.idpMetadata?.metadata,
		};
	} catch {
		return null;
	}
}

function parseOauthConfig(oauthConfig: string | null): {
	clientId?: string;
	scopes?: string[];
} | null {
	if (!oauthConfig) return null;
	try {
		const parsed = JSON.parse(oauthConfig) as {
			clientId?: string;
			scopes?: string[];
		};
		return {
			clientId: parsed.clientId,
			scopes: Array.isArray(parsed.scopes) ? parsed.scopes : undefined,
		};
	} catch {
		return null;
	}
}

function parseLdapConfig(ldapConfig: string | null): {
	directoryType?: "ldap" | "active-directory";
	url?: string;
	bindDn?: string;
	baseDn?: string;
	userSearchFilter?: string;
	emailAttribute?: string;
	nameAttribute?: string;
	idAttribute?: string;
	startTls?: boolean;
	tlsSkipVerify?: boolean;
} | null {
	if (!ldapConfig) return null;
	try {
		return JSON.parse(ldapConfig) as ReturnType<typeof parseLdapConfig>;
	} catch {
		return null;
	}
}

const buildSpMetadata = (baseURL: string, providerId: string) =>
	`<?xml version="1.0" encoding="UTF-8"?>
<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata" entityID="${baseURL}">
    <md:SPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
        <md:AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="${baseURL}/api/auth/sso/saml2/callback/${providerId}" index="1"/>
    </md:SPSSODescriptor>
</md:EntityDescriptor>`;

/**
 * Resolves the issuer a provider is stored under. Directories have no OIDC
 * issuer, so the directory URL is used as the stable identifier instead.
 */
const resolveIssuer = (data: IdentityProviderForm) =>
	isDirectoryProtocol(data.protocol) ? data.ldapUrl.trim() : data.issuer.trim();

const buildConfig = (data: IdentityProviderForm, baseURL: string) => {
	if (data.protocol === "oidc") {
		const scopes = parseScopes(data.scopes);
		const mapping = {
			id: data.mappingId.trim(),
			email: data.mappingEmail.trim(),
			name: data.mappingName.trim(),
			...(data.mappingEmailVerified.trim()
				? { emailVerified: data.mappingEmailVerified.trim() }
				: {}),
			...(data.mappingImage.trim() ? { image: data.mappingImage.trim() } : {}),
		};
		return {
			oidcConfig: {
				clientId: data.clientId.trim(),
				clientSecret: data.clientSecret,
				scopes: scopes.length ? scopes : DEFAULT_SCOPES,
				pkce: true,
				mapping,
			},
		};
	}
	if (data.protocol === "oauth2") {
		const scopes = parseScopes(data.scopes);
		return {
			oauthConfig: {
				provider: "github" as const,
				clientId: data.clientId.trim(),
				clientSecret: data.clientSecret,
				...(scopes.length ? { scopes } : {}),
			},
		};
	}
	if (data.protocol === "saml") {
		return {
			samlConfig: {
				entryPoint: data.entryPoint.trim(),
				cert: data.cert,
				callbackUrl: `${baseURL}/api/auth/sso/saml2/callback/${data.providerId}`,
				audience: baseURL,
				...(data.idpMetadataXml.trim()
					? { idpMetadata: { metadata: data.idpMetadataXml.trim() } }
					: {}),
				spMetadata: { metadata: buildSpMetadata(baseURL, data.providerId) },
				mapping: {
					id: "nameID",
					email: "email",
					name: "displayName",
					firstName: "givenName",
					lastName: "surname",
				},
			},
		};
	}
	if (isDirectoryProtocol(data.protocol)) {
		return {
			ldapConfig: {
				directoryType: data.protocol,
				url: data.ldapUrl.trim(),
				bindDn: optional(data.ldapBindDn),
				bindPassword: data.ldapBindPassword,
				baseDn: data.ldapBaseDn.trim(),
				userSearchFilter:
					optional(data.ldapUserSearchFilter) ?? "(mail={{username}})",
				emailAttribute: optional(data.ldapEmailAttribute) ?? "mail",
				nameAttribute: optional(data.ldapNameAttribute) ?? "cn",
				idAttribute: optional(data.ldapIdAttribute) ?? "entryUUID",
				startTls: data.ldapStartTls,
				tlsSkipVerify: data.ldapTlsSkipVerify,
			},
		};
	}
	return {};
};

const extractErrorMessage = (err: unknown) => {
	if (!(err instanceof Error)) return undefined;
	try {
		const issues = JSON.parse(err.message) as { message?: string }[];
		if (Array.isArray(issues)) {
			return issues
				.map((issue) => issue.message)
				.filter(Boolean)
				.join(", ");
		}
	} catch {}
	return err.message;
};

interface Props {
	providerId?: string;
	defaultProtocol?: Protocol;
	trigger?: ReactNode;
}

/**
 * Add / edit identity provider, modelled on the DNS provider dialog: a single
 * dialog with a protocol selector and the protocol's fields shown inline, plus
 * a connection check before saving. Supports federated (OIDC, SAML 2.0) and
 * directory (LDAP, Active Directory) sources.
 */
export const HandleIdentityProvider = ({
	providerId,
	defaultProtocol,
	trigger,
}: Props) => {
	const utils = api.useUtils();
	const [isOpen, setIsOpen] = useState(false);
	const baseURL = useUrl();

	const { data: provider } = api.sso.one.useQuery(
		{ providerId: providerId ?? "" },
		{ enabled: !!providerId && isOpen },
	);

	const registerMutation = api.sso.register.useMutation();
	const updateMutation = api.sso.update.useMutation();
	const { mutateAsync: testConnection, isPending: isTesting } =
		api.sso.testConnection.useMutation();

	const isEdit = !!providerId;
	const mutateAsync = isEdit
		? updateMutation.mutateAsync
		: registerMutation.mutateAsync;
	const isPending = isEdit
		? updateMutation.isPending
		: registerMutation.isPending;
	const error = isEdit ? updateMutation.error : registerMutation.error;
	const isError = isEdit ? updateMutation.isError : registerMutation.isError;

	const form = useForm<IdentityProviderForm>({
		defaultValues: {
			...defaultValues,
			...(defaultProtocol
				? { protocol: defaultProtocol, preset: defaultProtocol }
				: {}),
		},
		resolver: zodResolver(identityProviderSchema),
	});

	const watchedProtocol = useWatch({
		control: form.control,
		name: "protocol",
		defaultValue: "oidc",
	});
	const watchedIssuer = useWatch({
		control: form.control,
		name: "issuer",
		defaultValue: "",
	});
	const watchedProviderId = useWatch({
		control: form.control,
		name: "providerId",
		defaultValue: "",
	});
	const watchedPreset = useWatch({
		control: form.control,
		name: "preset",
		defaultValue: "oidc",
	});
	const activePreset = findProviderPreset(watchedPreset);

	// Load the stored provider into the form when editing. Secrets are never
	// returned by the API, so blank inputs mean "keep the stored value".
	useEffect(() => {
		if (provider) {
			const oidc = parseOidcConfig(provider.oidcConfig);
			const saml = parseSamlConfig(provider.samlConfig);
			const ldap = parseLdapConfig(provider.ldapConfig ?? null);
			const oauth = parseOauthConfig(provider.oauthConfig ?? null);
			const resolved = resolveProviderProtocol(provider);
			const resolvedProtocol = resolved === "custom" ? "oidc" : resolved;
			const baseMapping = defaultMappingFor(provider.issuer);
			form.reset({
				...defaultValues,
				protocol: resolvedProtocol,
				preset: presetForProvider({
					protocol: resolvedProtocol,
					issuer: provider.issuer,
				}),
				providerId: provider.providerId,
				issuer: provider.issuer,
				domains: provider.domain
					.split(",")
					.map((domain) => domain.trim())
					.filter(Boolean)
					.join("\n"),
				clientId: oidc?.clientId ?? oauth?.clientId ?? "",
				clientSecret: "",
				scopes:
					oidc?.scopes && oidc.scopes.length > 0
						? oidc.scopes.join(", ")
						: oauth?.scopes && oauth.scopes.length > 0
							? oauth.scopes.join(", ")
							: DEFAULT_SCOPES.join(", "),
				mappingId: oidc?.mapping?.id ?? baseMapping.id,
				mappingEmail: oidc?.mapping?.email ?? baseMapping.email,
				mappingEmailVerified: oidc?.mapping?.emailVerified ?? "",
				mappingName: oidc?.mapping?.name ?? baseMapping.name,
				mappingImage: oidc?.mapping?.image ?? "",
				entryPoint: saml?.entryPoint ?? "",
				cert: "",
				idpMetadataXml: saml?.idpMetadataXml ?? "",
				ldapUrl: ldap?.url ?? "",
				ldapBindDn: ldap?.bindDn ?? "",
				ldapBindPassword: "",
				ldapBaseDn: ldap?.baseDn ?? "",
				ldapUserSearchFilter:
					ldap?.userSearchFilter ?? defaultValues.ldapUserSearchFilter,
				ldapEmailAttribute:
					ldap?.emailAttribute ?? defaultValues.ldapEmailAttribute,
				ldapNameAttribute:
					ldap?.nameAttribute ?? defaultValues.ldapNameAttribute,
				ldapIdAttribute: ldap?.idAttribute ?? defaultValues.ldapIdAttribute,
				ldapStartTls: ldap?.startTls ?? false,
				ldapTlsSkipVerify: ldap?.tlsSkipVerify ?? false,
			});
		} else if (!providerId) {
			form.reset({
				...defaultValues,
				...(defaultProtocol
					? { protocol: defaultProtocol, preset: defaultProtocol }
					: {}),
			});
		}
	}, [provider, providerId, form, defaultProtocol]);

	// Register mode: a vendor preset seeds the protocol, issuer, scopes, claim
	// mapping and directory defaults the vendor is known to use. Every field
	// stays editable, so a preset is a starting point rather than a constraint.
	useEffect(() => {
		if (isEdit) return;
		const preset = findProviderPreset(watchedPreset);
		if (!preset) return;

		form.setValue("protocol", preset.protocol);

		if (preset.issuer !== undefined) {
			form.setValue("issuer", preset.issuer);
		}
		if (preset.scopes) {
			form.setValue("scopes", preset.scopes.join(", "));
		}

		const mapping =
			preset.mapping ?? (preset.protocol === "oidc" ? genericMapping : null);
		if (mapping) {
			form.setValue("mappingId", mapping.id);
			form.setValue("mappingEmail", mapping.email);
			form.setValue("mappingEmailVerified", mapping.emailVerified ?? "");
			form.setValue("mappingName", mapping.name);
			form.setValue("mappingImage", mapping.image ?? "");
		}

		if (preset.directory) {
			const { userSearchFilter, emailAttribute, nameAttribute, idAttribute } =
				preset.directory;
			if (userSearchFilter) {
				form.setValue("ldapUserSearchFilter", userSearchFilter);
			}
			if (emailAttribute) form.setValue("ldapEmailAttribute", emailAttribute);
			if (nameAttribute) form.setValue("ldapNameAttribute", nameAttribute);
			if (idAttribute) form.setValue("ldapIdAttribute", idAttribute);
		}

		// Suggest a provider id from the vendor preset, unless the operator already
		// typed one. Generic entries keep the field empty on purpose.
		const suggestedId = preset.id === preset.protocol ? "" : preset.id;
		const currentProviderId = form.getValues("providerId").trim();
		const isSuggested =
			currentProviderId === "" ||
			identityProviderPresets.some((item) => item.id === currentProviderId);
		if (isSuggested && currentProviderId !== suggestedId) {
			form.setValue("providerId", suggestedId);
		}
	}, [watchedPreset, isEdit, form]);

	// Register mode: keep the OIDC mapping defaults in sync with the issuer for
	// the generic OIDC entry, so a manually typed Azure/Entra issuer still gets
	// the `email`-claim default.
	useEffect(() => {
		if (isEdit || watchedProtocol !== "oidc" || watchedPreset !== "oidc")
			return;
		const mapping = defaultMappingFor(watchedIssuer);
		form.setValue("mappingId", mapping.id);
		form.setValue("mappingEmail", mapping.email);
		form.setValue("mappingEmailVerified", mapping.emailVerified);
		form.setValue("mappingName", mapping.name);
		form.setValue("mappingImage", mapping.image);
	}, [watchedIssuer, watchedProtocol, watchedPreset, isEdit, form]);

	const onSubmit = async (data: IdentityProviderForm) => {
		if (!isProviderProtocolImplemented(data.protocol)) {
			toast.error("This protocol is not available yet");
			return;
		}
		if (data.protocol === "oidc") {
			if (!data.issuer.trim()) {
				form.setError("issuer", { message: "Issuer URL is required" });
				return;
			}
			if (!data.clientId.trim()) {
				form.setError("clientId", { message: "Client ID is required" });
				return;
			}
			if (!isEdit && !data.clientSecret.trim()) {
				form.setError("clientSecret", { message: "Client secret is required" });
				return;
			}
		}
		if (data.protocol === "oauth2") {
			if (!data.clientId.trim()) {
				form.setError("clientId", { message: "Client ID is required" });
				return;
			}
			if (!isEdit && !data.clientSecret.trim()) {
				form.setError("clientSecret", { message: "Client secret is required" });
				return;
			}
		}
		if (data.protocol === "saml") {
			if (!data.entryPoint.trim()) {
				form.setError("entryPoint", { message: "IdP SSO URL is required" });
				return;
			}
			if (!isEdit && !data.cert.trim()) {
				form.setError("cert", {
					message: "IdP signing certificate is required",
				});
				return;
			}
		}
		if (isDirectoryProtocol(data.protocol)) {
			if (!data.ldapUrl.trim()) {
				form.setError("ldapUrl", { message: "Server URL is required" });
				return;
			}
			if (!data.ldapBaseDn.trim()) {
				form.setError("ldapBaseDn", { message: "Base DN is required" });
				return;
			}
			// A bind DN requires a password on create; during edit a blank password
			// keeps the stored one. Anonymous bind (no DN) is allowed.
			if (data.ldapBindDn.trim() && !isEdit && !data.ldapBindPassword.trim()) {
				form.setError("ldapBindPassword", {
					message: "Bind password is required when a bind DN is set",
				});
				return;
			}
		}

		const payload: any = {
			providerId: data.providerId,
			issuer: resolveIssuer(data),
			domains: parseDomains(data.domains),
			...buildConfig(data, baseURL),
		};

		await mutateAsync(payload)
			.then(async () => {
				toast.success(
					isEdit ? "Identity provider updated" : "Identity provider registered",
				);
				await utils.sso.listProviders.invalidate();
				if (!isEdit) {
					form.reset({
						...defaultValues,
						...(defaultProtocol
							? { protocol: defaultProtocol, preset: defaultProtocol }
							: {}),
					});
				}
				setIsOpen(false);
			})
			.catch((err) => {
				toast.error(
					err instanceof Error
						? err.message
						: "Failed to save identity provider",
				);
			});
	};

	const onTestConnection = async () => {
		const isValid = await form.trigger();
		if (!isValid) return;
		const data = form.getValues();
		if (!isProviderProtocolImplemented(data.protocol)) {
			toast.error("This protocol is not available yet");
			return;
		}
		await testConnection({
			providerId,
			issuer: resolveIssuer(data) || data.issuer,
			...buildConfig(data, baseURL),
		})
			.then((result) => {
				if (result.status === "connected") {
					toast.success("Connection successful");
					return;
				}
				toast.error("Connection check failed", {
					description: result.message ?? result.remediation ?? undefined,
				});
			})
			.catch((err) => {
				toast.error("Connection failed", {
					description: extractErrorMessage(err),
				});
			});
	};

	const protocolFields = () => {
		switch (watchedProtocol) {
			case "oidc":
				return (
					<>
						<div className="grid grid-cols-2 gap-3">
							<FormField
								control={form.control}
								name="clientId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Client ID</FormLabel>
										<FormControl>
											<Input placeholder="Client ID from IdP" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="clientSecret"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Client secret</FormLabel>
										<FormControl>
											<Input
												type="password"
												placeholder={
													isEdit
														? "Leave blank to keep the current secret"
														: "Client secret from IdP"
												}
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<FormField
							control={form.control}
							name="scopes"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Scopes (optional)</FormLabel>
									<FormControl>
										<Input placeholder="openid, email, profile" {...field} />
									</FormControl>
									<FormDescription>
										OIDC scopes to request. Empty falls back to openid, email
										and profile.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className="space-y-2">
							<FormLabel>Claim mapping</FormLabel>
							<FormDescription>
								Which provider claims map to each user field. Defaults adapt to
								the issuer.
							</FormDescription>
							<div className="grid grid-cols-2 gap-3">
								{MAPPING_FIELDS.map(
									({ name, label, placeholder, optional: isOptional }) => (
										<FormField
											key={name}
											control={form.control}
											name={name}
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-xs text-muted-foreground">
														{label}
														{isOptional ? " (optional)" : ""}
													</FormLabel>
													<FormControl>
														<Input placeholder={placeholder} {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									),
								)}
							</div>
						</div>
					</>
				);
			case "oauth2":
				return (
					<>
						<div className="grid grid-cols-2 gap-3">
							<FormField
								control={form.control}
								name="clientId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Client ID</FormLabel>
										<FormControl>
											<Input
												placeholder="GitHub OAuth app client ID"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="clientSecret"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Client secret</FormLabel>
										<FormControl>
											<Input
												type="password"
												placeholder={
													isEdit
														? "Leave blank to keep the current secret"
														: "GitHub OAuth app client secret"
												}
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<FormField
							control={form.control}
							name="scopes"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Scopes (optional)</FormLabel>
									<FormControl>
										<Input placeholder="read:user, user:email" {...field} />
									</FormControl>
									<FormDescription>
										Scopes requested from GitHub. The defaults read the profile
										and a verified email address.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
					</>
				);
			case "saml":
				return (
					<>
						<FormField
							control={form.control}
							name="entryPoint"
							render={({ field }) => (
								<FormItem>
									<FormLabel>IdP SSO URL (Entry point)</FormLabel>
									<FormControl>
										<Input
											placeholder={
												activePreset?.entryPointPlaceholder ??
												"https://idp.example.com/sso"
											}
											{...field}
										/>
									</FormControl>
									<FormDescription>
										Single Sign-On URL from your IdP&apos;s SAML setup.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className="grid grid-cols-2 gap-3">
							<FormField
								control={form.control}
								name="cert"
								render={({ field }) => (
									<FormItem>
										<FormLabel>IdP signing certificate (X.509)</FormLabel>
										<FormControl>
											<Textarea
												placeholder={
													isEdit
														? "Leave blank to keep the current certificate"
														: "Paste IdP signing certificate (PEM, BEGIN CERTIFICATE / END CERTIFICATE)"
												}
												rows={4}
												className="font-mono text-xs"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="idpMetadataXml"
								render={({ field }) => (
									<FormItem>
										<FormLabel>IdP metadata XML (optional)</FormLabel>
										<FormControl>
											<Textarea
												placeholder="Paste full IdP metadata XML (EntityDescriptor) to override issuer, entry point and certificate."
												rows={4}
												className="font-mono text-xs"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
					</>
				);
			case "ldap":
			case "active-directory":
				return (
					<div className="grid grid-cols-2 gap-3">
						<FormField
							control={form.control}
							name="ldapUrl"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Server URL</FormLabel>
									<FormControl>
										<Input
											placeholder={
												activePreset?.directory?.urlPlaceholder ??
												"ldap://ldap.example.com:389"
											}
											{...field}
										/>
									</FormControl>
									<FormDescription>
										Directory endpoint. Use{" "}
										<code className="rounded bg-muted px-1">ldaps://</code> or{" "}
										<code className="rounded bg-muted px-1">ldap://</code>.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="ldapBindDn"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Bind DN (optional)</FormLabel>
									<FormControl>
										<Input
											placeholder={
												watchedProtocol === "active-directory"
													? "CN=svc-notploy,OU=Service,DC=corp,DC=example,DC=com"
													: "cn=admin,dc=example,dc=com"
											}
											{...field}
										/>
									</FormControl>
									<FormDescription>
										Service account used to search the directory. Leave empty
										for anonymous bind.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="ldapBindPassword"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Bind password</FormLabel>
									<FormControl>
										<Input
											type="password"
											placeholder={
												isEdit
													? "Leave blank to keep the current password"
													: "Password for the bind DN"
											}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="ldapBaseDn"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Base DN</FormLabel>
									<FormControl>
										<Input
											placeholder={
												activePreset?.directory?.baseDnPlaceholder ??
												"ou=users,dc=example,dc=com"
											}
											{...field}
										/>
									</FormControl>
									<FormDescription>
										Subtree searched for user entries.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="ldapUserSearchFilter"
							render={({ field }) => (
								<FormItem className="col-span-2">
									<FormLabel>User search filter</FormLabel>
									<FormControl>
										<Input
											placeholder="(mail={{username}})"
											className="font-mono text-xs"
											{...field}
										/>
									</FormControl>
									<FormDescription>
										LDAP filter used to locate the user.{" "}
										<code className="rounded bg-muted px-1">
											{"{{username}}"}
										</code>{" "}
										is replaced with the submitted identifier.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className="col-span-2 grid grid-cols-3 gap-3">
							<FormField
								control={form.control}
								name="ldapEmailAttribute"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="text-xs text-muted-foreground">
											Email attribute
										</FormLabel>
										<FormControl>
											<Input placeholder="mail" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="ldapNameAttribute"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="text-xs text-muted-foreground">
											Name attribute
										</FormLabel>
										<FormControl>
											<Input placeholder="cn" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="ldapIdAttribute"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="text-xs text-muted-foreground">
											ID attribute
										</FormLabel>
										<FormControl>
											<Input placeholder="entryUUID" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<FormField
							control={form.control}
							name="ldapStartTls"
							render={({ field }) => (
								<FormItem className="flex flex-row items-center justify-between gap-3 rounded-lg border p-3">
									<div className="flex flex-col gap-0.5">
										<FormLabel className="text-sm">StartTLS</FormLabel>
										<FormDescription>
											Upgrade a plain{" "}
											<code className="rounded bg-muted px-1">ldap://</code>{" "}
											connection to TLS before binding.
										</FormDescription>
									</div>
									<FormControl>
										<Switch
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="ldapTlsSkipVerify"
							render={({ field }) => (
								<FormItem className="flex flex-row items-center justify-between gap-3 rounded-lg border p-3">
									<div className="flex flex-col gap-0.5">
										<FormLabel className="text-sm">
											Allow self-signed certificate
										</FormLabel>
										<FormDescription>
											Skip TLS certificate verification for an internal
											directory.
										</FormDescription>
									</div>
									<FormControl>
										<Switch
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
								</FormItem>
							)}
						/>
					</div>
				);
			default:
				return null;
		}
	};

	const protocolImplemented = isProviderProtocolImplemented(watchedProtocol);
	const isDirectory = isDirectoryProtocol(watchedProtocol as Protocol);
	// Social sources fix their issuer (github.com): only federated protocols let
	// the operator type one.
	const showIssuerField = isFederatedProtocol(watchedProtocol as Protocol);

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			{trigger ? (
				<DialogTrigger asChild>{trigger}</DialogTrigger>
			) : providerId ? (
				<Tooltip>
					<TooltipTrigger asChild>
						<DialogTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className="text-muted-foreground"
							>
								<PenBoxIcon className="size-4" />
								<span className="sr-only">Edit provider</span>
							</Button>
						</DialogTrigger>
					</TooltipTrigger>
					<TooltipContent>Edit provider</TooltipContent>
				</Tooltip>
			) : (
				<DialogTrigger asChild>
					<Button>
						<PlusIcon className="size-4" />
						Add Provider
					</Button>
				</DialogTrigger>
			)}
			<DialogContent className="max-h-screen overflow-y-auto sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>
						{isEdit ? "Update Identity Provider" : "Add Identity Provider"}
					</DialogTitle>
					<DialogDescription>
						Connect the identity infrastructure you already run. Once a provider
						is saved, users sign in through it instead of local passwords.
					</DialogDescription>
				</DialogHeader>
				{isError && <AlertBlock type="error">{error?.message}</AlertBlock>}
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="grid w-full gap-4"
					>
						<div className="grid grid-cols-2 gap-3">
							<FormField
								control={form.control}
								name="preset"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Provider</FormLabel>
										<Select
											onValueChange={field.onChange}
											value={field.value}
											disabled={isEdit}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select a provider" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{providerPresetGroups.map((group) => (
													<SelectGroup key={group.category}>
														<SelectLabel>{group.label}</SelectLabel>
														{group.presets.map((preset) => {
															const Icon = identityProviderIcon(
																preset.protocol,
															);
															return (
																<SelectItem key={preset.id} value={preset.id}>
																	<div className="flex flex-row items-center gap-2">
																		<Icon className="size-4 shrink-0" />
																		{preset.label}
																		{!isProviderProtocolImplemented(
																			preset.protocol,
																		) && (
																			<span className="text-muted-foreground">
																				· soon
																			</span>
																		)}
																	</div>
																</SelectItem>
															);
														})}
													</SelectGroup>
												))}
											</SelectContent>
										</Select>
										<FormDescription>
											{activePreset?.description}
											{watchedPreset !== "oidc" &&
												` · ${providerProtocolLabels[watchedProtocol]}`}
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="providerId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Provider ID</FormLabel>
										<FormControl>
											<Input
												placeholder="e.g. okta or corp-directory"
												{...field}
												readOnly={isEdit}
												className={isEdit ? "bg-muted" : undefined}
											/>
										</FormControl>
										<FormDescription>
											Unique identifier; used in the callback URL path.
											{isEdit && " Cannot be changed when editing."}
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<div
							className={
								showIssuerField ? "grid grid-cols-2 gap-3" : "grid gap-3"
							}
						>
							{showIssuerField && (
								<FormField
									control={form.control}
									name="issuer"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Issuer URL</FormLabel>
											<FormControl>
												<Input
													placeholder={
														activePreset?.issuerPlaceholder ??
														"https://idp.example.com"
													}
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							)}
							<FormField
								control={form.control}
								name="domains"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Domains</FormLabel>
										<FormControl>
											<Textarea
												placeholder={"company.com\nsubsidiary.com"}
												className="min-h-[56px] font-mono text-xs"
												{...field}
											/>
										</FormControl>
										<FormDescription>
											Email domains that use this provider (one per line or
											comma-separated). Subdomains are matched automatically.
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						{!isDirectory && baseURL && watchedProviderId?.trim() && (
							<div className="rounded-md bg-muted px-2.5 py-1.5 text-[11px]">
								<p className="font-medium text-muted-foreground">
									{watchedProtocol === "oauth2"
										? "Callback URL (configure in GitHub)"
										: "Callback URL (configure in your IdP)"}
								</p>
								<p className="mt-0.5 break-all font-mono">
									{baseURL}
									{watchedProtocol === "oauth2"
										? "/api/auth/sign-in/social-sso/callback"
										: watchedProtocol === "saml"
											? `/api/auth/sso/saml2/callback/${watchedProviderId.trim()}`
											: `/api/auth/sso/callback/${watchedProviderId.trim()}`}
								</p>
							</div>
						)}

						{protocolFields()}

						<DialogFooter className="flex w-full flex-row justify-between gap-2 sm:justify-between">
							<Button
								type="button"
								variant="secondary"
								isLoading={isTesting}
								disabled={!protocolImplemented}
								onClick={onTestConnection}
							>
								Test Connection
							</Button>
							<Button
								type="submit"
								isLoading={isPending}
								disabled={!protocolImplemented}
							>
								{isEdit ? "Update" : "Create"}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};
