import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/public/Header";
import { Footer } from "@/components/public/Footer";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Shield,
  Cookie,
  Mail,
  CheckCircle2,
  Settings,
  Bell,
  Eye,
  Clock,
  BarChart3,
} from "lucide-react";

export default async function CookiesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Public" });

  const cookieCategories = [
    {
      icon: Shield,
      title: t("cookies.essentialTitle"),
      description: t("cookies.essentialDesc"),
      required: true,
    },
    {
      icon: Settings,
      title: t("cookies.functionalTitle"),
      description: t("cookies.functionalDesc"),
      required: false,
    },
    {
      icon: BarChart3,
      title: t("cookies.analyticsTitle"),
      description: t("cookies.analyticsDesc"),
      required: false,
    },
    {
      icon: Bell,
      title: t("cookies.marketingTitle"),
      description: t("cookies.marketingDesc"),
      required: false,
    },
  ];

  const sections = [
    {
      title: t("cookies.introTitle"),
      content: t("cookies.introContent"),
    },
    {
      title: t("cookies.whatAreTitle"),
      content: t("cookies.whatAreContent"),
    },
    {
      title: t("cookies.howWeUseTitle"),
      content: t("cookies.howWeUseContent"),
    },
    {
      title: t("cookies.categoriesTitle"),
      content: t("cookies.categoriesContent"),
    },
    {
      title: t("cookies.thirdPartyTitle"),
      content: t("cookies.thirdPartyContent"),
    },
    {
      title: t("cookies.controlTitle"),
      content: t("cookies.controlContent"),
    },
    {
      title: t("cookies.updatesTitle"),
      content: t("cookies.updatesContent"),
    },
    {
      title: t("cookies.contactTitle"),
      content: t("cookies.contactContent"),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header locale={locale as import("@/lib/locale").Locale} />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-24 lg:py-32 border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                <Cookie className="h-4 w-4 text-emerald-500" />
                <span className="font-medium">{t("cookies.badge")}</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground leading-tight text-balance">
                {t("cookies.heroTitle")}
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
                {t("cookies.heroDescription")}
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-start gap-4">
                <Link href={`/${locale}/privacy`}>
                  <Button size="lg" className="gap-2 h-12 px-6 text-base">
                    {t("cookies.viewPrivacy")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href={`/${locale}/terms`}>
                  <Button variant="outline" size="lg" className="gap-2 h-12 px-6 text-base">
                    {t("cookies.viewTerms")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Cookie Categories */}
        <section className="py-20 lg:py-28 border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("cookies.typesTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("cookies.categoriesDescription")}
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {cookieCategories.map((category) => (
                <div key={category.title} className="p-6 rounded-lg border border-border bg-card">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <category.icon className="h-6 w-6 text-foreground" />
                      <h3 className="text-lg font-semibold text-foreground">{category.title}</h3>
                    </div>
                    {category.required ? (
                      <span className="text-xs font-medium px-2 py-1 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                        {t("cookies.required")}
                      </span>
                    ) : (
                      <span className="text-xs font-medium px-2 py-1 rounded bg-muted text-muted-foreground">
                        {t("cookies.optional")}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Cookie Settings */}
        <section className="py-20 lg:py-28 border-b border-border bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("cookies.controlTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("cookies.controlDescription")}
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-6 rounded-lg border border-border bg-card">
                <Eye className="h-8 w-8 text-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t("cookies.controlBrowserTitle")}
                </h3>
                <p className="text-sm text-muted-foreground">{t("cookies.controlBrowserDesc")}</p>
              </div>
              <div className="p-6 rounded-lg border border-border bg-card">
                <Settings className="h-8 w-8 text-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t("cookies.controlPreferencesTitle")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("cookies.controlPreferencesDesc")}
                </p>
              </div>
              <div className="p-6 rounded-lg border border-border bg-card">
                <Clock className="h-8 w-8 text-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t("cookies.controlRetentionTitle")}
                </h3>
                <p className="text-sm text-muted-foreground">{t("cookies.controlRetentionDesc")}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Cookie Policy Content */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="prose prose-lg max-w-none">
              <p className="text-lg text-muted-foreground mb-12">
                {t("cookies.lastUpdated")}: {t("cookies.lastUpdatedDate")}
              </p>

              {sections.map((section) => (
                <div key={section.title} className="mb-12">
                  <h2 className="text-2xl font-semibold text-foreground mb-4">{section.title}</h2>
                  <div className="text-muted-foreground space-y-4">
                    {section.content.split("\n\n").map((paragraph, idx) => (
                      <p key={idx}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="py-20 lg:py-28 border-b border-border bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("cookies.questionsTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("cookies.questionsDescription")}
              </p>
              <div className="mt-8">
                <a href="mailto:privacy@skygenesisenterprise.com">
                  <Button size="lg" className="gap-2">
                    <Mail className="h-4 w-4" />
                    {t("cookies.emailPrivacy")}
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer locale={locale as "fr" | "be_fr" | "be_nl" | "ch_fr"} />
    </div>
  );
}
