import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/public/Header";
import { Footer } from "@/components/public/Footer";
import { Button } from "@/components/ui/button";
import { GitHubIcon } from "@/components/ui/icons/GitHubIcon";
import { FaqAccordion } from "@/components/public/FaqAccordion";
import {
  Archive,
  Search,
  Clock,
  Shield,
  ArrowRight,
  Database,
  Calendar,
  Users,
  Landmark,
  HeartPulse,
  Building,
} from "lucide-react";

export default async function EmailArchivingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Public" });

  const features = [
    {
      icon: Clock,
      title: t("emailArchiving.featureLongTerm"),
      description: t("emailArchiving.featureLongTermDesc"),
    },
    {
      icon: Search,
      title: t("emailArchiving.featureSearch"),
      description: t("emailArchiving.featureSearchDesc"),
    },
    {
      icon: Shield,
      title: t("emailArchiving.featureCompliance"),
      description: t("emailArchiving.featureComplianceDesc"),
    },
    {
      icon: Database,
      title: t("emailArchiving.featureIntegrity"),
      description: t("emailArchiving.featureIntegrityDesc"),
    },
    {
      icon: Archive,
      title: t("emailArchiving.featureStorage"),
      description: t("emailArchiving.featureStorageDesc"),
    },
    {
      icon: Search,
      title: t("emailArchiving.featureAccess"),
      description: t("emailArchiving.featureAccessDesc"),
    },
  ];

  const retentionPolicies = [
    {
      period: t("emailArchiving.retention1Year"),
      description: t("emailArchiving.retention1YearDesc"),
    },
    {
      period: t("emailArchiving.retention3Year"),
      description: t("emailArchiving.retention3YearDesc"),
    },
    {
      period: t("emailArchiving.retention7Year"),
      description: t("emailArchiving.retention7YearDesc"),
    },
    {
      period: t("emailArchiving.retentionInfinite"),
      description: t("emailArchiving.retentionInfiniteDesc"),
    },
  ];

  const industries = [
    {
      icon: Landmark,
      title: t("emailArchiving.industriesFinance"),
      description: t("emailArchiving.industriesFinanceDesc"),
    },
    {
      icon: HeartPulse,
      title: t("emailArchiving.industriesHealthcare"),
      description: t("emailArchiving.industriesHealthcareDesc"),
    },
    {
      icon: Building,
      title: t("emailArchiving.industriesLegal"),
      description: t("emailArchiving.industriesLegalDesc"),
    },
    {
      icon: Users,
      title: t("emailArchiving.industriesGovernment"),
      description: t("emailArchiving.industriesGovernmentDesc"),
    },
  ];

  const faqs = [
    {
      question: t("emailArchiving.faqDurationTitle"),
      answer: t("emailArchiving.faqDurationAnswer"),
    },
    {
      question: t("emailArchiving.faqAccessTitle"),
      answer: t("emailArchiving.faqAccessAnswer"),
    },
    {
      question: t("emailArchiving.faqCostTitle"),
      answer: t("emailArchiving.faqCostAnswer"),
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
                {t("emailArchiving.badge")}
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground leading-tight text-balance">
                {t("emailArchiving.heroTitle")}
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
                {t("emailArchiving.heroDescription")}
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-start gap-4">
                <Link href="https://github.com/skygenesisenterprise/aether-mailer">
                  <Button size="lg" className="gap-2 h-12 px-6 text-base">
                    {t("emailArchiving.ctaGetStarted")}
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
                {t("emailArchiving.featuresTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("emailArchiving.featuresDescription")}
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

        {/* Retention Policies Section */}
        <section className="py-20 lg:py-28 border-b border-border bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("emailArchiving.retentionTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("emailArchiving.retentionDescription")}
              </p>
            </div>
            <div className="grid md:grid-cols-4 gap-6">
              {retentionPolicies.map((policy) => (
                <div
                  key={policy.period}
                  className="p-6 rounded-lg border border-border bg-card text-center"
                >
                  <Calendar className="h-8 w-8 text-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">{policy.period}</h3>
                  <p className="text-sm text-muted-foreground">
                    {policy.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Industries Section */}
        <section className="py-20 lg:py-28 border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("emailArchiving.industriesTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("emailArchiving.industriesDescription")}
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {industries.map((industry) => (
                <div
                  key={industry.title}
                  className="p-6 rounded-lg border border-border bg-card"
                >
                  <industry.icon className="h-8 w-8 text-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">{industry.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {industry.description}
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
                {t("emailArchiving.faqTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("emailArchiving.faqDescription")}
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
                {t("emailArchiving.ctaTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">{t("emailArchiving.ctaDescription")}</p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="https://github.com/skygenesisenterprise/aether-mailer">
                  <Button size="lg" className="gap-2 h-12 px-8 text-base">
                    {t("emailArchiving.ctaGetStarted")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href={`/${locale}/company/contact`}>
                  <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                    {t("emailArchiving.ctaContactSales")}
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