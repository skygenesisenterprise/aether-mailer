import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/public/Header";
import { Footer } from "@/components/public/Footer";
import { Button } from "@/components/ui/button";
import { GitHubIcon } from "@/components/ui/icons/GitHubIcon";
import { FaqAccordion } from "@/components/public/FaqAccordion";
import { CodeBlock } from "@/components/public/CodeBlock";
import {
  Code,
  ArrowRight,
  Globe,
  Server,
  Database,
  Boxes,
  FileText,
  Zap,
  Clock,
  Shield,
  Mail,
  Megaphone,
  Bell,
  Users,
  CheckCircle2,
  CreditCard,
} from "lucide-react";

export default async function EmailApiPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Public" });

  const stats = [
    { value: "2M+", label: t("emailApi.statsDelivered"), icon: Mail },
    { value: "<200ms", label: t("emailApi.statsLatency"), icon: Zap },
    { value: "99.99%", label: t("emailApi.statsUptime"), icon: Clock },
    { value: "99.9%", label: t("emailApi.statsSLA"), icon: Shield },
  ];

  const useCases = [
    {
      icon: CreditCard,
      title: t("emailApi.useCaseTransactional"),
      description: t("emailApi.useCaseTransactionalDesc"),
    },
    {
      icon: Megaphone,
      title: t("emailApi.useCaseMarketing"),
      description: t("emailApi.useCaseMarketingDesc"),
    },
    {
      icon: Bell,
      title: t("emailApi.useCaseNotifications"),
      description: t("emailApi.useCaseNotificationsDesc"),
    },
    {
      icon: Users,
      title: t("emailApi.useCaseOnboarding"),
      description: t("emailApi.useCaseOnboardingDesc"),
    },
  ];

  const features = [
    {
      icon: Code,
      title: t("emailApi.featureRest"),
      description: t("emailApi.featureRestDesc"),
    },
    {
      icon: Boxes,
      title: t("emailApi.featureSdk"),
      description: t("emailApi.featureSdkDesc"),
    },
    {
      icon: Server,
      title: t("emailApi.featureWebhooks"),
      description: t("emailApi.featureWebhooksDesc"),
    },
    {
      icon: FileText,
      title: t("emailApi.featureTemplates"),
      description: t("emailApi.featureTemplatesDesc"),
    },
    {
      icon: Globe,
      title: t("emailApi.featureTracking"),
      description: t("emailApi.featureTrackingDesc"),
    },
    {
      icon: Database,
      title: t("emailApi.featureBatch"),
      description: t("emailApi.featureBatchDesc"),
    },
  ];

  const comparison = [
    {
      feature: t("emailApi.comparisonPrice"),
      aether: t("emailApi.comparisonPriceAether"),
      other: t("emailApi.comparisonPriceOther"),
    },
    {
      feature: t("emailApi.comparisonFree"),
      aether: t("emailApi.comparisonFreeAether"),
      other: t("emailApi.comparisonFreeOther"),
    },
    {
      feature: t("emailApi.comparisonSupport"),
      aether: t("emailApi.comparisonSupportAether"),
      other: t("emailApi.comparisonSupportOther"),
    },
    {
      feature: t("emailApi.comparisonSetup"),
      aether: t("emailApi.comparisonSetupAether"),
      other: t("emailApi.comparisonSetupOther"),
    },
    {
      feature: t("emailApi.comparisonApi"),
      aether: t("emailApi.comparisonApiAether"),
      other: t("emailApi.comparisonApiOther"),
    },
  ];

  const endpoints = [
    {
      method: "POST",
      path: "/emails",
      description: t("emailApi.endpointSendDesc"),
    },
    {
      method: "GET",
      path: "/emails",
      description: t("emailApi.endpointListDesc"),
    },
    {
      method: "GET",
      path: "/templates",
      description: t("emailApi.endpointTemplatesDesc"),
    },
    {
      method: "POST",
      path: "/webhooks",
      description: t("emailApi.endpointWebhooksDesc"),
    },
  ];

  const sdks = [
    { name: t("emailApi.sdkNode"), color: "bg-green-500" },
    { name: t("emailApi.sdkPython"), color: "bg-blue-500" },
    { name: t("emailApi.sdkGo"), color: "bg-cyan-500" },
    { name: t("emailApi.sdkJava"), color: "bg-red-500" },
    { name: t("emailApi.sdkRuby"), color: "bg-red-700" },
    { name: t("emailApi.sdkPhp"), color: "bg-purple-500" },
  ];

  const pricingTiers = [
    {
      name: t("emailApi.pricingFree"),
      price: "0€",
      description: t("emailApi.pricingFreeDesc"),
      popular: false,
    },
    {
      name: t("emailApi.pricingStarter"),
      price: t("emailApi.pricingStarterPrice"),
      description: t("emailApi.pricingStarterDesc"),
      popular: false,
    },
    {
      name: t("emailApi.pricingPro"),
      price: t("emailApi.pricingProPrice"),
      description: t("emailApi.pricingProDesc"),
      popular: true,
    },
    {
      name: t("emailApi.pricingEnterprise"),
      price: t("emailApi.pricingEnterprisePrice"),
      description: t("emailApi.pricingEnterpriseDesc"),
      popular: false,
    },
  ];

  const faqs = [
    {
      question: t("emailApi.faqRateTitle"),
      answer: t("emailApi.faqRateAnswer"),
    },
    {
      question: t("emailApi.faqSslTitle"),
      answer: t("emailApi.faqSslAnswer"),
    },
    {
      question: t("emailApi.faqFormatTitle"),
      answer: t("emailApi.faqFormatAnswer"),
    },
    {
      question: t("emailApi.faqKeyTitle"),
      answer: t("emailApi.faqKeyAnswer"),
    },
    {
      question: t("emailApi.faqTestTitle"),
      answer: t("emailApi.faqTestAnswer"),
    },
    {
      question: t("emailApi.faqBounceTitle"),
      answer: t("emailApi.faqBounceAnswer"),
    },
    {
      question: t("emailApi.faqSpamTitle"),
      answer: t("emailApi.faqSpamAnswer"),
    },
  ];

  const sampleCode = [
    {
      language: "javascript",
      filename: "send-email.js",
      code: `import { AetherMailer } from '@aether-mailer/node';

const mailer = new AetherMailer({
  apiKey: process.env.AETHER_API_KEY,
});

await mailer.emails.send({
  to: 'user@example.com',
  subject: 'Welcome!',
  html: '<h1>Hello World</h1>',
  from: 'noreply@yourdomain.com',
});`,
    },
    {
      language: "python",
      filename: "send-email.py",
      code: `from aether_mailer import AetherMailer

mailer = AetherMailer(api_key="your-api-key")

mailer.emails.send(
    to="user@example.com",
    subject="Welcome!",
    html="<h1>Hello World</h1>",
    from="noreply@yourdomain.com"
)`,
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
                {t("emailApi.badge")}
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground leading-tight text-balance">
                {t("emailApi.heroTitle")}
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
                {t("emailApi.heroDescription")}
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-start gap-4">
                <Link href="/developers/api">
                  <Button size="lg" className="gap-2 h-12 px-6 text-base">
                    {t("emailApi.ctaGetStarted")}
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

        {/* Stats Section */}
        <section className="py-16 border-b border-border bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <stat.icon className="h-5 w-5 text-emerald-500" />
                    <span className="text-3xl sm:text-4xl font-bold text-foreground">{stat.value}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Use Cases Section */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("emailApi.useCasesTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("emailApi.useCasesDescription")}
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {useCases.map((useCase) => (
                <div key={useCase.title} className="bg-card p-6 rounded-lg border border-border">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-emerald-500/10 mb-4">
                    <useCase.icon className="h-6 w-6 text-emerald-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{useCase.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{useCase.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 lg:py-28 border-b border-border bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("emailApi.featuresTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("emailApi.featuresDescription")}
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

        {/* Code Example Section */}
        <section className="py-20 lg:py-28 bg-foreground text-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                <h2 className="text-3xl sm:text-4xl font-semibold text-balance">
                  {t("home.codeTitle")}
                </h2>
                <p className="mt-4 text-lg text-background/70 leading-relaxed">
                  {t("home.codeDescription")}
                </p>
                <div className="mt-8">
                  <Link href="/developers/api">
                    <Button variant="secondary" size="lg" className="gap-2">
                      {t("home.codeCta")}
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="relative">
                <CodeBlock samples={sampleCode} defaultLanguage="javascript" />
              </div>
            </div>
          </div>
        </section>

        {/* Comparison Section */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("emailApi.comparisonTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("emailApi.comparisonDescription")}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-4 px-6 text-muted-foreground font-medium">{t("emailApi.comparisonFeature")}</th>
                    <th className="text-center py-4 px-6 text-foreground font-semibold">{t("emailApi.comparisonAether")}</th>
                    <th className="text-center py-4 px-6 text-muted-foreground font-medium">SendGrid / Mailgun</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.map((row) => (
                    <tr key={row.feature} className="border-b border-border">
                      <td className="py-4 px-6 text-foreground">{row.feature}</td>
                      <td className="py-4 px-6 text-center text-emerald-500 font-medium">{row.aether}</td>
                      <td className="py-4 px-6 text-center text-muted-foreground">{row.other}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Endpoints Section */}
        <section className="py-20 lg:py-28 border-b border-border bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("emailApi.endpointsTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("emailApi.endpointsDescription")}
              </p>
            </div>
            <div className="space-y-4">
              {endpoints.map((endpoint) => (
                <div
                  key={`${endpoint.method}-${endpoint.path}`}
                  className="p-4 rounded-lg border border-border bg-card flex items-center gap-4"
                >
                  <span className="px-3 py-1 text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-600 rounded">
                    {endpoint.method}
                  </span>
                  <code className="text-sm font-mono text-foreground">{endpoint.path}</code>
                  <span className="text-sm text-muted-foreground">{endpoint.description}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SDKs Section */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("emailApi.sdksTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("emailApi.sdksDescription")}
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {sdks.map((sdk) => (
                <div
                  key={sdk.name}
                  className="p-4 rounded-lg border border-border bg-card text-center"
                >
                  <Code className="h-8 w-8 text-foreground mx-auto mb-2" />
                  <span className="text-sm font-medium text-foreground">{sdk.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-20 lg:py-28 border-b border-border bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("emailApi.pricingTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("emailApi.pricingDescription")}
              </p>
            </div>
            <div className="grid md:grid-cols-4 gap-8">
              {pricingTiers.map((tier) => (
                <div
                  key={tier.name}
                  className={`p-6 rounded-lg border ${
                    tier.popular
                      ? "border-emerald-500 bg-emerald-500/5"
                      : "border-border bg-card"
                  }`}
                >
                  {tier.popular && (
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-emerald-500 text-white rounded-full mb-4">
                      Populaire
                    </span>
                  )}
                  <h3 className="text-lg font-semibold text-foreground mb-2">{tier.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{tier.description}</p>
                  <div className="text-3xl font-semibold text-foreground mb-6">{tier.price}</div>
                  <Link href={`/${locale}/company/contact`} className="block">
                    <Button
                      variant={tier.popular ? "default" : "outline"}
                      className="w-full"
                    >
                      {t("emailApi.ctaGetDocs")}
                    </Button>
                  </Link>
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
                {t("emailApi.faqTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("emailApi.faqDescription")}
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
                {t("emailApi.ctaTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">{t("emailApi.ctaDescription")}</p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/developers/api">
                  <Button size="lg" className="gap-2 h-12 px-8 text-base">
                    {t("emailApi.ctaGetDocs")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href={`/${locale}/company/contact`}>
                  <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                    {t("emailApi.ctaContactSales")}
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