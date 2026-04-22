import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { locales, type Locale } from "@/lib/locale";

interface FooterProps {
  locale?: Locale;
}

interface FooterLinkGroup {
  title: string;
  links: { name: string; href: string }[];
}

function getDefaultFooterLinks(locale: string): Record<string, FooterLinkGroup> {
  const prefix = `/${locale}`;
  return {
    developers: {
      title: "Developers",
      links: [
        { name: "Documentation", href: `${prefix}/developer` },
        { name: "API Reference", href: `${prefix}/developer/api` },
        { name: "SDKs", href: `${prefix}/developer/sdks` },
        { name: "Quickstarts", href: `${prefix}/developer/quickstarts` },
        { name: "Status Page", href: "https://status.skygenesisenterprise.com" },
      ],
    },
    resources: {
      title: "Resources",
      links: [
        { name: "Blog", href: `${prefix}/blog` },
        { name: "Case Studies", href: `${prefix}/resources/case-studies` },
        { name: "Whitepapers", href: `${prefix}/resources/whitepapers` },
        { name: "Webinars", href: `${prefix}/resources/webinars` },
        { name: "Community", href: `${prefix}/resources/community` },
      ],
    },
    company: {
      title: "Company",
      links: [
        { name: "About Us", href: `${prefix}/company/about` },
        { name: "Careers", href: `${prefix}/company/careers` },
        { name: "Press", href: `${prefix}/company/press` },
        { name: "Partners", href: `${prefix}/company/partners` },
        { name: "Contact", href: `${prefix}/contact` },
      ],
    },
  };
}

interface LinkColumnProps {
  title: string;
  links: readonly { name: string; href: string }[];
}

function LinkColumn({ title, links }: LinkColumnProps) {
  return (
    <div className="flex flex-col">
      <h3 className="text-xs font-semibold text-footer-heading mb-5 uppercase tracking-widest">
        {title}
      </h3>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.name}>
            <Link
              href={link.href}
              className="text-sm text-footer-link hover:text-footer-link-hover transition-colors duration-150 block"
            >
              {link.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SocialIcon({ name }: { name: string }) {
  const normalizedName = name.toLowerCase();

  if (normalizedName.includes("twitter") || normalizedName.includes("x.com")) {
    return (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    );
  }

  if (normalizedName.includes("facebook")) {
    return (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path
          fillRule="evenodd"
          d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
          clipRule="evenodd"
        />
      </svg>
    );
  }

  if (normalizedName.includes("instagram")) {
    return (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path
          fillRule="evenodd"
          d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
          clipRule="evenodd"
        />
      </svg>
    );
  }

  if (normalizedName.includes("youtube")) {
    return (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    );
  }

  if (normalizedName.includes("discord")) {
    return (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
      </svg>
    );
  }

  if (normalizedName.includes("slack")) {
    return (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
      </svg>
    );
  }

  if (normalizedName.includes("twitch")) {
    return (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.571 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
      </svg>
    );
  }

  if (normalizedName.includes("github")) {
    return (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path
          fillRule="evenodd"
          d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
          clipRule="evenodd"
        />
      </svg>
    );
  }

  if (normalizedName.includes("linkedin")) {
    return (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    );
  }

  if (normalizedName.includes("mastodon")) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        fill="currentColor"
        className="bi bi-mastodon"
        viewBox="0 0 16 16"
      >
        <path d="M11.19 12.195c2.016-.24 3.77-1.475 3.99-2.603.348-1.778.32-4.339.32-4.339 0-3.47-2.286-4.488-2.286-4.488C12.062.238 10.083.017 8.027 0h-.05C5.92.017 3.942.238 2.79.765c0 0-2.285 1.017-2.285 4.488l-.002.662c-.004.64-.007 1.35.011 2.091.083 3.394.626 6.74 3.78 7.57 1.454.383 2.703.463 3.709.408 1.823-.1 2.847-.647 2.847-.647l-.06-1.317s-1.303.41-2.767.36c-1.45-.05-2.98-.156-3.215-1.928a4 4 0 0 1-.033-.496s1.424.346 3.228.428c1.103.05 2.137-.064 3.188-.189zm1.613-2.47H11.13v-4.08c0-.859-.364-1.295-1.091-1.295-.804 0-1.207.517-1.207 1.541v2.233H7.168V5.89c0-1.024-.403-1.541-1.207-1.541-.727 0-1.091.436-1.091 1.296v4.079H3.197V5.522q0-1.288.66-2.046c.456-.505 1.052-.764 1.793-.764.856 0 1.504.328 1.933.983L8 4.39l.417-.695c.429-.655 1.077-.983 1.934-.983.74 0 1.336.259 1.791.764q.662.757.661 2.046z" />
      </svg>
    );
  }

  return (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M10 6v2H5v11h11v-2h-6v-2h6v-2h-2V6h-4z" />
    </svg>
  );
}

