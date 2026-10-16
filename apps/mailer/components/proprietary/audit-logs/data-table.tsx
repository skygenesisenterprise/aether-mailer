import type { AuditLog } from "@notploy/server/db/schema";
import { format } from "date-fns";
import {
	CalendarDays,
	ChevronDown,
	Copy,
	FileJson,
	Loader2,
	Search,
	X,
} from "lucide-react";
import React from "react";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";
import { AlertBlock } from "@/components/shared/alert-block";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

const ACTION_OPTIONS = [
	"create",
	"update",
	"delete",
	"read",
	"deploy",
	"cancel",
	"redeploy",
	"login",
	"logout",
	"restore",
	"run",
	"start",
	"stop",
	"reload",
	"rebuild",
	"move",
] as const;

const RESOURCE_OPTIONS = [
	"project",
	"service",
	"environment",
	"deployment",
	"user",
	"customRole",
	"domain",
	"certificate",
	"registry",
	"server",
	"sshKey",
	"gitProvider",
	"destination",
	"notification",
	"settings",
	"session",
	"port",
	"redirect",
	"security",
	"schedule",
	"backup",
	"volumeBackup",
	"docker",
	"swarm",
	"previewDeployment",
	"organization",
	"cluster",
	"mount",
	"application",
	"compose",
	"network",
	"vaultProvider",
	"dnsProvider",
] as const;

const PAGE_SIZE_OPTIONS = [25, 50, 100, 200];

export interface AuditLogFilters {
	action: (typeof ACTION_OPTIONS)[number] | "";
	resourceType: (typeof RESOURCE_OPTIONS)[number] | "";
	dateRange: DateRange | undefined;
}

interface DataTableProps {
	data: AuditLog[];
	total: number;
	pageIndex: number;
	pageSize: number;
	filters: AuditLogFilters;
	search: string;
	sortOrder: "desc" | "asc";
	presets: Array<{ label: string; days: number }>;
	isLoading: boolean;
	isError: boolean;
	errorMessage?: string;
	onRetry: () => void;
	onSearchChange: (value: string) => void;
	onSortOrderChange: (value: "desc" | "asc") => void;
	onPageChange: (page: number) => void;
	onPageSizeChange: (size: number) => void;
	onFilterChange: <K extends keyof AuditLogFilters>(
		key: K,
		value: AuditLogFilters[K],
	) => void;
	onClearFilters: () => void;
}

