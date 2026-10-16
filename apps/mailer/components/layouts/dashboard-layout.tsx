import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { api } from "@/utils/api";
import { useAppName } from "@/utils/hooks/use-app-name";
import { ImpersonationBar } from "../dashboard/impersonation/impersonation-bar";
import { HubSpotWidget } from "../shared/HubSpotWidget";
import Page from "./side";

const DASHBOARD_PAGE_TITLES: Record<string, string> = {
	"/dashboard/home": "Home",
	"/dashboard/projects": "Projects",
	"/dashboard/overview": "Services",
	"/dashboard/deployments": "Deployments",
	"/dashboard/schedules": "Schedules",
	"/dashboard/docker": "Docker",
	"/dashboard/containers": "Containers",
	"/dashboard/monitoring": "Monitoring",
	"/dashboard/requests": "Requests",
	"/dashboard/incidents": "Incidents",
	"/dashboard/operations": "Operations",
	"/dashboard/workspaces": "Workspaces",
	"/dashboard/applications": "Applications",
	"/dashboard/usage": "Usage",
	"/dashboard/capacity": "Capacity",
	"/dashboard/maintenance": "Maintenance",
	"/dashboard/domains": "Domains",
	"/dashboard/storage": "Storage",
	"/dashboard/platform-services": "Platform Services",
	"/dashboard/website/traffic": "Traffic",
	"/dashboard/website/community": "Community",
	"/dashboard/traefik": "Traefik",
	"/dashboard/settings/ai": "AI",
	"/dashboard/settings/api-keys": "API Keys",
	"/dashboard/settings/audit-logs": "Audit Logs",
	"/dashboard/settings/billing": "Billing",
	"/dashboard/settings/certificates": "Certificates",
	"/dashboard/settings/deployments": "Build Settings",
	"/dashboard/settings/destinations": "Object Storage",
	"/dashboard/settings/dns": "DNS Providers",
	"/dashboard/settings/git-providers": "Git Providers",
	"/dashboard/settings/invoices": "Invoices",
	"/dashboard/settings/notifications": "Notifications",
	"/dashboard/settings/profile": "Profile",
	"/dashboard/settings/registry": "Container Registries",
	"/dashboard/settings/secrets": "Secrets Manager",
	"/dashboard/settings/server": "Web Server",
	"/dashboard/settings/servers": "Servers",
	"/dashboard/settings/sessions": "Sessions",
	"/dashboard/settings/sso": "SSO",
	"/dashboard/settings/tags": "Tags",
	"/dashboard/settings/users": "Users",
	"/dashboard/settings/whitelabeling": "Whitelabeling",
	"/dashboard/website/blog": "Blog",
	"/dashboard/website/careers": "Careers",
};

const TAB_TITLES: Record<string, Record<string, string>> = {
	"/dashboard/docker": {
		containers: "Containers",
		events: "Docker Events",
		health: "Health",
		images: "Images",
		networks: "Networks",
		"disk-usage": "Disk Usage",
		swarm: "Swarm",
		volumes: "Storage",
	},
	"/dashboard/overview": {
		backups: "Backups",
		deployments: "Deployments",
		domains: "Domains",
		services: "Services",
	},
};

function getDashboardPageTitle(
	pathname: string,
	query: Record<string, string | string[] | undefined>,
): string {
	const tab = query.tab;
	if (typeof tab === "string") {
		const tabTitles = TAB_TITLES[pathname];
		const tabTitle = tabTitles?.[tab];
		if (tabTitle) return tabTitle;
	}

	const knownTitle = DASHBOARD_PAGE_TITLES[pathname];
	if (knownTitle) return knownTitle;

	if (pathname === "/dashboard/settings/dns/[dnsProviderId]") {
		return "DNS Provider";
	}
	if (
		pathname === "/dashboard/settings/destinations/[objectStorageProviderId]"
	) {
		return "Object Storage";
	}
	if (pathname === "/dashboard/settings/dns/[dnsProviderId]/[zoneId]") {
		return "DNS Zone";
	}
	if (
		pathname === "/dashboard/project/[projectId]/environment/[environmentId]"
	) {
		return "Environment";
	}

	const serviceRoute = pathname.match(
		/\/services\/(application|compose|libsql|mariadb|mongo|mysql|postgres|redis)\//,
	);
	if (serviceRoute) {
		const serviceType = serviceRoute[1] ?? "";
		const serviceTitles: Record<string, string> = {
			application: "Application",
			compose: "Compose Service",
			libsql: "LibSQL",
			mariadb: "MariaDB",
			mongo: "MongoDB",
			mysql: "MySQL",
			postgres: "PostgreSQL",
			redis: "Redis",
		};
		return serviceTitles[serviceType] ?? "Service";
	}

	return "Notploy";
}

interface Props {
	children: React.ReactNode;
	metaName?: string;
}

export const DashboardLayout = ({ children, metaName }: Props) => {
	const router = useRouter();
	const { data: haveRootAccess } = api.user.haveRootAccess.useQuery();
	const { data: isCloud } = api.settings.isCloud.useQuery();
	// Each environment brands the browser tab: Notploy, Notploy Cloud or
	// Notploy Console (a whitelabel app name overrides all three).
	const appName = useAppName();
	const pageTitle =
		metaName ?? getDashboardPageTitle(router.pathname, router.query);
	const { data: currentPlan } = api.stripe.getCurrentPlan.useQuery(undefined, {
		enabled: isCloud === true,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
		refetchOnReconnect: false,
	});

	const isChatEnabled = isCloud === true && currentPlan === "startup";

	const { data: onboardingStatus } = api.project.onboardingStatus.useQuery();
	const shouldRedirectToOnboarding =
		router.pathname !== "/dashboard/home" &&
		onboardingStatus?.shouldShowOnboarding === true;

	useEffect(() => {
		if (shouldRedirectToOnboarding) {
			router.replace("/dashboard/home");
		}
	}, [shouldRedirectToOnboarding, router]);

	if (shouldRedirectToOnboarding) {
		return null;
	}

	return (
		<>
			<Head>
				<title>{`${pageTitle} | ${appName}`}</title>
			</Head>
			<Page>{children}</Page>
			{isChatEnabled && (
				<>
					<HubSpotWidget />
				</>
			)}

			{haveRootAccess === true && <ImpersonationBar />}
		</>
	);
};
