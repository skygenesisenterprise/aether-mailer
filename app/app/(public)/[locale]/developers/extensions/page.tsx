import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/public/Header";
import { Footer } from "@/components/public/Footer";
import { Button } from "@/components/ui/button";
import { GitHubIcon } from "@/components/ui/icons/GitHubIcon";
import {
  ArrowRight,
  Terminal,
  Package,
  Shield,
  Globe,
  BookOpen,
  Puzzle,
  Code2,
} from "lucide-react";

export default async function ExtensionPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Public" });

  const features = [
    {
      icon: Package,
      title: t("developers.extFeature1"),
      description: t("developers.extFeature1Desc"),
    },
    {
      icon: Code2,
      title: t("developers.extFeature2"),
      description: t("developers.extFeature2Desc"),
    },
    {
      icon: Shield,
      title: t("developers.extFeature3"),
      description: t("developers.extFeature3Desc"),
    },
    {
      icon: Globe,
      title: t("developers.extFeature4"),
      description: t("developers.extFeature4Desc"),
    },
  ];

  const extensions = [
    {
      name: "PostgreSQL",
      description: t("developers.extPostgresDesc"),
      status: t("developers.extStable"),
    },
    {
      name: "MySQL",
      description: t("developers.extMysqlDesc"),
      status: t("developers.extStable"),
    },
    {
      name: "Redis",
      description: t("developers.extRedisDesc"),
      status: t("developers.extBeta"),
    },
    {
      name: "AWS SES",
      description: t("developers.extSesDesc"),
      status: t("developers.extBeta"),
    },
    {
      name: "SMTP Forward",
      description: t("developers.extSmtpDesc"),
      status: t("developers.extStable"),
    },
    {
      name: "DMARC",
      description: t("developers.extDmarcDesc"),
      status: t("developers.extAlpha"),
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
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                {t("developers.extBadge")}
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground leading-tight text-balance">
                {t("developers.extHeroTitle")}
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
                {t("developers.extHeroDescription")}
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-start gap-4">
                <Link href="#extensions">
                  <Button size="lg" className="gap-2 h-12 px-6 text-base">
                    {t("developers.extCta")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="https://github.com/skygenesisenterprise/aether-mailer">
                  <Button variant="outline" size="lg" className="gap-2 h-12 px-6 text-base">
                    <GitHubIcon className="h-4 w-4" />
                    {t("developers.extGithub")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 lg:py-20 border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-12">
              <h2 className="text-2xl sm:text-3xl font-semibold text-foreground">
                {t("developers.extFeaturesTitle")}
              </h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="p-4 rounded-lg border border-border bg-card"
                >
                  <feature.icon className="h-6 w-6 text-foreground mb-3" />
                  <h3 className="text-base font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Extensions List */}
        <section id="extensions" className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("developers.extListTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("developers.extListDescription")}
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {extensions.map((ext) => (
                <div
                  key={ext.name}
                  className="p-6 rounded-lg border border-border bg-card hover:border-foreground/20 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Puzzle className="h-5 w-5 text-foreground" />
                      <h3 className="text-base font-semibold text-foreground">
                        {ext.name}
                      </h3>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        ext.status === t("developers.extStable")
                          ? "bg-emerald-500/10 text-emerald-500"
                          : ext.status === t("developers.extBeta")
                          ? "bg-amber-500/10 text-amber-500"
                          : "bg-red-500/10 text-red-500"
                      }`}
                    >
                      {ext.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {ext.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Create Extension Section */}
        <section className="py-20 lg:py-28 bg-foreground text-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <h2 className="text-3xl sm:text-4xl font-semibold text-balance">
                {t("developers.extCreateTitle")}
              </h2>
              <p className="mt-4 text-lg text-background/70 leading-relaxed">
                {t("developers.extCreateDescription")}
              </p>
              <div className="mt-8">
                <Link href="https://github.com/skygenesisenterprise/aether-mailer">
                  <Button variant="secondary" size="lg" className="gap-2">
                    <Terminal className="h-4 w-4" />
                    {t("developers.extCreateCta")}
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
                {t("developers.extResourcesTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("developers.extResourcesDescription")}
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <Link
                href={`/${locale}/developers/docs`}
                className="p-6 rounded-lg border border-border bg-card hover:border-foreground/20 transition-colors"
              >
                <BookOpen className="h-8 w-8 text-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t("developers.extDocsTitle")}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("developers.extDocsDesc")}
                </p>
              </Link>
              <Link
                href="https://github.com/skygenesisenterprise/aether-mailer"
                className="p-6 rounded-lg border border-border bg-card hover:border-foreground/20 transition-colors"
              >
                <Terminal className="h-8 w-8 text-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t("developers.extApiTitle")}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("developers.extApiDesc")}
                </p>
              </Link>
              <Link
                href={`/${locale}/developers/sdks`}
                className="p-6 rounded-lg border border-border bg-card hover:border-foreground/20 transition-colors"
              >
                <Package className="h-8 w-8 text-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t("developers.extSdksTitle")}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("developers.extSdksDesc")}
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
                {t("developers.extCtaTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                {t("developers.extCtaDescription")}
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href={`/${locale}/developers/docs`}>
                  <Button size="lg" className="gap-2 h-12 px-8 text-base">
                    {t("developers.extCtaGetStarted")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href={`/${locale}/company/contact`}>
                  <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                    {t("developers.extCtaContact")}
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