export function DataTable({
	data,
	total,
	pageIndex,
	pageSize,
	filters,
	search,
	sortOrder,
	presets,
	isLoading,
	isError,
	errorMessage,
	onRetry,
	onSearchChange,
	onSortOrderChange,
	onPageChange,
	onPageSizeChange,
	onFilterChange,
	onClearFilters,
}: DataTableProps) {
	const pageCount = Math.ceil(total / pageSize);
	const hasFilters =
		search || filters.action || filters.resourceType || filters.dateRange;

	return (
		<div className="flex w-full flex-col gap-4">
			<div className="flex flex-wrap items-center gap-2">
				<div className="relative min-w-48 flex-1">
					<Search
						className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
						aria-hidden
					/>
					<input
						type="search"
						value={search}
						onChange={(event) => onSearchChange(event.target.value)}
						placeholder="Search actor, action, resource, or ID"
						aria-label="Search audit logs"
						className="flex h-9 w-full rounded-md border border-input bg-transparent py-1 pl-9 pr-3 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
					/>
				</div>
				<Select
					value={filters.action || "__all__"}
					onValueChange={(value) =>
						onFilterChange(
							"action",
							value === "__all__"
								? ""
								: (value as AuditLogFilters["action"]),
						)
					}
				>
					<SelectTrigger className="w-full sm:w-40" aria-label="Filter by action">
						<SelectValue placeholder="All actions" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="__all__">All actions</SelectItem>
						{ACTION_OPTIONS.map((action) => (
							<SelectItem key={action} value={action}>
								{humanize(action)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Select
					value={filters.resourceType || "__all__"}
					onValueChange={(value) =>
						onFilterChange(
							"resourceType",
							value === "__all__"
								? ""
								: (value as AuditLogFilters["resourceType"]),
						)
					}
				>
					<SelectTrigger
						className="w-full sm:w-44"
						aria-label="Filter by resource type"
					>
						<SelectValue placeholder="All resources" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="__all__">All resources</SelectItem>
						{RESOURCE_OPTIONS.map((resource) => (
							<SelectItem key={resource} value={resource}>
								{humanize(resource)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Popover>
					<PopoverTrigger asChild>
						<Button variant="outline" className="gap-2">
							<CalendarDays className="size-4" aria-hidden />
							{filters.dateRange?.from
								? filters.dateRange.to
									? `${format(filters.dateRange.from, "MMM d")} – ${format(filters.dateRange.to, "MMM d")}`
									: format(filters.dateRange.from, "MMM d, yyyy")
								: "Date range"}
							<ChevronDown className="size-4" aria-hidden />
						</Button>
					</PopoverTrigger>
					<PopoverContent align="end" className="w-auto p-3">
						<div className="mb-2 flex gap-2">
							{presets.map(({ label, days }) => {
								const from = new Date();
								from.setDate(from.getDate() - days);
								return (
									<Button
										key={label}
										variant="outline"
										size="sm"
										onClick={() =>
											onFilterChange("dateRange", { from, to: new Date() })
										}
									>
										{label}
									</Button>
								);
							})}
						</div>
						<Calendar
							mode="range"
							selected={filters.dateRange}
							onSelect={(range) => onFilterChange("dateRange", range)}
							numberOfMonths={1}
							autoFocus
						/>
					</PopoverContent>
				</Popover>
				<Select
					value={sortOrder}
					onValueChange={(value: "desc" | "asc") => onSortOrderChange(value)}
				>
					<SelectTrigger className="w-full sm:w-36" aria-label="Sort by date">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="desc">Newest first</SelectItem>
						<SelectItem value="asc">Oldest first</SelectItem>
					</SelectContent>
				</Select>
				{hasFilters && (
					<Button
						variant="ghost"
						onClick={onClearFilters}
						className="text-muted-foreground"
					>
						<X className="mr-1 size-4" aria-hidden />
						Clear
					</Button>
				)}
			</div>

			{isError ? (
				<div className="space-y-3 rounded-md border p-6">
					<AlertBlock type="error">
						Unable to load audit logs: {errorMessage ?? "Unknown API error"}
					</AlertBlock>
					<Button variant="outline" onClick={onRetry}>
						<Loader2 className="size-4" aria-hidden />
						Retry
					</Button>
				</div>
			) : (
				<div className="overflow-x-auto rounded-md border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Date</TableHead>
								<TableHead>Actor</TableHead>
								<TableHead>Action</TableHead>
								<TableHead>Resource</TableHead>
								<TableHead>Name / ID</TableHead>
								<TableHead>Role</TableHead>
								<TableHead className="w-28">Details</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{isLoading ? (
								<TableRow>
									<TableCell
										colSpan={7}
										className="h-28 text-center text-muted-foreground"
									>
										<span className="inline-flex items-center gap-2">
											<Loader2 className="size-4 animate-spin" aria-hidden />
											Loading audit history…
										</span>
									</TableCell>
								</TableRow>
							) : data.length ? (
								data.map((entry) => <AuditLogRow key={entry.id} entry={entry} />)
							) : (
								<TableRow>
									<TableCell
										colSpan={7}
										className="h-36 text-center text-muted-foreground"
									>
										<div className="space-y-1">
											<p className="font-medium text-foreground">
												No audit logs
											</p>
											<p>
												Actions performed in this organization will appear
												here.
											</p>
										</div>
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
			)}

			{!isError && (
				<div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
					<span>
						{total} {total === 1 ? "entry" : "entries"} total
					</span>
					<div className="flex flex-wrap items-center gap-3">
						<label className="flex items-center gap-2 whitespace-nowrap">
							<span>Rows per page</span>
							<Select
								value={String(pageSize)}
								onValueChange={(value) => onPageSizeChange(Number(value))}
							>
								<SelectTrigger className="h-8 w-20">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{PAGE_SIZE_OPTIONS.map((size) => (
										<SelectItem key={size} value={String(size)}>
											{size}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</label>
						<span className="whitespace-nowrap">
							Page {pageIndex + 1} of {Math.max(1, pageCount)}
						</span>
						<div className="flex gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => onPageChange(pageIndex - 1)}
								disabled={pageIndex === 0 || isLoading}
							>
								Previous
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => onPageChange(pageIndex + 1)}
								disabled={pageIndex + 1 >= pageCount || isLoading}
							>
								Next
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

function AuditLogRow({ entry }: { entry: AuditLog }) {
	return (
		<TableRow>
			<TableCell className="whitespace-nowrap text-sm text-muted-foreground">
				<time dateTime={entry.createdAt.toISOString()}>
					{format(entry.createdAt, "MMM d, yyyy HH:mm:ss")}
				</time>
			</TableCell>
			<TableCell className="min-w-40">
				<p className="font-medium">{entry.userEmail || "Unknown actor"}</p>
				<p className="text-xs text-muted-foreground">{entry.userId ?? "System"}</p>
			</TableCell>
			<TableCell>
				<span className="rounded-md border px-2 py-1 text-xs font-medium">
					{humanize(entry.action)}
				</span>
			</TableCell>
			<TableCell className="text-sm text-muted-foreground">
				{humanize(entry.resourceType)}
			</TableCell>
			<TableCell className="max-w-56">
				<p className="truncate text-sm font-medium" title={entry.resourceName ?? undefined}>
					{entry.resourceName || "—"}
				</p>
				{entry.resourceId && (
					<p
						className="truncate font-mono text-xs text-muted-foreground"
						title={entry.resourceId}
					>
						{entry.resourceId}
					</p>
				)}
			</TableCell>
			<TableCell className="text-sm capitalize text-muted-foreground">
				{entry.userRole}
			</TableCell>
			<TableCell>
				<AuditLogDetails entry={entry} />
			</TableCell>
		</TableRow>
	);
}

function AuditLogDetails({ entry }: { entry: AuditLog }) {
	const safeMetadata = React.useMemo(() => redactMetadata(entry.metadata), [entry.metadata]);
	const copyMetadata = async () => {
		try {
			await navigator.clipboard.writeText(safeMetadata);
			toast.success("Redacted metadata copied");
		} catch {
			toast.error("Could not copy metadata");
		}
	};

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant="outline" size="sm">
					<FileJson className="size-3.5" aria-hidden />
					Details
				</Button>
			</DialogTrigger>
			<DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>Audit log details</DialogTitle>
					<DialogDescription>
						Recorded actor and resource information for this Notploy action.
					</DialogDescription>
				</DialogHeader>
				<div className="grid gap-x-4 gap-y-3 rounded-lg border p-4 text-sm sm:grid-cols-2">
					<Detail label="Actor" value={entry.userEmail || "Unknown actor"} />
					<Detail label="Actor ID" value={entry.userId ?? "Unavailable"} />
					<Detail label="Role" value={entry.userRole} />
					<Detail label="Action" value={entry.action} />
					<Detail label="Resource type" value={entry.resourceType} />
					<Detail label="Resource name" value={entry.resourceName ?? "Unavailable"} />
					<Detail label="Resource ID" value={entry.resourceId ?? "Unavailable"} />
					<Detail label="Timestamp" value={format(entry.createdAt, "PPpp")} />
					<Detail label="Result" value="Not recorded by the current audit schema" />
					<Detail label="Source" value="Not recorded by the current audit schema" />
				</div>
				{entry.metadata && (
					<details className="rounded-lg border">
						<summary className="flex cursor-pointer list-none items-center justify-between gap-2 p-3 text-sm font-medium">
							Metadata
							<Button
								variant="ghost"
								size="sm"
								onClick={(event) => {
									event.preventDefault();
									void copyMetadata();
								}}
							>
								<Copy className="size-3.5" aria-hidden />
								Copy redacted
							</Button>
						</summary>
						<pre className="max-h-80 overflow-auto border-t p-3 text-xs">
							{safeMetadata}
						</pre>
					</details>
				)}
			</DialogContent>
		</Dialog>
	);
}

function Detail({ label, value }: { label: string; value: string }) {
	return (
		<div className="min-w-0">
			<p className="text-xs text-muted-foreground">{label}</p>
			<p className="mt-1 break-words font-medium">{value}</p>
		</div>
	);
}

function redactMetadata(metadata: string | null) {
	if (!metadata) return "";
	try {
		return JSON.stringify(redactValue(JSON.parse(metadata)), null, 2);
	} catch {
		return "[Metadata unavailable]";
	}
}

function redactValue(value: unknown, key = ""): unknown {
	if (/(password|secret|token|api.?key|credential|private.?key|authorization|cookie)/i.test(key)) {
		return "[REDACTED]";
	}
	if (Array.isArray(value)) {
		return value.map((item) => redactValue(item));
	}
	if (value && typeof value === "object") {
		return Object.fromEntries(
			Object.entries(value).map(([childKey, childValue]) => [
				childKey,
				redactValue(childValue, childKey),
			]),
		);
	}
	return value;
}

function humanize(value: string) {
	return value
		.replace(/([a-z])([A-Z])/g, "$1 $2")
		.replace(/[-_]/g, " ")
		.replace(/\b\w/g, (letter) => letter.toUpperCase());
}
