import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/public/Header";
import { Footer } from "@/components/public/Footer";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Shield,
  Users,
  Globe,
  Mail,
  CheckCircle2,
  Server,
} from "lucide-react";

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Public" });

  const dataTypes = [
    {
      icon: Users,
      title: t("privacy.personalDataTitle"),
      description: t("privacy.personalDataDesc"),
    },
    {
      icon: Server,
      title: t("privacy.usageDataTitle"),
      description: t("privacy.usageDataDesc"),
    },
    {
      icon: Globe,
      title: t("privacy.technicalDataTitle"),
      description: t("privacy.technicalDataDesc"),
    },
  ];

  const rights = [
    { title: t("privacy.rightAccess"), description: t("privacy.rightAccessDesc") },
    { title: t("privacy.rightRectification"), description: t("privacy.rightRectificationDesc") },
    { title: t("privacy.rightErasure"), description: t("privacy.rightErasureDesc") },
    { title: t("privacy.rightPortability"), description: t("privacy.rightPortabilityDesc") },
    { title: t("privacy.rightObject"), description: t("privacy.rightObjectDesc") },
    { title: t("privacy.rightWithdraw"), description: t("privacy.rightWithdrawDesc") },
  ];

  const sections = [
    {
      title: t("privacy.introTitle"),
      content: t("privacy.introContent"),
    },
    {
      title: t("privacy.collectionTitle"),
      content: t("privacy.collectionContent"),
    },
    {
      title: t("privacy.usageTitle"),
      content: t("privacy.usageContent"),
    },
    {
      title: t("privacy.sharingTitle"),
      content: t("privacy.sharingContent"),
    },
    {
      title: t("privacy.securityTitle"),
      content: t("privacy.securityContent"),
    },
    {
      title: t("privacy.retentionTitle"),
      content: t("privacy.retentionContent"),
    },
    {
      title: t("privacy.yourRightsTitle"),
      content: t("privacy.yourRightsContent"),
    },
    {
      title: t("privacy.childrenTitle"),
      content: t("privacy.childrenContent"),
    },
    {
      title: t("privacy.changesTitle"),
      content: t("privacy.changesContent"),
    },
    {
      title: t("privacy.contactTitle"),
      content: t("privacy.contactContent"),
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
                <Shield className="h-4 w-4 text-emerald-500" />
                <span className="font-medium">{t("privacy.badge")}</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground leading-tight text-balance">
                {t("privacy.heroTitle")}
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
                {t("privacy.heroDescription")}
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-start gap-4">
                <Link href={`/${locale}/contact`}>
                  <Button size="lg" className="gap-2 h-12 px-6 text-base">
                    {t("privacy.contactUs")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href={`/${locale}/docs`}>
                  <Button variant="outline" size="lg" className="gap-2 h-12 px-6 text-base">
                    {t("privacy.viewDocs")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Data We Collect */}
        <section className="py-20 lg:py-28 border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("privacy.dataWeCollect")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("privacy.dataWeCollectDescription")}
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {dataTypes.map((data) => (
                <div
                  key={data.title}
                  className="p-6 rounded-lg border border-border bg-card hover:border-foreground/20 transition-colors"
                >
                  <data.icon className="h-8 w-8 text-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">{data.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {data.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Your Rights */}
        <section className="py-20 lg:py-28 border-b border-border bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("privacy.yourRightsTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("privacy.yourRightsDescription")}
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rights.map((right) => (
                <div key={right.title} className="p-6 rounded-lg border border-border bg-card">
                  <div className="flex items-center gap-3 mb-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <h3 className="text-base font-semibold text-foreground">{right.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{right.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Privacy Policy Content */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="prose prose-lg max-w-none">
              <p className="text-lg text-muted-foreground mb-12">
                {t("privacy.lastUpdated")}: {t("privacy.lastUpdatedDate")}
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
                {t("privacy.questionsTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("privacy.questionsDescription")}
              </p>
              <div className="mt-8">
                <a href="mailto:privacy@skygenesisenterprise.com">
                  <Button size="lg" className="gap-2">
                    <Mail className="h-4 w-4" />
                    {t("privacy.emailPrivacy")}
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
