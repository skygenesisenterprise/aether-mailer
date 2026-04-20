import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/public/Header";
import { Footer } from "@/components/public/Footer";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Mail,
  FileText,
  ExternalLink,
  Newspaper,
  TrendingUp,
  Globe,
} from "lucide-react";

export default async function PressPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Public" });

  const pressReleases = [
    {
      date: t("press.release2025Date"),
      title: t("press.release2025Title"),
      description: t("press.release2025Desc"),
      link: "#",
    },
    {
      date: t("press.release2024Date"),
      title: t("press.release2024Title"),
      description: t("press.release2024Desc"),
      link: "#",
    },
    {
      date: t("press.release2023Date"),
      title: t("press.release2023Title"),
      description: t("press.release2023Desc"),
      link: "#",
    },
  ];

  const mediaCoverage = [
    {
      outlet: t("press.outletTechCrunch"),
      title: t("press.coverageTechCrunch"),
      date: t("press.dateTechCrunch"),
    },
    {
      outlet: t("press.outletForbes"),
      title: t("press.coverageForbes"),
      date: t("press.dateForbes"),
    },
    {
      outlet: t("press.outletWired"),
      title: t("press.coverageWired"),
      date: t("press.dateWired"),
    },
    {
      outlet: t("press.outletInfoWorld"),
      title: t("press.coverageInfoWorld"),
      date: t("press.dateInfoWorld"),
    },
  ];

  const brandAssets = [
    {
      icon: FileText,
      title: t("press.brandGuidelines"),
      description: t("press.brandGuidelinesDesc"),
    },
    {
      icon: Globe,
      icon2: ExternalLink,
      title: t("press.logoAssets"),
      description: t("press.logoAssetsDesc"),
    },
    {
      icon: Newspaper,
      title: t("press.mediaKit"),
      description: t("press.mediaKitDesc"),
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
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground leading-tight text-balance">
                {t("press.heroTitle")}
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
                {t("press.heroDescription")}
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-start gap-4">
                <Link href={`/${locale}/contact`}>
                  <Button size="lg" className="gap-2 h-12 px-6 text-base">
                    {t("press.contactPress")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Press Releases */}
        <section className="py-20 lg:py-28 border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("press.releasesTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("press.releasesDescription")}
              </p>
            </div>
            <div className="space-y-6">
              {pressReleases.map((release) => (
                <div
                  key={release.title}
                  className="p-6 rounded-lg border border-border bg-card hover:border-foreground/20 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-foreground/5 shrink-0">
                      <FileText className="h-5 w-5 text-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <span>{release.date}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        {release.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                        {release.description}
                      </p>
                      <Link
                        href={release.link}
                        className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                      >
                        {t("press.readMore")}
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Media Coverage */}
        <section className="py-20 lg:py-28 border-b border-border bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("press.coverageTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("press.coverageDescription")}
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {mediaCoverage.map((coverage) => (
                <div
                  key={coverage.title}
                  className="p-6 rounded-lg border border-border bg-card hover:border-foreground/20 transition-colors"
                >
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                    <span>{coverage.outlet}</span>
                    <span className="text-border">•</span>
                    <span>{coverage.date}</span>
                  </div>
                  <h3 className="text-base font-semibold text-foreground">{coverage.title}</h3>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Brand Assets */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("press.assetsTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("press.assetsDescription")}
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {brandAssets.map((asset) => (
                <div
                  key={asset.title}
                  className="p-6 rounded-lg border border-border bg-card hover:border-foreground/20 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-foreground/5">
                      <asset.icon className="h-5 w-5 text-foreground" />
                    </div>
                    {asset.icon2 && (
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-foreground/5">
                        <asset.icon2 className="h-5 w-5 text-foreground" />
                      </div>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{asset.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    {asset.description}
                  </p>
                  <Button variant="outline" size="sm" className="w-full">
                    {t("press.download")}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-20 lg:py-28 border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("press.contactTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("press.contactDescription")}
              </p>
              <div className="mt-8">
                <a href="mailto:press@skygenesisenterprise.com">
                  <Button size="lg" className="gap-2">
                    <Mail className="h-4 w-4" />
                    {t("press.emailPress")}
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
