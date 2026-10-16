import { cn } from "@/lib/utils";

interface Props {
	className?: string;
	logoUrl?: string;
}

export const Logo = ({ className = "size-14", logoUrl }: Props) => {
	if (logoUrl) {
		return (
			// biome-ignore lint/performance/noImgElement: this is for dynamic logo loading
			<img
				src={logoUrl}
				alt="Organization Logo"
				className={cn(className, "object-contain rounded-sm")}
			/>
		);
	}

	return (
		<picture className="contents">
			<source media="(prefers-color-scheme: dark)" srcSet="/icon-dark.svg" />
			<img
				src="/icon-light.svg"
				alt="Notploy"
				className={cn(className, "object-contain")}
			/>
		</picture>
	);
};
