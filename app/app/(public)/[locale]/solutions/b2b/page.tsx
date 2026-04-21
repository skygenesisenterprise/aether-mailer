import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/public/Header";
import { Footer } from "@/components/public/Footer";
import { Button } from "@/components/ui/button";
import { FaqAccordion } from "@/components/public/FaqAccordion";
import {
  ArrowRight,
  Building2,
  Briefcase,
  Users,
  Globe,
  Shield,
  Lock,
  Mail,
  FileCheck,
  Handshake,
  TrendingUp,
  FileText,
  BookOpen,
  Video,
  Award,
} from "lucide-react";

export default async function B2BPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Public" });

  const capabilities = [
    {
      icon: Mail,
      title: t("b2b.capabilitiesEmailTitle"),
      description: t("b2b.capabilitiesEmailDesc"),
    },
    {
      icon: Building2,
      title: t("b2b.capabilitiesMultiDomainTitle"),
      description: t("b2b.capabilitiesMultiDomainDesc"),
    },
    {
      icon: Shield,
      title: t("b2b.capabilitiesSecurityTitle"),
      description: t("b2b.capabilitiesSecurityDesc"),
    },
    {
      icon: Users,
      title: t("b2b.capabilitiesCollaborationTitle"),
      description: t("b2b.capabilitiesCollaborationDesc"),
    },
    {
      icon: FileCheck,
      title: t("b2b.capabilitiesComplianceTitle"),
      description: t("b2b.capabilitiesComplianceDesc"),
    },
    {
      icon: TrendingUp,
      title: t("b2b.capabilitiesAnalyticsTitle"),
      description: t("b2b.capabilitiesAnalyticsDesc"),
    },
  ];

  const benefits = [
    {
      icon: Handshake,
      title: t("b2b.benefitsProfessionalTitle"),
      description: t("b2b.benefitsProfessionalDesc"),
    },
    {
      icon: Globe,
      title: t("b2b.benefitsGlobalTitle"),
      description: t("b2b.benefitsGlobalDesc"),
    },
    {
      icon: Lock,
      title: t("b2b.benefitsSecureTitle"),
      description: t("b2b.benefitsSecureDesc"),
    },
    {
      icon: Briefcase,
      title: t("b2b.benefitsBrandTitle"),
      description: t("b2b.benefitsBrandDesc"),
    },
  ];

  const metrics = [
    {
      value: "99.9%",
      label: t("b2b.metricsDeliverability"),
    },
    {
      value: "<5s",
      label: t("b2b.metricsLatency"),
    },
    {
      value: "250+",
      label: t("b2b.metricsCountries"),
    },
    {
      value: "50M+",
      label: t("b2b.metricsEmails"),
    },
  ];

  const faqs = [
    {
      question: t("b2b.faqDeliverabilityTitle"),
      answer: t("b2b.faqDeliverabilityAnswer"),
    },
    {
      question: t("b2b.faqBrandingTitle"),
      answer: t("b2b.faqBrandingAnswer"),
    },
    {
      question: t("b2b.faqIntegrationTitle"),
      answer: t("b2b.faqIntegrationAnswer"),
    },
    {
      question: t("b2b.faqComplianceTitle"),
      answer: t("b2b.faqComplianceAnswer"),
    },
  ];

  const resources = [
    {
      icon: FileText,
      title: t("b2b.resourcesGuide"),
      description: t("b2b.resourcesGuideDesc"),
    },
    {
      icon: BookOpen,
      title: t("b2b.resourcesBestPractices"),
      description: t("b2b.resourcesBestPracticesDesc"),
    },
    {
      icon: Video,
      title: t("b2b.resourcesWebinar"),
      description: t("b2b.resourcesWebinarDesc"),
    },
    {
      icon: Award,
      title: t("b2b.resourcesCaseStudy"),
      description: t("b2b.resourcesCaseStudyDesc"),
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
                {t("b2b.badge")}
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground leading-tight text-balance">
                {t("b2b.heroTitle")}
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
                {t("b2b.heroDescription")}
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-start gap-4">
                <Link href={`/${locale}/products/mail-server`}>
                  <Button size="lg" className="gap-2 h-12 px-6 text-base">
                    {t("b2b.ctaSelfHosted")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href={`/${locale}/company/contact`}>
                  <Button variant="outline" size="lg" className="gap-2 h-12 px-6 text-base">
                    {t("b2b.ctaContact")}
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
                {t("b2b.benefitsTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("b2b.benefitsDescription")}
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
                {t("b2b.capabilitiesTitle")}
              </h2>
              <p className="mt-4 text-lg text-background/70 leading-relaxed">
                {t("b2b.capabilitiesDescription")}
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
                {t("b2b.useCasesTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("b2b.useCasesDescription")}
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-6 rounded-lg border border-border bg-card">
                <Briefcase className="h-8 w-8 text-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t("b2b.useCaseProfessional")}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("b2b.useCaseProfessionalDesc")}
                </p>
              </div>
              <div className="p-6 rounded-lg border border-border bg-card">
                <Building2 className="h-8 w-8 text-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t("b2b.useCaseEnterprise")}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("b2b.useCaseEnterpriseDesc")}
                </p>
              </div>
              <div className="p-6 rounded-lg border border-border bg-card">
                <Users className="h-8 w-8 text-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t("b2b.useCaseTeams")}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("b2b.useCaseTeamsDesc")}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-28 border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("b2b.faqTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("b2b.faqDescription")}
              </p>
            </div>
            <FaqAccordion faqs={faqs} />
          </div>
        </section>

        <section className="py-20 lg:py-28 border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("b2b.resourcesTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("b2b.resourcesDescription")}
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
                {t("b2b.ctaTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">{t("b2b.ctaDescription")}</p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href={`/${locale}/products/mail-server`}>
                  <Button size="lg" className="gap-2 h-12 px-8 text-base">
                    {t("b2b.ctaGetStarted")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href={`/${locale}/company/contact`}>
                  <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                    {t("b2b.ctaContactSales")}
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