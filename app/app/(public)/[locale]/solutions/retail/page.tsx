import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/public/Header";
import { Footer } from "@/components/public/Footer";
import { Button } from "@/components/ui/button";
import { FaqAccordion } from "@/components/public/FaqAccordion";
import {
  ArrowRight,
  ShoppingCart,
  Shield,
  Lock,
  Mail,
  Clock,
  TrendingUp,
  Tag,
  Package,
  Receipt,
  FileText,
  BookOpen,
  Video,
  Award,
  BarChart3,
  Zap,
} from "lucide-react";

export default async function RetailPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Public" });

  const capabilities = [
    {
      icon: Mail,
      title: t("retail.capabilitiesTransactionalTitle"),
      description: t("retail.capabilitiesTransactionalDesc"),
    },
    {
      icon: Tag,
      title: t("retail.capabilitiesMarketingTitle"),
      description: t("retail.capabilitiesMarketingDesc"),
    },
    {
      icon: Package,
      title: t("retail.capabilitiesShippingTitle"),
      description: t("retail.capabilitiesShippingDesc"),
    },
    {
      icon: Receipt,
      title: t("retail.capabilitiesInvoicingTitle"),
      description: t("retail.capabilitiesInvoicingDesc"),
    },
    {
      icon: Shield,
      title: t("retail.capabilitiesSecurityTitle"),
      description: t("retail.capabilitiesSecurityDesc"),
    },
    {
      icon: TrendingUp,
      title: t("retail.capabilitiesAnalyticsTitle"),
      description: t("retail.capabilitiesAnalyticsDesc"),
    },
  ];

  const benefits = [
    {
      icon: Zap,
      title: t("retail.benefitsSpeedTitle"),
      description: t("retail.benefitsSpeedDesc"),
    },
    {
      icon: BarChart3,
      title: t("retail.benefitsConversionTitle"),
      description: t("retail.benefitsConversionDesc"),
    },
    {
      icon: Lock,
      title: t("retail.benefitsSecurityTitle"),
      description: t("retail.benefitsSecurityDesc"),
    },
    {
      icon: Clock,
      title: t("retail.benefitsAutomationTitle"),
      description: t("retail.benefitsAutomationDesc"),
    },
  ];

  const metrics = [
    {
      value: "99.9%",
      label: t("retail.metricsDeliverability"),
    },
    {
      value: "<1s",
      label: t("retail.metricsLatency"),
    },
    {
      value: "10M+",
      label: t("retail.metricsEmails"),
    },
    {
      value: "250+",
      label: t("retail.metricsTemplates"),
    },
  ];

  const useCases = [
    {
      icon: ShoppingCart,
      title: t("retail.useCaseEcommerce"),
      description: t("retail.useCaseEcommerceDesc"),
    },
    {
      icon: Package,
      title: t("retail.useCaseShipping"),
      description: t("retail.useCaseShippingDesc"),
    },
    {
      icon: Receipt,
      title: t("retail.useCaseInvoicing"),
      description: t("retail.useCaseInvoicingDesc"),
    },
    {
      icon: Tag,
      title: t("retail.useCaseMarketing"),
      description: t("retail.useCaseMarketingDesc"),
    },
  ];

  const faqs = [
    {
      question: t("retail.faqTransactionalTitle"),
      answer: t("retail.faqTransactionalAnswer"),
    },
    {
      question: t("retail.faqVolumeTitle"),
      answer: t("retail.faqVolumeAnswer"),
    },
    {
      question: t("retail.faqTemplatesTitle"),
      answer: t("retail.faqTemplatesAnswer"),
    },
    {
      question: t("retail.faqIntegrationTitle"),
      answer: t("retail.faqIntegrationAnswer"),
    },
  ];

  const resources = [
    {
      icon: FileText,
      title: t("retail.resourcesGuide"),
      description: t("retail.resourcesGuideDesc"),
    },
    {
      icon: BookOpen,
      title: t("retail.resourcesTemplates"),
      description: t("retail.resourcesTemplatesDesc"),
    },
    {
      icon: Video,
      title: t("retail.resourcesWebinar"),
      description: t("retail.resourcesWebinarDesc"),
    },
    {
      icon: Award,
      title: t("retail.resourcesCaseStudy"),
      description: t("retail.resourcesCaseStudyDesc"),
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
                {t("retail.badge")}
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground leading-tight text-balance">
                {t("retail.heroTitle")}
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
                {t("retail.heroDescription")}
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-start gap-4">
                <Link href={`/${locale}/products/mail-server`}>
                  <Button size="lg" className="gap-2 h-12 px-6 text-base">
                    {t("retail.ctaSelfHosted")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href={`/${locale}/company/contact`}>
                  <Button variant="outline" size="lg" className="gap-2 h-12 px-6 text-base">
                    {t("retail.ctaContact")}
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
                {t("retail.benefitsTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("retail.benefitsDescription")}
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
                {t("retail.capabilitiesTitle")}
              </h2>
              <p className="mt-4 text-lg text-background/70 leading-relaxed">
                {t("retail.capabilitiesDescription")}
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
                {t("retail.useCasesTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("retail.useCasesDescription")}
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
                {t("retail.faqTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("retail.faqDescription")}
              </p>
            </div>
            <FaqAccordion faqs={faqs} />
          </div>
        </section>

        <section className="py-20 lg:py-28 border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("retail.resourcesTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("retail.resourcesDescription")}
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
                {t("retail.ctaTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">{t("retail.ctaDescription")}</p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href={`/${locale}/products/mail-server`}>
                  <Button size="lg" className="gap-2 h-12 px-8 text-base">
                    {t("retail.ctaGetStarted")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href={`/${locale}/company/contact`}>
                  <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                    {t("retail.ctaContactSales")}
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