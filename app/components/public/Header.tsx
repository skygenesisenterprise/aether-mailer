import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { locales, type Locale } from "@/lib/locale";
import {
  Menu,
  ChevronDown,
  Shield,
  Users,
  Key,
  Lock,
  Layers,
  Code,
  BookOpen,
  FileText,
  Zap,
  Building2,
  Smartphone,
  Globe,
  Server,
  Database,
  Settings,
  LifeBuoy,
  Languages,
  Mail,
  Archive,
  Cloud,
  ShieldCheck,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  locale?: Locale;
}

interface MenuItem {
  titleKey: string;
  descKey: string;
  href: string;
  icon: React.ReactNode;
}

interface MenuSection {
  titleKey: string;
  items: MenuItem[];
}

interface MegaMenuData {
  sections: MenuSection[];
  featured?: {
    titleKey: string;
    descKey: string;
    href: string;
    badgeKey?: string;
  };
}

function getProductMenuData(): MegaMenuData {
  return {
    sections: [
      {
        titleKey: "corePlatform",
        items: [
          {
            titleKey: "mailServer",
            descKey: "mailServerDesc",
            href: "/products/mail-server",
            icon: <Mail className="h-5 w-5" />,
          },
          {
            titleKey: "emailSecurity",
            descKey: "emailSecurityDesc",
            href: "/products/security",
            icon: <ShieldCheck className="h-5 w-5" />,
          },
          {
            titleKey: "emailEncryption",
            descKey: "emailEncryptionDesc",
            href: "/products/encryption",
            icon: <Lock className="h-5 w-5" />,
          },
          {
            titleKey: "emailArchiving",
            descKey: "emailArchivingDesc",
            href: "/products/archiving",
            icon: <Archive className="h-5 w-5" />,
          },
        ],
      },
      {
        titleKey: "deployment",
        items: [
          {
            titleKey: "cloudEmail",
            descKey: "cloudEmailDesc",
            href: "/products/cloud",
            icon: <Cloud className="h-5 w-5" />,
          },
          {
            titleKey: "privateCloud",
            descKey: "privateCloudDesc",
            href: "/products/private-cloud",
            icon: <Server className="h-5 w-5" />,
          },
          {
            titleKey: "emailApi",
            descKey: "emailApiDesc",
            href: "/products/api",
            icon: <Code className="h-5 w-5" />,
          },
          {
            titleKey: "enterprise",
            descKey: "enterpriseDesc",
            href: "/products/enterprise",
            icon: <Building2 className="h-5 w-5" />,
          },
        ],
      },
    ],
  };
}

function getDevelopersMenuData(): MegaMenuData {
  return {
    sections: [
      {
        titleKey: "resources",
        items: [
          {
            titleKey: "documentation",
            descKey: "documentationDesc",
            href: "/developers",
            icon: <BookOpen className="h-5 w-5" />,
          },
          {
            titleKey: "quickstarts",
            descKey: "quickstartsDesc",
            href: "/developers/quickstarts",
            icon: <Zap className="h-5 w-5" />,
          },
          {
            titleKey: "apiReference",
            descKey: "apiReferenceDesc",
            href: "/developers/api",
            icon: <Code className="h-5 w-5" />,
          },
          {
            titleKey: "sdksLibraries",
            descKey: "sdksLibrariesDesc",
            href: "/developers/sdks",
            icon: <Layers className="h-5 w-5" />,
          },
        ],
      },
      {
        titleKey: "tools",
        items: [
          {
            titleKey: "cli",
            descKey: "cliDesc",
            href: "/developers/cli",
            icon: <FileText className="h-5 w-5" />,
          },
          {
            titleKey: "postman",
            descKey: "postmanDesc",
            href: "/developers/postman",
            icon: <Database className="h-5 w-5" />,
          },
          {
            titleKey: "extensions",
            descKey: "extensionsDesc",
            href: "/developers/extensions",
            icon: <Settings className="h-5 w-5" />,
          },
          {
            titleKey: "community",
            descKey: "communityDesc",
            href: "/community",
            icon: <Users className="h-5 w-5" />,
          },
        ],
      },
    ],
  };
}

