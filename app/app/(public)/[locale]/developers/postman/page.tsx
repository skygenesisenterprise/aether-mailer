import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/public/Header";
import { Footer } from "@/components/public/Footer";
import { Button } from "@/components/ui/button";
import { GitHubIcon } from "@/components/ui/icons/GitHubIcon";
import {
  ArrowRight,
  Terminal,
  BookOpen,
  Play,
  Globe,
} from "lucide-react";

export default async function PostmanPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Public" });

  const collections = [
    {
      name: t("developers.postmanCollection1"),
      description: t("developers.postmanCollection1Desc"),
      endpoints: 12,
    },
    {
      name: t("developers.postmanCollection2"),
      description: t("developers.postmanCollection2Desc"),
      endpoints: 8,
    },
    {
      name: t("developers.postmanCollection3"),
      description: t("developers.postmanCollection3Desc"),
      endpoints: 6,
    },
  ];

  const features = [
    t("developers.postmanFeature1"),
    t("developers.postmanFeature2"),
    t("developers.postmanFeature3"),
    t("developers.postmanFeature4"),
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
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                {t("developers.postmanBadge")}
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground leading-tight text-balance">
                {t("developers.postmanHeroTitle")}
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
                {t("developers.postmanHeroDescription")}
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-start gap-4">
                <Link href="https://postman.com">
                  <Button size="lg" className="gap-2 h-12 px-6 text-base">
                    {t("developers.postmanCta")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="https://github.com/skygenesisenterprise/aether-mailer">
                  <Button variant="outline" size="lg" className="gap-2 h-12 px-6 text-base">
                    <GitHubIcon className="h-4 w-4" />
                    {t("developers.postmanGithub")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Getting Started Section */}
        <section className="py-16 lg:py-20 border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-12">
              <h2 className="text-2xl sm:text-3xl font-semibold text-foreground">
                {t("developers.postmanGettingTitle")}
              </h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-foreground text-background text-sm font-bold">
                  1
                </span>
                <div>
                  <h3 className="text-base font-semibold text-foreground mb-2">
                    {t("developers.postmanStep1Title")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t("developers.postmanStep1Desc")}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-foreground text-background text-sm font-bold">
                  2
                </span>
                <div>
                  <h3 className="text-base font-semibold text-foreground mb-2">
                    {t("developers.postmanStep2Title")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t("developers.postmanStep2Desc")}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-foreground text-background text-sm font-bold">
                  3
                </span>
                <div>
                  <h3 className="text-base font-semibold text-foreground mb-2">
                    {t("developers.postmanStep3Title")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t("developers.postmanStep3Desc")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Collections Section */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("developers.postmanCollectionsTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("developers.postmanCollectionsDescription")}
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {collections.map((collection) => (
                <div
                  key={collection.name}
                  className="p-6 rounded-lg border border-border bg-card hover:border-foreground/20 transition-colors"
                >
                  <Globe className="h-8 w-8 text-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {collection.name}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    {collection.description}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {collection.endpoints} endpoints
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 lg:py-28 border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("developers.postmanFeaturesTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("developers.postmanFeaturesDescription")}
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-4 rounded-lg border border-border bg-card"
                >
                  <Play className="h-5 w-5 text-emerald-500 mt-0.5" />
                  <span className="text-sm text-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* API Key Section */}
        <section className="py-20 lg:py-28 bg-foreground text-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <h2 className="text-3xl sm:text-4xl font-semibold text-balance">
                {t("developers.postmanApiKeyTitle")}
              </h2>
              <p className="mt-4 text-lg text-background/70 leading-relaxed">
                {t("developers.postmanApiKeyDescription")}
              </p>
              <div className="mt-8">
                <Link href={`/${locale}/company/contact`}>
                  <Button variant="secondary" size="lg" className="gap-2">
                    <Terminal className="h-4 w-4" />
                    {t("developers.postmanApiKeyCta")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Resources Section */}
        <section className="py-20 lg:py-28 border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("developers.postmanResourcesTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("developers.postmanResourcesDescription")}
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <Link
                href={`/${locale}/developers/api`}
                className="p-6 rounded-lg border border-border bg-card hover:border-foreground/20 transition-colors"
              >
                <Terminal className="h-8 w-8 text-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t("developers.postmanDocsTitle")}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("developers.postmanDocsDesc")}
                </p>
              </Link>
              <Link
                href={`/${locale}/developers/quickstarts`}
                className="p-6 rounded-lg border border-border bg-card hover:border-foreground/20 transition-colors"
              >
                <Play className="h-8 w-8 text-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t("developers.postmanQuickstartsTitle")}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("developers.postmanQuickstartsDesc")}
                </p>
              </Link>
              <Link
                href={`/${locale}/developers/sdks`}
                className="p-6 rounded-lg border border-border bg-card hover:border-foreground/20 transition-colors"
              >
                <BookOpen className="h-8 w-8 text-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t("developers.postmanSdksTitle")}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("developers.postmanSdksDesc")}
                </p>
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("developers.postmanCtaTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                {t("developers.postmanCtaDescription")}
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href={`/${locale}/developers/api`}>
                  <Button size="lg" className="gap-2 h-12 px-8 text-base">
                    {t("developers.postmanCtaGetStarted")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href={`/${locale}/company/contact`}>
                  <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                    {t("developers.postmanCtaContact")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer locale={locale as "fr" | "be_fr" | "be_nl" | "ch_fr"} />
    </div>
  );
}