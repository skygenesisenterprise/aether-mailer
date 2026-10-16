"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/utils/api";

export function TimeBadge() {
	const { data: serverTime } = api.server.getServerTime.useQuery(undefined, {
		refetchInterval: 60_000,
	});
	const [time, setTime] = useState<number | null>(null);

	useEffect(() => {
		if (serverTime?.time) {
			setTime(new Date(serverTime.time).getTime());
		}
	}, [serverTime]);

	useEffect(() => {
		const timer = setInterval(() => {
			setTime((previousTime) =>
				previousTime === null ? null : previousTime + 1000,
			);
		}, 1000);

		return () => {
			clearInterval(timer);
		};
	}, []);

	const timezone = serverTime?.timezone;
	const formattedTime = useMemo(() => {
		if (time === null || !timezone) return null;

		return new Intl.DateTimeFormat("en-GB", {
			timeZone: timezone,
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
			hourCycle: "h23",
		}).format(new Date(time));
	}, [time, timezone]);
	const utcOffset = useMemo(() => {
		if (time === null || !timezone) return null;

		const offset = new Intl.DateTimeFormat("en", {
			timeZone: timezone,
			timeZoneName: "longOffset",
		})
			.formatToParts(new Date(time))
			.find((part) => part.type === "timeZoneName")?.value;

		if (!offset) return null;
		return offset === "GMT" ? "UTC+00:00" : offset.replace(/^GMT/, "UTC");
	}, [time, timezone]);

	if (!formattedTime || !timezone || !utcOffset) {
		return null;
	}

	return (
		<div className="inline-flex items-center rounded-full border p-1 text-xs whitespace-nowrap max-w-full overflow-hidden gap-1">
			<div className="inline-flex items-center px-1 gap-1">
				<span className="hidden sm:inline">Server Time:</span>
				<span className="font-medium tabular-nums">{formattedTime}</span>
			</div>
			<span className="hidden sm:inline text-primary/70 border rounded-full bg-foreground/5 px-1.5 py-0.5">
				{timezone} | {utcOffset}
			</span>
		</div>
	);
}
