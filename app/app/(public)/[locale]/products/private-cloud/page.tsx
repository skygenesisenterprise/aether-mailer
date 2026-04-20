import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/public/Header";
import { Footer } from "@/components/public/Footer";
import { Button } from "@/components/ui/button";
import { GitHubIcon } from "@/components/ui/icons/GitHubIcon";
import { FaqAccordion } from "@/components/public/FaqAccordion";
import {
  Server,
  Zap,
  Shield,
  ArrowRight,
  Cloud,
  Database,
  Globe,
  Users,
  Lock,
} from "lucide-react";

export default async function PrivateCloudPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Public" });

  const features = [
    {
      icon: Server,
      title: t("privateCloud.featureDedicated"),
      description: t("privateCloud.featureDedicatedDesc"),
    },
    {
      icon: Lock,
      title: t("privateCloud.featureControl"),
      description: t("privateCloud.featureControlDesc"),
    },
    {
      icon: Shield,
      title: t("privateCloud.featureCompliance"),
      description: t("privateCloud.featureComplianceDesc"),
    },
    {
      icon: Cloud,
      title: t("privateCloud.featureIntegration"),
      description: t("privateCloud.featureIntegrationDesc"),
    },
    {
      icon: Users,
      title: t("privateCloud.featureSupport"),
      description: t("privateCloud.featureSupportDesc"),
    },
    {
      icon: Zap,
      title: t("privateCloud.featureSla"),
      description: t("privateCloud.featureSlaDesc"),
    },
  ];

  const providers = [
    { name: t("privateCloud.providerAws"), color: "bg-orange-500" },
    { name: t("privateCloud.providerAzure"), color: "bg-blue-500" },
    { name: t("privateCloud.providerGcp"), color: "bg-green-500" },
    { name: t("privateCloud.providerOvh"), color: "bg-purple-500" },
    { name: t("privateCloud.providerCustom"), color: "bg-gray-500" },
  ];

  const configurations = [
    {
      icon: Zap,
      title: t("privateCloud.configScalability"),
      description: t("privateCloud.configScalabilityDesc"),
    },
    {
      icon: Database,
      title: t("privateCloud.configStorage"),
      description: t("privateCloud.configStorageDesc"),
    },
    {
      icon: Globe,
      title: t("privateCloud.configNetwork"),
      description: t("privateCloud.configNetworkDesc"),
    },
    {
      icon: Shield,
      title: t("privateCloud.configSecurity"),
      description: t("privateCloud.configSecurityDesc"),
    },
  ];

  const faqs = [
    {
      question: t("privateCloud.faqTimeTitle"),
      answer: t("privateCloud.faqTimeAnswer"),
    },
    {
      question: t("privateCloud.faqMigrateTitle"),
      answer: t("privateCloud.faqMigrateAnswer"),
    },
    {
      question: t("privateCloud.faqCostTitle"),
      answer: t("privateCloud.faqCostAnswer"),
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
                {t("privateCloud.badge")}
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground leading-tight text-balance">
                {t("privateCloud.heroTitle")}
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
                {t("privateCloud.heroDescription")}
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-start gap-4">
                <Link href={`/${locale}/company/contact`}>
                  <Button size="lg" className="gap-2 h-12 px-6 text-base">
                    {t("privateCloud.ctaGetStarted")}
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
                {t("privateCloud.featuresTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("privateCloud.featuresDescription")}
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

        {/* Providers Section */}
        <section className="py-20 lg:py-28 border-b border-border bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("privateCloud.providersTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("privateCloud.providersDescription")}
              </p>
            </div>
            <div className="grid md:grid-cols-5 gap-4">
              {providers.map((provider) => (
                <div
                  key={provider.name}
                  className="p-4 rounded-lg border border-border bg-card text-center"
                >
                  <Globe className="h-8 w-8 text-foreground mx-auto mb-2" />
                  <span className="text-sm font-medium text-foreground">{provider.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Configuration Section */}
        <section className="py-20 lg:py-28 border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("privateCloud.configTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("privateCloud.configDescription")}
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {configurations.map((config) => (
                <div
                  key={config.title}
                  className="p-6 rounded-lg border border-border bg-card"
                >
                  <config.icon className="h-8 w-8 text-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">{config.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {config.description}
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
                {t("privateCloud.faqTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("privateCloud.faqDescription")}
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
                {t("privateCloud.ctaTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">{t("privateCloud.ctaDescription")}</p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href={`/${locale}/company/contact`}>
                  <Button size="lg" className="gap-2 h-12 px-8 text-base">
                    {t("privateCloud.ctaGetQuote")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href={`/${locale}/company/contact`}>
                  <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                    {t("privateCloud.ctaContactSales")}
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