import { flexRender, type useReactTable } from "@tanstack/react-table";
import type { LucideIcon } from "lucide-react";
import { ArrowUpDown, Loader2, RefreshCw, Search } from "lucide-react";
import type { ReactNode } from "react";
import { AlertBlock } from "@/components/shared/alert-block";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	Table as UiTable,
} from "@/components/ui/table";

/**
 * Shared building blocks for the Infrastructure consoles (Servers, Docker,
 * Swarm, Networks, Traefik Manager, Certificates). They keep every console on
 * the same shell, header, toolbar and state rendering as Networks.
 */

export const ConsoleShell = ({ children }: { children: ReactNode }) => (
	<Card className="min-h-[85vh] w-full rounded-xl bg-sidebar p-2.5">
		<div className="flex min-h-[calc(85vh-1.25rem)] w-full flex-col gap-6 rounded-xl bg-background p-4 shadow-md sm:p-6">
			{children}
		</div>
	</Card>
);

interface ConsoleHeaderProps {
	icon: LucideIcon;
	title: string;
	description: string;
	status?: ReactNode;
	actions?: ReactNode;
}

export const ConsoleHeader = ({
	icon: Icon,
	title,
	description,
	status,
	actions,
}: ConsoleHeaderProps) => (
	<header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
		<div className="space-y-1">
			<h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
				<Icon className="size-6 text-muted-foreground" aria-hidden />
				{title}
			</h1>
			<p className="text-sm text-muted-foreground">{description}</p>
			{status}
		</div>
		{actions && (
			<div className="flex flex-wrap items-center gap-2">{actions}</div>
		)}
	</header>
);

export const ConsoleBody = ({ children }: { children: ReactNode }) => (
	<div className="space-y-5 border-t pt-5">{children}</div>
);

interface ConsoleRefreshProps {
	onClick: () => void;
	isRefetching: boolean;
	disabled?: boolean;
	label?: string;
}

export const ConsoleRefresh = ({
	onClick,
	isRefetching,
	disabled,
	label = "Refresh",
}: ConsoleRefreshProps) => (
	<Button
		variant="outline"
		onClick={onClick}
		disabled={disabled || isRefetching}
	>
		<RefreshCw
			className={`size-4 ${isRefetching ? "animate-spin" : ""}`}
			aria-hidden
		/>
		{label}
	</Button>
);

export const ConsoleSearch = ({
	value,
	onChange,
	placeholder,
	ariaLabel,
	className,
}: {
	value: string;
	onChange: (value: string) => void;
	placeholder: string;
	ariaLabel: string;
	className?: string;
}) => (
	<div className={`relative ${className ?? ""}`}>
		<Search
			className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
			aria-hidden
		/>
		<Input
			className="pl-9"
			placeholder={placeholder}
			value={value}
			onChange={(event) => onChange(event.target.value)}
			aria-label={ariaLabel}
		/>
	</div>
);

export const ConsoleSummary = ({ children }: { children: ReactNode }) => (
	<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
);

export const SummaryMetric = ({
	label,
	value,
	detail,
}: {
	label: string;
	value: string | number;
	detail?: string;
}) => (
	<div className="rounded-md border px-4 py-3">
		<p className="text-sm text-muted-foreground">{label}</p>
		<p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
		{detail && <p className="mt-1 text-xs text-muted-foreground">{detail}</p>}
	</div>
);

export const ConsoleToolbar = ({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) => <div className={`grid gap-2 ${className ?? ""}`}>{children}</div>;

export const ConsoleLoading = ({ label }: { label: string }) => (
	<div
		className="flex min-h-56 items-center justify-center gap-2 text-sm text-muted-foreground"
		role="status"
	>
		{label}
		<Loader2 className="size-4 animate-spin" aria-hidden />
	</div>
);

export const ConsoleError = ({
	message,
	onRetry,
}: {
	message: string;
	onRetry: () => void;
}) => (
	<div className="space-y-3">
		<AlertBlock type="error">{message}</AlertBlock>
		<Button variant="outline" onClick={onRetry}>
			<RefreshCw className="size-4" aria-hidden />
			Retry
		</Button>
	</div>
);

export const ConsoleEmpty = ({
	icon: Icon,
	title,
	description,
	children,
	className,
}: {
	icon: LucideIcon;
	title: string;
	description: string;
	children?: ReactNode;
	className?: string;
}) => (
	<div
		className={`flex min-h-56 flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-8 text-center ${className ?? ""}`}
	>
		<Icon className="size-8 text-muted-foreground" aria-hidden />
		<div className="space-y-1">
			<p className="font-medium">{title}</p>
			<p className="max-w-lg text-sm text-muted-foreground">{description}</p>
		</div>
		{children && (
			<div className="flex flex-wrap justify-center gap-2">{children}</div>
		)}
	</div>
);

export const ConsoleNoMatch = ({
	message,
	onClear,
}: {
	message: string;
	onClear?: () => void;
}) => (
	<div className="flex min-h-40 flex-col items-center justify-center gap-3 text-center">
		<p className="text-sm text-muted-foreground">{message}</p>
		{onClear && (
			<Button variant="outline" onClick={onClear}>
				Clear filters
			</Button>
		)}
	</div>
);

export const SortableHeader = ({
	column,
	title,
}: {
	column: {
		getIsSorted: () => false | "asc" | "desc";
		toggleSorting: (asc: boolean) => void;
	};
	title: string;
}) => (
	<Button
		variant="ghost"
		className="-ml-3 h-8"
		onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
	>
		{title}
		<ArrowUpDown className="ml-2 size-4" aria-hidden />
	</Button>
);

type TableInstance<TData> = ReturnType<typeof useReactTable<TData>>;

export const ConsoleTable = <TData,>({
	table,
	empty,
}: {
	table: TableInstance<TData>;
	empty: string;
}) => {
	const rows = table.getRowModel().rows;
	const pageCount = table.getPageCount();
	const pageIndex = table.getState().pagination.pageIndex;

	if (!rows.length) {
		return (
			<div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
				{empty}
			</div>
		);
	}

	return (
		<>
			<div className="overflow-x-auto rounded-md border">
				<UiTable>
					<TableHeader>
						{table.getHeaderGroups().map((group) => (
							<TableRow key={group.id}>
								{group.headers.map((header) => (
									<TableHead key={header.id}>
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef.header,
													header.getContext(),
												)}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{rows.map((row) => (
							<TableRow key={row.id}>
								{row.getVisibleCells().map((cell) => (
									<TableCell key={cell.id}>
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</TableCell>
								))}
							</TableRow>
						))}
					</TableBody>
				</UiTable>
			</div>
			{pageCount > 1 && (
				<div className="flex items-center justify-end gap-4">
					<span className="text-sm text-muted-foreground">
						Page {pageIndex + 1} of {pageCount}
					</span>
					<div className="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => table.previousPage()}
							disabled={!table.getCanPreviousPage()}
						>
							Previous
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => table.nextPage()}
							disabled={!table.getCanNextPage()}
						>
							Next
						</Button>
					</div>
				</div>
			)}
		</>
	);
};

export const ConsoleDetailValue = ({
	label,
	children,
}: {
	label: string;
	children: ReactNode;
}) => (
	<div className="space-y-1">
		<dt className="text-xs text-muted-foreground">{label}</dt>
		<dd className="wrap-break-words font-medium">{children}</dd>
	</div>
);
