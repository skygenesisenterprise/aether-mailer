import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/public/Header";
import { Footer } from "@/components/public/Footer";
import { Button } from "@/components/ui/button";
import { GitHubIcon } from "@/components/ui/icons/GitHubIcon";
import { FaqAccordion } from "@/components/public/FaqAccordion";
import {
  Shield,
  Lock,
  Key,
  Fingerprint,
  ArrowRight,
  Eye,
  EyeOff,
  Database,
} from "lucide-react";

export default async function EmailEncryptionPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Public" });

  const features = [
    {
      icon: Key,
      title: t("emailEncryption.featurePgp"),
      description: t("emailEncryption.featurePgpDesc"),
    },
    {
      icon: Fingerprint,
      title: t("emailEncryption.featureSmime"),
      description: t("emailEncryption.featureSmimeDesc"),
    },
    {
      icon: Lock,
      title: t("emailEncryption.featureTls"),
      description: t("emailEncryption.featureTlsDesc"),
    },
    {
      icon: Database,
      title: t("emailEncryption.featureKeys"),
      description: t("emailEncryption.featureKeysDesc"),
    },
    {
      icon: Shield,
      title: t("emailEncryption.featureSigning"),
      description: t("emailEncryption.featureSigningDesc"),
    },
    {
      icon: EyeOff,
      title: t("emailEncryption.featureZeroKnowledge"),
      description: t("emailEncryption.featureZeroKnowledgeDesc"),
    },
  ];

  const encryptionTypes = [
    {
      icon: Lock,
      title: t("emailEncryption.typeSymetric"),
      description: t("emailEncryption.typeSymetricDesc"),
    },
    {
      icon: Key,
      title: t("emailEncryption.typeAsymetric"),
      description: t("emailEncryption.typeAsymetricDesc"),
    },
    {
      icon: Eye,
      title: t("emailEncryption.typeEndToEnd"),
      description: t("emailEncryption.typeEndToEndDesc"),
    },
  ];

  const faqs = [
    {
      question: t("emailEncryption.faqPgpTitle"),
      answer: t("emailEncryption.faqPgpAnswer"),
    },
    {
      question: t("emailEncryption.faqKeysTitle"),
      answer: t("emailEncryption.faqKeysAnswer"),
    },
    {
      question: t("emailEncryption.faqCompatibilityTitle"),
      answer: t("emailEncryption.faqCompatibilityAnswer"),
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
                {t("emailEncryption.badge")}
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground leading-tight text-balance">
                {t("emailEncryption.heroTitle")}
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
                {t("emailEncryption.heroDescription")}
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-start gap-4">
                <Link href="https://github.com/skygenesisenterprise/aether-mailer">
                  <Button size="lg" className="gap-2 h-12 px-6 text-base">
                    {t("emailEncryption.ctaGetStarted")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="https://github.com/skygenesisenterprise/aether-mailer">
                  <Button variant="outline" size="lg" className="gap-2 h-12 px-6 text-base">
                    <GitHubIcon className="h-4 w-4" />
                    {t("hero.ctaGithub")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("emailEncryption.featuresTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("emailEncryption.featuresDescription")}
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature) => (
                <div key={feature.title} className="group">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-foreground/5 group-hover:bg-foreground/10 transition-colors">
                      <feature.icon className="h-5 w-5 text-foreground" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground">{feature.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed pl-13">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Encryption Types Section */}
        <section className="py-20 lg:py-28 border-b border-border bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("emailEncryption.typesTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("emailEncryption.typesDescription")}
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {encryptionTypes.map((type) => (
                <div
                  key={type.title}
                  className="p-6 rounded-lg border border-border bg-card"
                >
                  <type.icon className="h-8 w-8 text-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">{type.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {type.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 lg:py-28 border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("emailEncryption.faqTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("emailEncryption.faqDescription")}
              </p>
            </div>
            <FaqAccordion faqs={faqs} />
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("emailEncryption.ctaTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">{t("emailEncryption.ctaDescription")}</p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="https://github.com/skygenesisenterprise/aether-mailer">
                  <Button size="lg" className="gap-2 h-12 px-8 text-base">
                    {t("emailEncryption.ctaGetStarted")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href={`/${locale}/company/contact`}>
                  <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                    {t("emailEncryption.ctaContactSales")}
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