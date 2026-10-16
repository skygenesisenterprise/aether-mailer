"use client";

import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { ArrowLeft, Github, Loader2, LogIn } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { api } from "@/utils/api";
import { findProviderPreset } from "./sso-provider-presets";

const ssoEmailSchema = z.object({
	email: z
		.string()
		.min(1, "Enter your work email")
		.email("Enter a valid email address")
		.transform((v) => v.trim()),
});

type SSOEmailForm = z.infer<typeof ssoEmailSchema>;

const isDirectory = (kind: string | null) =>
	kind === "ldap" || kind === "active-directory";

interface SignInWithSSOProps {
	/** Content shown alongside the collapsed button (e.g. local form). */
	children?: React.ReactNode;
	/**
	 * When true the source is the only option: the form is shown directly with
	 * no toggle button and no local fallback (self-hosted with a source).
	 * When false the button is available and `children` stays as fallback
	 * (managed cloud, where an organization may not have SSO configured).
	 */
	enforce?: boolean;
}

/**
 * Sign-in through the configured identity source.
 *
 * Federated providers (OIDC, SAML) redirect to the IdP; directory providers
 * (LDAP, Active Directory) collect the password on this page.
 */
export function SignInWithSSO({
	children,
	enforce = false,
}: SignInWithSSOProps) {
	const utils = api.useUtils();
	const [expanded, setExpanded] = useState(enforce);
	const [step, setStep] = useState<"email" | "password">("email");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isPending, setIsPending] = useState(false);

	const form = useForm<SSOEmailForm>({
		resolver: zodResolver(ssoEmailSchema),
		defaultValues: { email: "" },
	});

	// A social source (GitHub) is a one-click sign-in: no email to type, so it
	// is offered above the address form whenever one is configured.
	const { data: socialProvider } = api.sso.socialProvider.useQuery(undefined, {
		retry: false,
		refetchOnWindowFocus: false,
	});
	const socialLabel = socialProvider
		? (findProviderPreset(socialProvider.provider)?.label ?? "SSO")
		: null;

	const startSocialSignIn = () => {
		if (!socialProvider) return;
		window.location.href = `/api/auth/sign-in/social-sso?providerId=${encodeURIComponent(
			socialProvider.providerId,
		)}`;
	};

	const onSubmitEmail = async (values: SSOEmailForm) => {
		setIsPending(true);
		try {
			const kind = await utils.sso.providerKind.fetch({ email: values.email });
			if (isDirectory(kind)) {
				setEmail(values.email);
				setStep("password");
				return;
			}

			const { data, error } = await authClient.signIn.sso({
				email: values.email,
				callbackURL: "/dashboard/home",
				errorCallbackURL: "/",
			});
			if (error) {
				toast.error(error.message ?? "Failed to sign in with SSO");
				return;
			}
			if (data?.url) {
				window.location.href = data.url;
			}
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to sign in with SSO",
			);
		} finally {
			setIsPending(false);
		}
	};

	const onSubmitPassword = async () => {
		if (!password) {
			toast.error("Enter your directory password");
			return;
		}
		setIsPending(true);
		try {
			const { error } = await authClient.$fetch("/sign-in/ldap", {
				method: "POST",
				body: { email, password },
			});
			if (error) {
				toast.error(error.message ?? "Invalid directory credentials");
				return;
			}
			window.location.href = "/dashboard/home";
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to sign in with directory",
			);
		} finally {
			setIsPending(false);
		}
	};

	if (!expanded) {
		return (
			<div className="mb-4 space-y-2">
				<Button
					type="button"
					variant="outline"
					className="w-full"
					onClick={() => setExpanded(true)}
				>
					<LogIn className="mr-2 size-4" />
					Sign in with SSO
				</Button>
				{!enforce && children}
			</div>
		);
	}

	if (step === "password") {
		return (
			<div className="mb-4 space-y-2">
				<form
					onSubmit={(event) => {
						event.preventDefault();
						void onSubmitPassword();
					}}
					className="space-y-2"
				>
					<div className="text-xs text-muted-foreground">
						Directory sign-in for <span className="font-medium">{email}</span>
					</div>
					<div className="flex gap-2">
						<Input
							type="password"
							placeholder="Directory password"
							className="flex-1"
							autoComplete="current-password"
							value={password}
							onChange={(event) => setPassword(event.target.value)}
							disabled={isPending}
						/>
						<Button type="submit" variant="outline" disabled={isPending}>
							{isPending ? (
								<Loader2 className="size-4 animate-spin" />
							) : (
								"Sign in"
							)}
						</Button>
					</div>
					<button
						type="button"
						onClick={() => {
							setStep("email");
							setPassword("");
						}}
						className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:underline"
					>
						<ArrowLeft className="size-3" />
						Use another email
					</button>
				</form>
			</div>
		);
	}

	return (
		<div className="mb-4 space-y-3">
			{socialProvider && (
				<Button
					type="button"
					variant="outline"
					className="w-full"
					onClick={startSocialSignIn}
				>
					<Github className="mr-2 size-4" />
					Continue with {socialLabel}
				</Button>
			)}
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmitEmail)} className="space-y-2">
					<FormField
						control={form.control}
						name="email"
						render={({ field }) => (
							<FormItem>
								<FormControl>
									<div className="flex gap-2">
										<Input
											type="email"
											placeholder="you@company.com"
											className="flex-1"
											autoComplete="email"
											disabled={isPending}
											{...field}
										/>
										<Button
											type="submit"
											variant="outline"
											disabled={isPending}
										>
											{isPending ? (
												<Loader2 className="size-4 animate-spin" />
											) : (
												"Continue"
											)}
										</Button>
									</div>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					{!enforce && (
						<button
							type="button"
							onClick={() => setExpanded(false)}
							className="text-xs text-muted-foreground hover:underline"
						>
							Use email and password instead
						</button>
					)}
				</form>
			</Form>
		</div>
	);
}
