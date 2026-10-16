import {
	type UpdateStatus,
	UPDATE_INSTALLABLE_STATUS,
	UPDATE_PENDING_STATUSES,
} from "@notploy/server/services/update";
import { Download } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { api } from "@/utils/api";
import UpdateServer from "../dashboard/settings/web-server/update-server";
import { UpdateWebServer } from "../dashboard/settings/web-server/update-webserver";
import { Button } from "../ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "../ui/tooltip";

const AUTO_CHECK_UPDATES_INTERVAL_MINUTES = 7;

export const UpdateServerButton = () => {
	const { data: isCloud } = api.settings.isCloud.useQuery();
	const [isOpen, setIsOpen] = useState(false);
	const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null);

	const checkUpdatesIntervalRef = useRef<null | NodeJS.Timeout>(null);

	// The backend owns the GitHub lookup (and its cache): the layout only reads
	// the computed status instead of calling GitHub from every render.
	const { refetch: checkUpdateStatus } = api.settings.getUpdateStatus.useQuery(
		undefined,
		{
			enabled: !isCloud,
			refetchOnWindowFocus: false,
			// Keeps the badge populated when the user navigates back to the layout.
			staleTime: 60_000,
		},
	);

	useEffect(() => {
		if (isCloud) {
			return;
		}

		if (!localStorage.getItem("enableAutoCheckUpdates")) {
			// Enable auto update checking by default if user didn't change it
			const enableAutoCheck = localStorage.getItem("enableAutoCheckUpdates");
			if (enableAutoCheck === null) {
				localStorage.setItem("enableAutoCheckUpdates", "true");
			}
		}

		const clearUpdatesInterval = () => {
			if (checkUpdatesIntervalRef.current) {
				clearInterval(checkUpdatesIntervalRef.current);
				checkUpdatesIntervalRef.current = null;
			}
		};

		const checkUpdates = async () => {
			try {
				if (localStorage.getItem("enableAutoCheckUpdates") !== "true") {
					return;
				}

				const { data } = await checkUpdateStatus();
				const status = data?.status ?? null;
				const pending =
					!!status && UPDATE_PENDING_STATUSES.includes(status);

				setUpdateStatus(status);

				if (pending) {
					// Stop polling once a newer release is known, the badge and the
					// dialog handle the rest.
					clearUpdatesInterval();
				}
			} catch (error) {
				console.error("Error auto-checking for updates:", error);
			}
		};

		checkUpdatesIntervalRef.current = setInterval(
			checkUpdates,
			AUTO_CHECK_UPDATES_INTERVAL_MINUTES * 60000,
		);

		// Also check for updates on initial page load
		checkUpdates();

		return () => {
			clearUpdatesInterval();
		};
	}, [isCloud, checkUpdateStatus]);

	const hasPendingUpdate =
		!!updateStatus && UPDATE_PENDING_STATUSES.includes(updateStatus);
	const isInstallable = updateStatus === UPDATE_INSTALLABLE_STATUS;

	if (isCloud || !hasPendingUpdate) {
		return null;
	}

	const updateButton = (
		<TooltipProvider delayDuration={0}>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						variant="outline"
						className="w-full"
						onClick={() => setIsOpen(true)}
					>
						<Download className="h-4 w-4 shrink-0" />
						<span className="font-medium truncate group-data-[collapsible=icon]:hidden">
							Update Available
						</span>
						<span className="absolute right-2 flex h-2 w-2 group-data-[collapsible=icon]:hidden">
							<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
							<span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
						</span>
					</Button>
				</TooltipTrigger>
				<TooltipContent side="right" sideOffset={10}>
					<p>Update Available</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);

	return (
		<div className="border-t pt-4">
			{isInstallable ? (
				// An installable update only needs a confirmation: open the update
				// dialog straight from the sidebar instead of the release notes.
				<UpdateWebServer open={isOpen} onOpenChange={setIsOpen}>
					{updateButton}
				</UpdateWebServer>
			) : (
				<UpdateServer isOpen={isOpen} onOpenChange={setIsOpen}>
					{updateButton}
				</UpdateServer>
			)}
		</div>
	);
};
