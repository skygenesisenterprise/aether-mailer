import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { capabilityLabel, identityCapabilityOrder } from "./sso-provider-meta";

interface Props {
	capabilities: Record<string, boolean>;
	className?: string;
	compact?: boolean;
}

export const SsoCapabilityMatrix = ({
	capabilities,
	className,
	compact = false,
}: Props) => {
	const entries = identityCapabilityOrder.filter(
		(key) => capabilities[key] !== undefined,
	);

	return (
		<div
			className={cn("flex flex-wrap gap-1.5", compact && "gap-1", className)}
		>
			{entries.map((key) => {
				const supported = capabilities[key];
				const label = capabilityLabel(key);
				return (
					<span
						key={key}
						title={`${label}: ${supported ? "supported" : "not supported"}`}
						className={cn(
							"inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium",
							compact && "px-1 text-[10px]",
							supported
								? "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
								: "border-border bg-muted/40 text-muted-foreground",
						)}
					>
						{supported ? (
							<Check className="size-3 shrink-0" aria-hidden="true" />
						) : (
							<Minus className="size-3 shrink-0" aria-hidden="true" />
						)}
						{label}
					</span>
				);
			})}
		</div>
	);
};
