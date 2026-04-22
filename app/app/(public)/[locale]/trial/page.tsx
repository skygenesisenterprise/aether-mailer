import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/public/Header";
import { Footer } from "@/components/public/Footer";
import { Button } from "@/components/ui/button";
import { FaqAccordion } from "@/components/public/FaqAccordion";
import {
  ArrowRight,
  Shield,
  Lock,
  Key,
  Globe,
  Database,
  Archive,
  UserCheck,
  Settings,
  Mail,
  CheckCircle2,
  Zap,
} from "lucide-react";

export default async function TrialPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Public.trial" });

  const benefits = [
    {
      icon: Lock,
      title: t("noCardTitle"),
      description: t("noCardDescription"),
    },
    {
      icon: Zap,
      title: t("fullFeaturesTitle"),
      description: t("fullFeaturesDescription"),
    },
    {
      icon: UserCheck,
      title: t("supportTitle"),
      description: t("supportDescription"),
    },
    {
      icon: Settings,
      title: t("setupTitle"),
      description: t("setupDescription"),
    },
  ];

  const features = [
    {
      icon: Mail,
      title: t("featureUnlimited"),
      description: t("featureUnlimitedDesc"),
    },
    {
      icon: Globe,
      title: t("featureAllDomains"),
      description: t("featureAllDomainsDesc"),
    },
    {
      icon: Database,
      title: t("featureApi"),
      description: t("featureApiDesc"),
    },
    {
      icon: Shield,
      title: t("featureSecurity"),
      description: t("featureSecurityDesc"),
    },
    {
      icon: Archive,
      title: t("featureArchiving"),
      description: t("featureArchivingDesc"),
    },
    {
      icon: UserCheck,
      title: t("featureSupportTrial"),
      description: t("featureSupportTrialDesc"),
    },
  ];

  const faqs = [
    {
      question: t("faqDurationTitle"),
      answer: t("faqDurationAnswer"),
    },
    {
      question: t("faqCardTitle"),
      answer: t("faqCardAnswer"),
    },
    {
      question: t("faqDataTitle"),
      answer: t("faqDataAnswer"),
    },
    {
      question: t("faqCancelTitle"),
      answer: t("faqCancelAnswer"),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header locale={locale as import("@/lib/locale").Locale} />

      <main className="flex-1">
        <section className="relative py-24 lg:py-32 border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                {t("badge")}
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground leading-tight text-balance">
                {t("heroTitle")}
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
                {t("heroDescription")}
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-start gap-4">
                <Link href={`/${locale}/company/contact`}>
                  <Button size="lg" className="gap-2 h-12 px-6 text-base">
                    {t("ctaButton")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {benefits.map((benefit) => (
                <div key={benefit.title} className="text-center">
                  <benefit.icon className="h-10 w-10 mx-auto text-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-28 border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("featuresIncludedTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("featuresIncludedDescription")}
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature) => (
                <div key={feature.title} className="flex items-start gap-4 p-6 rounded-lg border border-border bg-card">
                  <feature.icon className="h-8 w-8 text-foreground shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("faqTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("faqDescription")}
              </p>
            </div>
            <FaqAccordion faqs={faqs} />
          </div>
        </section>

        <section className="py-20 lg:py-28 border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("ctaTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">{t("ctaDescription")}</p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href={`/${locale}/company/contact`}>
                  <Button size="lg" className="gap-2 h-12 px-8 text-base">
                    {t("ctaButton")}
                    <ArrowRight className="h-4 w-4" />
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