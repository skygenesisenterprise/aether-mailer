import { format, startOfDay, endOfDay } from "date-fns";
import { ClipboardList, RefreshCw } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/utils/api";
import { type AuditLogFilters, DataTable } from "./data-table";

function AuditLogsContent() {
	const [pageIndex, setPageIndex] = React.useState(0);
	const [pageSize, setPageSize] = React.useState(50);
	const [sortOrder, setSortOrder] = React.useState<"desc" | "asc">("desc");
	const [filters, setFilters] = React.useState<AuditLogFilters>({
		action: "",
		resourceType: "",
		dateRange: undefined,
	});
	const [search, setSearch] = React.useState("");
	const [debouncedSearch, setDebouncedSearch] = React.useState("");

	React.useEffect(() => {
		const timeout = setTimeout(() => {
			setDebouncedSearch(search.trim());
			setPageIndex(0);
		}, 300);
		return () => clearTimeout(timeout);
	}, [search]);

	const handleFilterChange = <K extends keyof AuditLogFilters>(
		key: K,
		value: AuditLogFilters[K],
	) => {
		setFilters((previous) => ({ ...previous, [key]: value }));
		setPageIndex(0);
	};

	const clearFilters = () => {
		setSearch("");
		setDebouncedSearch("");
		setFilters({
			action: "",
			resourceType: "",
			dateRange: undefined,
		});
		setPageIndex(0);
	};

	const from = filters.dateRange?.from
		? startOfDay(filters.dateRange.from)
		: undefined;
	const to = filters.dateRange?.to
		? endOfDay(filters.dateRange.to)
		: filters.dateRange?.from
			? endOfDay(filters.dateRange.from)
			: undefined;
	const query = api.auditLog.all.useQuery(
		{
			search: debouncedSearch || undefined,
			action: filters.action || undefined,
			resourceType: filters.resourceType || undefined,
			from,
			to,
			limit: pageSize,
			offset: pageIndex * pageSize,
			sortOrder,
		},
		{
			placeholderData: (previousData) => previousData,
			refetchOnWindowFocus: false,
		},
	);

	const presets = [
		{ label: "Today", days: 0 },
		{ label: "7 days", days: 7 },
		{ label: "30 days", days: 30 },
	];

	return (
		<Card className="min-h-[85vh] w-full rounded-xl bg-sidebar p-2.5">
			<div className="flex h-full min-h-[calc(85vh-1.25rem)] flex-col gap-6 rounded-xl bg-background p-4 shadow-md sm:p-6">
				<header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
					<div className="space-y-1">
						<h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight">
							<ClipboardList
								className="size-6 text-muted-foreground"
								aria-hidden
							/>
							Audit Logs
						</h1>
						<p className="text-sm text-muted-foreground">
							Track user and administrative actions across your Notploy
							organization.
						</p>
					</div>
					<Button
						variant="outline"
						onClick={() => void query.refetch()}
						disabled={query.isFetching}
					>
						<RefreshCw
							className={`size-4 ${query.isFetching ? "animate-spin" : ""}`}
							aria-hidden
						/>
						Refresh
					</Button>
				</header>

				<DataTable
					data={query.data?.logs ?? []}
					total={query.data?.total ?? 0}
					pageIndex={pageIndex}
					pageSize={pageSize}
					filters={filters}
					search={search}
					sortOrder={sortOrder}
					presets={presets}
					isLoading={query.isPending}
					isError={query.isError}
					errorMessage={query.error?.message}
					onRetry={() => void query.refetch()}
					onSearchChange={setSearch}
					onSortOrderChange={(order) => {
						setSortOrder(order);
						setPageIndex(0);
					}}
					onPageChange={setPageIndex}
					onPageSizeChange={(size) => {
						setPageSize(size);
						setPageIndex(0);
					}}
					onFilterChange={handleFilterChange}
					onClearFilters={clearFilters}
				/>
			</div>
		</Card>
	);
}

export function ShowAuditLogs() {
	return <AuditLogsContent />;
}
