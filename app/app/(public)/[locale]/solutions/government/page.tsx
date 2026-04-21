import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/public/Header";
import { Footer } from "@/components/public/Footer";
import { Button } from "@/components/ui/button";
import { FaqAccordion } from "@/components/public/FaqAccordion";
import {
  ArrowRight,
  Landmark,
  Shield,
  Lock,
  FileCheck,
  Clock,
  Users,
  Building,
  Globe,
  Archive,
  FileText,
  BookOpen,
  Video,
  Award,
  BadgeCheck,
  Handshake,
  Plane,
} from "lucide-react";

export default async function GovernmentPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Public" });

  const capabilities = [
    {
      icon: Shield,
      title: t("government.capabilitiesSecurityTitle"),
      description: t("government.capabilitiesSecurityDesc"),
    },
    {
      icon: Lock,
      title: t("government.capabilitiesEncryptionTitle"),
      description: t("government.capabilitiesEncryptionDesc"),
    },
    {
      icon: FileCheck,
      title: t("government.capabilitiesComplianceTitle"),
      description: t("government.capabilitiesComplianceDesc"),
    },
    {
      icon: Clock,
      title: t("government.capabilitiesRetentionTitle"),
      description: t("government.capabilitiesRetentionDesc"),
    },
    {
      icon: Users,
      title: t("government.capabilitiesAccessTitle"),
      description: t("government.capabilitiesAccessDesc"),
    },
    {
      icon: Globe,
      title: t("government.capabilitiesMultiDomainTitle"),
      description: t("government.capabilitiesMultiDomainDesc"),
    },
  ];

  const benefits = [
    {
      icon: BadgeCheck,
      title: t("government.benefitsCertifiedTitle"),
      description: t("government.benefitsCertifiedDesc"),
    },
    {
      icon: Building,
      title: t("government.benefitsInstitutionTitle"),
      description: t("government.benefitsInstitutionDesc"),
    },
    {
      icon: Handshake,
      title: t("government.benefitsCitizenTitle"),
      description: t("government.benefitsCitizenDesc"),
    },
    {
      icon: Clock,
      title: t("government.benefitsRetentionTitle"),
      description: t("government.benefitsRetentionDesc"),
    },
  ];

  const metrics = [
    {
      value: "FedRAMP",
      label: t("government.metricsCertified"),
    },
    {
      value: "99.99%",
      label: t("government.metricsUptime"),
    },
    {
      value: "10ans",
      label: t("government.metricsRetention"),
    },
    {
      value: "100%",
      label: t("government.metricsSovereignty"),
    },
  ];

  const useCases = [
    {
      icon: Landmark,
      title: t("government.useCaseAdministration"),
      description: t("government.useCaseAdministrationDesc"),
    },
    {
      icon: Users,
      title: t("government.useCaseCitizen"),
      description: t("government.useCaseCitizenDesc"),
    },
    {
      icon: Plane,
      title: t("government.useCaseDefense"),
      description: t("government.useCaseDefenseDesc"),
    },
    {
      icon: Archive,
      title: t("government.useCaseArchive"),
      description: t("government.useCaseArchiveDesc"),
    },
  ];

  const faqs = [
    {
      question: t("government.faqFedrampTitle"),
      answer: t("government.faqFedrampAnswer"),
    },
    {
      question: t("government.faqHostingTitle"),
      answer: t("government.faqHostingAnswer"),
    },
    {
      question: t("government.faqMigrationTitle"),
      answer: t("government.faqMigrationAnswer"),
    },
    {
      question: t("government.faqRetentionTitle"),
      answer: t("government.faqRetentionAnswer"),
    },
  ];

  const resources = [
    {
      icon: FileText,
      title: t("government.resourcesGuide"),
      description: t("government.resourcesGuideDesc"),
    },
    {
      icon: BookOpen,
      title: t("government.resourcesCompliance"),
      description: t("government.resourcesComplianceDesc"),
    },
    {
      icon: Video,
      title: t("government.resourcesWebinar"),
      description: t("government.resourcesWebinarDesc"),
    },
    {
      icon: Award,
      title: t("government.resourcesCaseStudy"),
      description: t("government.resourcesCaseStudyDesc"),
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
                {t("government.badge")}
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground leading-tight text-balance">
                {t("government.heroTitle")}
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
                {t("government.heroDescription")}
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-start gap-4">
                <Link href={`/${locale}/products/mail-server`}>
                  <Button size="lg" className="gap-2 h-12 px-6 text-base">
                    {t("government.ctaSelfHosted")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href={`/${locale}/company/contact`}>
                  <Button variant="outline" size="lg" className="gap-2 h-12 px-6 text-base">
                    {t("government.ctaContact")}
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
                {t("government.benefitsTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("government.benefitsDescription")}
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
                {t("government.capabilitiesTitle")}
              </h2>
              <p className="mt-4 text-lg text-background/70 leading-relaxed">
                {t("government.capabilitiesDescription")}
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
                {t("government.useCasesTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("government.useCasesDescription")}
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
                {t("government.faqTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("government.faqDescription")}
              </p>
            </div>
            <FaqAccordion faqs={faqs} />
          </div>
        </section>

        <section className="py-20 lg:py-28 border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("government.resourcesTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("government.resourcesDescription")}
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
                {t("government.ctaTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">{t("government.ctaDescription")}</p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href={`/${locale}/products/mail-server`}>
                  <Button size="lg" className="gap-2 h-12 px-8 text-base">
                    {t("government.ctaGetStarted")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href={`/${locale}/company/contact`}>
                  <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                    {t("government.ctaContactSales")}
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