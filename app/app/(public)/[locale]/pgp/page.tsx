import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/public/Header";
import { Footer } from "@/components/public/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Key, CheckCircle2, Download, Mail, AlertTriangle } from "lucide-react";

export default async function PGPPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Public" });

  const steps = [t("pgp.step1"), t("pgp.step2"), t("pgp.step3"), t("pgp.step4"), t("pgp.step5")];

  const uses = [
    { title: t("pgp.useVerifyTitle"), description: t("pgp.useVerifyDesc") },
    { title: t("pgp.useEncryptTitle"), description: t("pgp.useEncryptDesc") },
    { title: t("pgp.useSignTitle"), description: t("pgp.useSignDesc") },
    { title: t("pgp.useConfirmTitle"), description: t("pgp.useConfirmDesc") },
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
                <Key className="h-4 w-4 text-emerald-500" />
                <span className="font-medium">{t("pgp.badge")}</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground leading-tight text-balance">
                {t("pgp.heroTitle")}
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
                {t("pgp.heroDescription")}
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-start gap-4">
                <Link href={`/${locale}/security`}>
                  <Button size="lg" className="gap-2 h-12 px-6 text-base">
                    {t("pgp.viewSecurity")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href={`/${locale}/contact`}>
                  <Button variant="outline" size="lg" className="gap-2 h-12 px-6 text-base">
                    {t("pgp.contactUs")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Why Verify Section */}
        <section className="py-20 lg:py-28 border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("pgp.whyTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("pgp.whyDescription")}
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-6 rounded-lg border border-border bg-card">
                <Shield className="h-8 w-8 text-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t("pgp.whyAuthTitle")}
                </h3>
                <p className="text-sm text-muted-foreground">{t("pgp.whyAuthDesc")}</p>
              </div>
              <div className="p-6 rounded-lg border border-border bg-card">
                <CheckCircle2 className="h-8 w-8 text-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t("pgp.whyTrustTitle")}
                </h3>
                <p className="text-sm text-muted-foreground">{t("pgp.whyTrustDesc")}</p>
              </div>
              <div className="p-6 rounded-lg border border-border bg-card">
                <Key className="h-8 w-8 text-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t("pgp.whySecureTitle")}
                </h3>
                <p className="text-sm text-muted-foreground">{t("pgp.whySecureDesc")}</p>
              </div>
            </div>
          </div>
        </section>

        {/* PGP Key Section */}
        <section className="py-20 lg:py-28 border-b border-border bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("pgp.publicKeyTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("pgp.publicKeyDescription")}
              </p>
            </div>
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="p-6 rounded-lg border border-border bg-card">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  {t("pgp.keyBlockTitle")}
                </h3>
                <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                  <pre className="text-xs sm:text-sm whitespace-pre-wrap break-all text-muted-foreground">
                    {t("pgp.keyBlock")}
                  </pre>
                </div>
                <div className="mt-4">
                  <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    {t("pgp.downloadKey")}
                  </Button>
                </div>
              </div>
              <div className="p-6 rounded-lg border border-border bg-card">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  {t("pgp.fingerprintTitle")}
                </h3>
                <div className="bg-muted p-4 rounded-lg">
                  <code className="text-sm break-all text-foreground font-mono">
                    {t("pgp.fingerprint")}
                  </code>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">{t("pgp.fingerprintDesc")}</p>
              </div>
            </div>
          </div>
        </section>

        {/* How to Verify Section */}
        <section className="py-20 lg:py-28 border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("pgp.howVerifyTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("pgp.howVerifyDescription")}
              </p>
            </div>
            <div className="max-w-3xl">
              <ol className="space-y-4">
                {steps.map((step, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-foreground text-background font-semibold shrink-0">
                      {index + 1}
                    </div>
                    <span className="text-muted-foreground">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* Usage Section */}
        <section className="py-20 lg:py-28 border-b border-border bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("pgp.usageTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("pgp.usageDescription")}
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {uses.map((use) => (
                <div key={use.title} className="p-6 rounded-lg border border-border bg-card">
                  <div className="flex items-center gap-3 mb-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <h3 className="text-base font-semibold text-foreground">{use.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{use.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Warning Section */}
        <section className="py-20 lg:py-28 border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
              <div className="p-6 rounded-lg border border-yellow-500/50 bg-yellow-500/10">
                <div className="flex items-start gap-4">
                  <AlertTriangle className="h-6 w-6 text-yellow-500 shrink-0 mt-1" />
                  <div>
                    <h2 className="text-xl font-semibold text-foreground mb-2">
                      {t("pgp.warningTitle")}
                    </h2>
                    <p className="text-muted-foreground">{t("pgp.warningContent")}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("pgp.questionsTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("pgp.questionsDescription")}
              </p>
              <div className="mt-8">
                <a href="mailto:security@skygenesisenterprise.com">
                  <Button size="lg" className="gap-2">
                    <Mail className="h-4 w-4" />
                    {t("pgp.emailSecurity")}
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
