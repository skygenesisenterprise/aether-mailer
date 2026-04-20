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
} from "lucide-react";

export default async function EmailApiPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Public" });

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

        {/* Features Section */}
        <section className="py-20 lg:py-28">
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

        {/* Endpoints Section */}
        <section className="py-20 lg:py-28 border-b border-border">
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
        <section className="py-20 lg:py-28 border-b border-border">
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