function getSolutionsMenuData(): MegaMenuData {
  return {
    sections: [
      {
        titleKey: "byIndustry",
        items: [
          {
            titleKey: "b2bEmail",
            descKey: "b2bEmailDesc",
            href: "/solutions/b2b",
            icon: <Building2 className="h-5 w-5" />,
          },
          {
            titleKey: "healthcare",
            descKey: "healthcareDesc",
            href: "/solutions/healthcare",
            icon: <LifeBuoy className="h-5 w-5" />,
          },
          {
            titleKey: "financial",
            descKey: "financialDesc",
            href: "/solutions/financial",
            icon: <Briefcase className="h-5 w-5" />,
          },
          {
            titleKey: "legal",
            descKey: "legalDesc",
            href: "/solutions/legal",
            icon: <Shield className="h-5 w-5" />,
          },
        ],
      },
      {
        titleKey: "bySector",
        items: [
          {
            titleKey: "education",
            descKey: "educationDesc",
            href: "/solutions/education",
            icon: <BookOpen className="h-5 w-5" />,
          },
          {
            titleKey: "government",
            descKey: "governmentDesc",
            href: "/solutions/government",
            icon: <Building2 className="h-5 w-5" />,
          },
          {
            titleKey: "retailEcommerce",
            descKey: "retailEcommerceDesc",
            href: "/solutions/retail",
            icon: <Globe className="h-5 w-5" />,
          },
          {
            titleKey: "itTeams",
            descKey: "itTeamsDesc",
            href: "/solutions/it",
            icon: <Server className="h-5 w-5" />,
          },
        ],
      },
    ],
  };
}

const languages = [
  { code: "en", flag: "🇬🇧" },
  { code: "fr", flag: "🇫🇷" },
];

