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
  FileCheck,
  Clock,
  Users,
  Building,
  TrendingUp,
  DollarSign,
  CreditCard,
  Receipt,
  FileText,
  BookOpen,
  Video,
  Award,
  BadgeCheck,
  Scale,
} from "lucide-react";

export default async function FinancialPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Public" });

  const capabilities = [
    {
      icon: Shield,
      title: t("financial.capabilitiesSecurityTitle"),
      description: t("financial.capabilitiesSecurityDesc"),
    },
    {
      icon: Lock,
      title: t("financial.capabilitiesEncryptionTitle"),
      description: t("financial.capabilitiesEncryptionDesc"),
    },
    {
      icon: FileCheck,
      title: t("financial.capabilitiesComplianceTitle"),
      description: t("financial.capabilitiesComplianceDesc"),
    },
    {
      icon: Clock,
      title: t("financial.capabilitiesAuditTitle"),
      description: t("financial.capabilitiesAuditDesc"),
    },
    {
      icon: Users,
      title: t("financial.capabilitiesAccessTitle"),
      description: t("financial.capabilitiesAccessDesc"),
    },
    {
      icon: TrendingUp,
      title: t("financial.capabilitiesMonitoringTitle"),
      description: t("financial.capabilitiesMonitoringDesc"),
    },
  ];

  const benefits = [
    {
      icon: BadgeCheck,
      title: t("financial.benefitsComplianceTitle"),
      description: t("financial.benefitsComplianceDesc"),
    },
    {
      icon: Scale,
      title: t("financial.benefitsRegulationTitle"),
      description: t("financial.benefitsRegulationDesc"),
    },
    {
      icon: Building,
      title: t("financial.benefitsSecureTitle"),
      description: t("financial.benefitsSecureDesc"),
    },
    {
      icon: Clock,
      title: t("financial.benefitsReliabilityTitle"),
      description: t("financial.benefitsReliabilityDesc"),
    },
  ];

  const metrics = [
    {
      value: "DORA",
      label: t("financial.metricsDoraCompliance"),
    },
    {
      value: "99.99%",
      label: t("financial.metricsUptime"),
    },
    {
      value: "10ans",
      label: t("financial.metricsRetention"),
    },
    {
      value: "AES-256",
      label: t("financial.metricsEncryption"),
    },
  ];

  const useCases = [
    {
      icon: DollarSign,
      title: t("financial.useCaseBanking"),
      description: t("financial.useCaseBankingDesc"),
    },
    {
      icon: CreditCard,
      title: t("financial.useCaseInsurance"),
      description: t("financial.useCaseInsuranceDesc"),
    },
    {
      icon: Receipt,
      title: t("financial.useCaseAccounting"),
      description: t("financial.useCaseAccountingDesc"),
    },
    {
      icon: Building,
      title: t("financial.useCaseInvestment"),
      description: t("financial.useCaseInvestmentDesc"),
    },
  ];

  const faqs = [
    {
      question: t("financial.faqDoraTitle"),
      answer: t("financial.faqDoraAnswer"),
    },
    {
      question: t("financial.faqAuditTitle"),
      answer: t("financial.faqAuditAnswer"),
    },
    {
      question: t("financial.faqMigrationTitle"),
      answer: t("financial.faqMigrationAnswer"),
    },
    {
      question: t("financial.faqRetentionTitle"),
      answer: t("financial.faqRetentionAnswer"),
    },
  ];

  const resources = [
    {
      icon: FileText,
      title: t("financial.resourcesGuide"),
      description: t("financial.resourcesGuideDesc"),
    },
    {
      icon: BookOpen,
      title: t("financial.resourcesCompliance"),
      description: t("financial.resourcesComplianceDesc"),
    },
    {
      icon: Video,
      title: t("financial.resourcesWebinar"),
      description: t("financial.resourcesWebinarDesc"),
    },
    {
      icon: Award,
      title: t("financial.resourcesCaseStudy"),
      description: t("financial.resourcesCaseStudyDesc"),
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
                {t("financial.badge")}
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground leading-tight text-balance">
                {t("financial.heroTitle")}
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
                {t("financial.heroDescription")}
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-start gap-4">
                <Link href={`/${locale}/products/mail-server`}>
                  <Button size="lg" className="gap-2 h-12 px-6 text-base">
                    {t("financial.ctaSelfHosted")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href={`/${locale}/company/contact`}>
                  <Button variant="outline" size="lg" className="gap-2 h-12 px-6 text-base">
                    {t("financial.ctaContact")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-20 border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {metrics.map((metric) => (
                <div key={metric.label} className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-foreground">{metric.value}</div>
                  <div className="text-sm text-muted-foreground mt-1">{metric.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("financial.benefitsTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("financial.benefitsDescription")}
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit) => (
                <div
                  key={benefit.title}
                  className="p-6 rounded-lg border border-border bg-card hover:border-foreground/20 transition-colors"
                >
                  <benefit.icon className="h-8 w-8 text-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-28 bg-foreground text-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-background">
                {t("financial.capabilitiesTitle")}
              </h2>
              <p className="mt-4 text-lg text-background/70 leading-relaxed">
                {t("financial.capabilitiesDescription")}
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {capabilities.map((capability) => (
                <div key={capability.title} className="group">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-background/10 group-hover:bg-background/20 transition-colors">
                      <capability.icon className="h-5 w-5 text-background" />
                    </div>
                    <h3 className="text-base font-semibold text-background">{capability.title}</h3>
                  </div>
                  <p className="text-sm text-background/70 leading-relaxed pl-13">
                    {capability.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-28 border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("financial.useCasesTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("financial.useCasesDescription")}
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {useCases.map((useCase) => (
                <div
                  key={useCase.title}
                  className="p-6 rounded-lg border border-border bg-card hover:border-foreground/20 transition-colors"
                >
                  <useCase.icon className="h-8 w-8 text-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">{useCase.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {useCase.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-28 border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("financial.faqTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("financial.faqDescription")}
              </p>
            </div>
            <FaqAccordion faqs={faqs} />
          </div>
        </section>

        <section className="py-20 lg:py-28 border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("financial.resourcesTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("financial.resourcesDescription")}
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {resources.map((resource) => (
                <div
                  key={resource.title}
                  className="p-6 rounded-lg border border-border bg-card hover:border-foreground/20 transition-colors cursor-pointer"
                >
                  <resource.icon className="h-8 w-8 text-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">{resource.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {resource.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("financial.ctaTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">{t("financial.ctaDescription")}</p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href={`/${locale}/products/mail-server`}>
                  <Button size="lg" className="gap-2 h-12 px-8 text-base">
                    {t("financial.ctaGetStarted")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href={`/${locale}/company/contact`}>
                  <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                    {t("financial.ctaContactSales")}
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