export async function Footer({ locale: initialLocale }: FooterProps) {
  const locale = initialLocale || "fr";
  const t = await getTranslations({ locale, namespace: "Public.footer" });

  const currentLocale = locales.find((l) => l.code === locale);

  const footerLinks = {
    developers: {
      title: t("developers"),
      links: [
        { name: t("documentation"), href: `/${locale}/developers` },
        { name: t("apiReference"), href: `/${locale}/developers/api` },
        { name: t("sdks"), href: `/${locale}/developers/sdks` },
        { name: t("quickstarts"), href: `/${locale}/developers/quickstarts` },
        { name: t("statusPage"), href: "https://status.skygenesisenterprise.com" },
      ],
    },
    resources: {
      title: t("resources"),
      links: [
        { name: t("blog"), href: `/${locale}/blog` },
        { name: t("caseStudies"), href: `/${locale}/case-studies` },
        { name: t("whitepapers"), href: `/${locale}/ressources/whitepapers` },
        { name: t("webinars"), href: `/${locale}/ressources/webinars` },
        { name: t("community"), href: `/${locale}/community` },
      ],
    },
    company: {
      title: t("company"),
      links: [
        { name: t("about"), href: `/${locale}/company/about` },
        { name: t("careers"), href: "https://jobs.skygenesisenterprise.com" },
        { name: t("press"), href: `/${locale}/company/press` },
        { name: t("partners"), href: `/${locale}/company/partners` },
        { name: t("contact"), href: `/${locale}/company/contact` },
      ],
    },
  };

  const prefix = `/${locale}`;

  const subscriptionLinks = [
    { name: t("pricingPlans"), href: `${prefix}/pricing` },
    { name: t("freeTrial"), href: `${prefix}/trial` },
    { name: t("enterprise"), href: `${prefix}/enterprise` },
  ];

  const legalLinks = [
    { name: t("privacy"), href: `${prefix}/legal/privacy` },
    { name: t("terms"), href: `${prefix}/legal/terms` },
    { name: t("cookiePolicy"), href: `${prefix}/legal/cookies` },
    { name: "GDPR", href: `${prefix}/legal/gdpr` },
    { name: t("security"), href: `${prefix}/legal/security` },
    { name: "licence", href: `${prefix}/legal/licence` },
  ];

  const socialLinks = [
    { name: "X (Twitter)", href: "https://x.com/SkyGEnterprise" },
    { name: "LinkedIn", href: "https://linkedin.com/company/skygenesisenterprise" },
    { name: "GitHub", href: "https://github.com/skygenesisenterprise" },
    { name: "YouTube", href: "https://youtube.com/@skygenesisenterprise" },
    { name: "Discord", href: "https://discord.gg/skygenesisenterprise" },
    { name: "Slack", href: "https://slack.com/skygenesisenterprise" },
    { name: "Twitch", href: "https://twitch.tv/skygenesisenterprise" },
    { name: "Instagram", href: "https://instagram.com/skygenesisenterprise" },
    { name: "Facebook", href: "https://facebook.com/skygenesisenterprise" },
    { name: "Mastodon", href: "https://mastodon.social/@skygenesisenterprise" },
  ];

  return (
    <footer className="bg-footer text-footer-link border-t border-footer-border">
      {/* Main link columns */}
      <div className="mx-auto max-w-7xl px-6 pt-16 pb-10 border-b border-footer-border">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-8 gap-y-12">
          <LinkColumn title={t("developers")} links={footerLinks.developers?.links || []} />
          <LinkColumn title={t("resources")} links={footerLinks.resources?.links || []} />
          <LinkColumn title={t("company")} links={footerLinks.company?.links || []} />
          <LinkColumn title={t("legal")} links={legalLinks} />
          <LinkColumn title={t("getStarted")} links={subscriptionLinks} />
        </div>
      </div>

      {/* Brand block */}
      <div>
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="max-w-xs">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="w-7 h-7 rounded bg-footer-accent flex items-center justify-center shrink-0">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path
                    d="M7 1L13 4V10L7 13L1 10V4L7 1Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                    className="text-footer"
                  />
                </svg>
              </div>
              <span className="text-base font-semibold text-footer-heading tracking-tight group-hover:text-footer-link-hover transition-colors">
                Aether Mailer
              </span>
            </Link>
            <p className="mt-4 text-sm text-footer-link leading-relaxed">{t("brandDescription")}</p>
            <div className="flex items-center gap-3 mt-6">
              {socialLinks.map((social) => (
                <Link
                  key={social.name}
                  href={social.href}
                  className="text-footer-link hover:text-footer-link-hover transition-colors duration-150"
                  aria-label={social.name}
                >
                  <SocialIcon name={social.name} />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-footer-border">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-footer-muted">
              {t("copyright")}
              <span className="mx-2 opacity-40">|</span>
              <Link
                href="https://skygenesisenterprise.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-footer-link-hover transition-colors duration-150"
              >
                {t("enterpriseproprietary")}
              </Link>
            </p>
            <p className="text-xs text-footer-muted">
              <Link
                href={`${prefix}/pgp`}
                className="hover:text-footer-link-hover transition-colors duration-150"
              >
                {t("verifyKey")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
