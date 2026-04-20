import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/public/Header";
import { Footer } from "@/components/public/Footer";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Scale,
  Mail,
  Users,
  Lock,
  Globe,
} from "lucide-react";

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Public" });

  const sections = [
    {
      title: t("terms.introTitle"),
      content: t("terms.introContent"),
    },
    {
      title: t("terms.acceptanceTitle"),
      content: t("terms.acceptanceContent"),
    },
    {
      title: t("terms.servicesTitle"),
      content: t("terms.servicesContent"),
    },
    {
      title: t("terms.accountsTitle"),
      content: t("terms.accountsContent"),
    },
    {
      title: t("terms.paymentTitle"),
      content: t("terms.paymentContent"),
    },
    {
      title: t("terms.intellectualTitle"),
      content: t("terms.intellectualContent"),
    },
    {
      title: t("terms.limitationTitle"),
      content: t("terms.limitationContent"),
    },
    {
      title: t("terms.indemnificationTitle"),
      content: t("terms.indemnificationContent"),
    },
    {
      title: t("terms.terminationTitle"),
      content: t("terms.terminationContent"),
    },
    {
      title: t("terms.governingTitle"),
      content: t("terms.governingContent"),
    },
    {
      title: t("terms.changesTitle"),
      content: t("terms.changesContent"),
    },
    {
      title: t("terms.contactTitle"),
      content: t("terms.contactContent"),
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
                <Scale className="h-4 w-4 text-emerald-500" />
                <span className="font-medium">{t("terms.badge")}</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground leading-tight text-balance">
                {t("terms.heroTitle")}
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
                {t("terms.heroDescription")}
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-start gap-4">
                <Link href={`/${locale}/contact`}>
                  <Button size="lg" className="gap-2 h-12 px-6 text-base">
                    {t("terms.contactUs")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href={`/${locale}/privacy`}>
                  <Button variant="outline" size="lg" className="gap-2 h-12 px-6 text-base">
                    {t("terms.viewPrivacy")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Summary */}
        <section className="py-20 lg:py-28 border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("terms.summaryTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("terms.summaryDescription")}
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-6 rounded-lg border border-border bg-card">
                <Users className="h-8 w-8 text-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t("terms.summaryAccountTitle")}
                </h3>
                <p className="text-sm text-muted-foreground">{t("terms.summaryAccountDesc")}</p>
              </div>
              <div className="p-6 rounded-lg border border-border bg-card">
                <Lock className="h-8 w-8 text-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t("terms.summarySecurityTitle")}
                </h3>
                <p className="text-sm text-muted-foreground">{t("terms.summarySecurityDesc")}</p>
              </div>
              <div className="p-6 rounded-lg border border-border bg-card">
                <Globe className="h-8 w-8 text-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t("terms.summaryDataTitle")}
                </h3>
                <p className="text-sm text-muted-foreground">{t("terms.summaryDataDesc")}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Terms Content */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="prose prose-lg max-w-none">
              <p className="text-lg text-muted-foreground mb-12">
                {t("terms.lastUpdated")}: {t("terms.lastUpdatedDate")}
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
                {t("terms.questionsTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("terms.questionsDescription")}
              </p>
              <div className="mt-8">
                <a href="mailto:legal@skygenesisenterprise.com">
                  <Button size="lg" className="gap-2">
                    <Mail className="h-4 w-4" />
                    {t("terms.emailLegal")}
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
