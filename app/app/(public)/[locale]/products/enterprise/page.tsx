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
  Zap,
  ArrowRight,
  Server,
  Users,
  Globe,
  CheckCircle2,
  Building2,
  Landmark,
  HeartPulse,
  Phone,
  BarChart3,
  Database,
  Clock,
  Mail,
} from "lucide-react";

export default async function EnterprisePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Public" });

  const features = [
    {
      icon: Globe,
      title: t("enterprise.featureMultiDomain"),
      description: t("enterprise.featureMultiDomainDesc"),
    },
    {
      icon: Server,
      title: t("enterprise.featureHighAvailability"),
      description: t("enterprise.featureHighAvailabilityDesc"),
    },
    {
      icon: Users,
      title: t("enterprise.featureDedicatedSupport"),
      description: t("enterprise.featureDedicatedSupportDesc"),
    },
    {
      icon: Shield,
      title: t("enterprise.featureCompliance"),
      description: t("enterprise.featureComplianceDesc"),
    },
    {
      icon: CheckCircle2,
      title: t("enterprise.featureSla"),
      description: t("enterprise.featureSlaDesc"),
    },
    {
      icon: Zap,
      title: t("enterprise.featureCustom"),
      description: t("enterprise.featureCustomDesc"),
    },
  ];

  const scaling = [
    {
      icon: Mail,
      statistic: "10M+",
      label: t("enterprise.scalingMillions"),
    },
    {
      icon: Globe,
      statistic: "1,000+",
      label: t("enterprise.scalingDomains"),
    },
    {
      icon: Users,
      statistic: "100k+",
      label: t("enterprise.scalingUsers"),
    },
    {
      icon: Database,
      statistic: "100TB+",
      label: t("enterprise.scalingStorage"),
    },
  ];

  const industries = [
    {
      icon: Landmark,
      title: t("enterprise.industriesFinance"),
      description: t("enterprise.industriesFinanceDesc"),
    },
    {
      icon: HeartPulse,
      title: t("enterprise.industriesHealthcare"),
      description: t("enterprise.industriesHealthcareDesc"),
    },
    {
      icon: Building2,
      title: t("enterprise.industriesGovernment"),
      description: t("enterprise.industriesGovernmentDesc"),
    },
    {
      icon: Phone,
      title: t("enterprise.industriesTelecom"),
      description: t("enterprise.industriesTelecomDesc"),
    },
  ];

  const faqs = [
    {
      question: t("enterprise.faqSlaTitle"),
      answer: t("enterprise.faqSlaAnswer"),
    },
    {
      question: t("enterprise.faqMigrationTitle"),
      answer: t("enterprise.faqMigrationAnswer"),
    },
    {
      question: t("enterprise.faqSupportTitle"),
      answer: t("enterprise.faqSupportAnswer"),
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
                {t("enterprise.badge")}
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground leading-tight text-balance">
                {t("enterprise.heroTitle")}
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
                {t("enterprise.heroDescription")}
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-start gap-4">
                <Link href={`/${locale}/company/contact`}>
                  <Button size="lg" className="gap-2 h-12 px-6 text-base">
                    {t("enterprise.ctaGetStarted")}
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
                {t("enterprise.featuresTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("enterprise.featuresDescription")}
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

        {/* Scaling Section */}
        <section className="py-20 lg:py-28 border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("enterprise.scalingTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("enterprise.scalingDescription")}
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {scaling.map((item) => (
                <div
                  key={item.label}
                  className="p-6 rounded-lg border border-border bg-card text-center"
                >
                  <BarChart3 className="h-8 w-8 text-foreground mx-auto mb-4" />
                  <p className="text-3xl font-bold text-foreground mb-2">{item.statistic}</p>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Industries Section */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("enterprise.industriesTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("enterprise.industriesDescription")}
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {industries.map((industry) => (
                <div
                  key={industry.title}
                  className="p-6 rounded-lg border border-border bg-card hover:border-foreground/20 transition-colors"
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
                {t("enterprise.faqTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("enterprise.faqDescription")}
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
                {t("enterprise.ctaTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">{t("enterprise.ctaDescription")}</p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href={`/${locale}/company/contact`}>
                  <Button size="lg" className="gap-2 h-12 px-8 text-base">
                    {t("enterprise.ctaContactSales")}
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