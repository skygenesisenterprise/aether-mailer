import { IS_CLOUD } from "@notploy/server/constants";
import { getWebServerSettings } from "@notploy/server/services/web-server-settings";

export interface PublicWhitelabelingConfig {
	appName: string | null;
	appDescription: string | null;
	logoUrl: string | null;
	loginLogoUrl: string | null;
	faviconUrl: string | null;
	customCss: string | null;
	ogImageUrl: string | null;
	errorPageTitle: string | null;
	errorPageDescription: string | null;
	footerText: string | null;
}

/**
 * Public whitelabeling config for unauthenticated contexts (login page, SSR
 * document shell). No active organization/session is available here.
 *
 * Whitelabeling is a self-hosted-only feature; Notploy Cloud has a fixed brand
 * and therefore returns null.
 */
export const getPublicWhitelabelingConfig =
	async (): Promise<PublicWhitelabelingConfig | null> => {
		if (IS_CLOUD) {
			return null;
		}
		const settings = await getWebServerSettings();
		const config = settings?.whitelabelingConfig;
		if (!config) return null;

		return {
			appName: config.appName,
			appDescription: config.appDescription,
			logoUrl: config.logoUrl,
			loginLogoUrl: config.loginLogoUrl,
			faviconUrl: config.faviconUrl,
			customCss: config.customCss,
			ogImageUrl: config.ogImageUrl,
			errorPageTitle: config.errorPageTitle,
			errorPageDescription: config.errorPageDescription,
			footerText: config.footerText,
		};
	};