function LanguageSwitcher({ locale }: { locale: string }) {
  const currentLang = languages.find((l) => l.code === locale) || languages[0];

  return (
    <div className="relative group">
      <button
        className="flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
        aria-label="Select language"
      >
        <Languages className="h-4 w-4" />
      </button>
      <div className="absolute right-0 top-full mt-1 w-40 bg-background border border-border rounded-lg shadow-lg overflow-hidden z-50 hidden group-hover:block">
        {languages.map((lang) => (
          <Link
            key={lang.code}
            href={`/${lang.code}`}
            className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-muted transition-colors"
          >
            <span>{lang.flag}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export async function Header({ locale: initialLocale }: HeaderProps) {
  const locale = initialLocale || "fr";
  const t = await getTranslations({ locale, namespace: "Header" });

  const productMenuData = getProductMenuData();
  const developersMenuData = getDevelopersMenuData();
  const solutionsMenuData = getSolutionsMenuData();

  const getLocaleHref = (href: string) => {
    if (href === "/") return `/${locale}`;
    return `/${locale}${href}`;
  };

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link href={getLocaleHref("/")} className="flex items-center gap-2.5 group">
              <div className="relative">
                <Shield className="h-7 w-7 text-foreground transition-transform group-hover:scale-105" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-base text-foreground leading-tight">
                  {t("brandName")}
                </span>
                <span className="text-[10px] text-muted-foreground leading-tight tracking-wide">
                  {t("bySkyGenesis")}
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center">
            <ul className="flex items-center gap-1">
              <li className="relative group">
                <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  {t("product")}
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
                <div className="absolute left-1/2 -translate-x-1/2 top-full pt-4 hidden group-hover:block">
                  <div className="bg-background border border-border rounded-xl shadow-xl overflow-hidden min-w-170">
                    <div className="flex">
                      <div className="flex-1 p-6">
                        <div className="grid grid-cols-2 gap-8">
                          {productMenuData.sections.map((section) => (
                            <div key={section.titleKey}>
                              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                                {t(section.titleKey)}
                              </h3>
                              <ul className="space-y-1">
                                {section.items.map((item) => (
                                  <li key={item.titleKey}>
                                    <Link
                                      href={getLocaleHref(item.href)}
                                      className="group flex items-start gap-3 p-2 -mx-2 rounded-lg hover:bg-muted transition-colors"
                                    >
                                      <span className="shrink-0 mt-0.5 text-muted-foreground group-hover:text-foreground transition-colors">
                                        {item.icon}
                                      </span>
                                      <div>
                                        <span className="block text-sm font-medium text-foreground group-hover:text-foreground">
                                          {t(item.titleKey)}
                                        </span>
                                        <span className="block text-xs text-muted-foreground mt-0.5">
                                          {t(item.descKey)}
                                        </span>
                                      </div>
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </li>

              <li className="relative group">
                <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  {t("solutions")}
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
                <div className="absolute left-1/2 -translate-x-1/2 top-full pt-4 hidden group-hover:block">
                  <div className="bg-background border border-border rounded-xl shadow-xl overflow-hidden min-w-170">
                    <div className="flex">
                      <div className="flex-1 p-6">
                        <div className="grid grid-cols-2 gap-8">
                          {solutionsMenuData.sections.map((section) => (
                            <div key={section.titleKey}>
                              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                                {t(section.titleKey)}
                              </h3>
                              <ul className="space-y-1">
                                {section.items.map((item) => (
                                  <li key={item.titleKey}>
                                    <Link
                                      href={getLocaleHref(item.href)}
                                      className="group flex items-start gap-3 p-2 -mx-2 rounded-lg hover:bg-muted transition-colors"
                                    >
                                      <span className="shrink-0 mt-0.5 text-muted-foreground group-hover:text-foreground transition-colors">
                                        {item.icon}
                                      </span>
                                      <div>
                                        <span className="block text-sm font-medium text-foreground group-hover:text-foreground">
                                          {t(item.titleKey)}
                                        </span>
                                        <span className="block text-xs text-muted-foreground mt-0.5">
                                          {t(item.descKey)}
                                        </span>
                                      </div>
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </li>

              <li className="relative group">
                <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  {t("developers")}
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
                <div className="absolute left-1/2 -translate-x-1/2 top-full pt-4 hidden group-hover:block">
                  <div className="bg-background border border-border rounded-xl shadow-xl overflow-hidden min-w-170">
                    <div className="flex">
                      <div className="flex-1 p-6">
                        <div className="grid grid-cols-2 gap-8">
                          {developersMenuData.sections.map((section) => (
                            <div key={section.titleKey}>
                              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                                {t(section.titleKey)}
                              </h3>
                              <ul className="space-y-1">
                                {section.items.map((item) => (
                                  <li key={item.titleKey}>
                                    <Link
                                      href={getLocaleHref(item.href)}
                                      className="group flex items-start gap-3 p-2 -mx-2 rounded-lg hover:bg-muted transition-colors"
                                    >
                                      <span className="shrink-0 mt-0.5 text-muted-foreground group-hover:text-foreground transition-colors">
                                        {item.icon}
                                      </span>
                                      <div>
                                        <span className="block text-sm font-medium text-foreground group-hover:text-foreground">
                                          {t(item.titleKey)}
                                        </span>
                                        <span className="block text-xs text-muted-foreground mt-0.5">
                                          {t(item.descKey)}
                                        </span>
                                      </div>
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </li>

              <li>
                <Link
                  href={getLocaleHref("/pricing")}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("pricing")}
                </Link>
              </li>

              <li>
                <Link
                  href={getLocaleHref("/blog")}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("blog")}
                </Link>
              </li>
            </ul>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            <LanguageSwitcher locale={locale} />

            <Link href="/login">
              <Button
                variant="ghost"
                size="sm"
                className="h-9 px-4 font-medium text-muted-foreground hover:text-foreground"
              >
                {t("login")}
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="h-9 px-4 font-medium">
                {t("signUp")}
              </Button>
            </Link>

            {/* Mobile Menu Button - placeholder, needs client component */}
            <div className="lg:hidden">
              <Link
                href="#"
                className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Menu className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}