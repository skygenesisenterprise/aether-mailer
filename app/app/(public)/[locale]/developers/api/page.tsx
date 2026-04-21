import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/public/Header";
import { Footer } from "@/components/public/Footer";
import { Button } from "@/components/ui/button";
import { GitHubIcon } from "@/components/ui/icons/GitHubIcon";
import { CodeBlock } from "@/components/public/CodeBlock";
import {
  ArrowRight,
  Code2,
  Terminal,
  CheckCircle,
  AlertCircle,
  BookOpen,
} from "lucide-react";

export default async function ApiPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Public" });

  const endpoints = [
    {
      method: "POST",
      path: "/v1/emails/send",
      title: t("developers.apiSendEmail"),
      description: t("developers.apiSendEmailDesc"),
    },
    {
      method: "GET",
      path: "/v1/emails",
      title: t("developers.apiListEmails"),
      description: t("developers.apiListEmailsDesc"),
    },
    {
      method: "GET",
      path: "/v1/emails/:id",
      title: t("developers.apiGetEmail"),
      description: t("developers.apiGetEmailDesc"),
    },
    {
      method: "POST",
      path: "/v1/domains",
      title: t("developers.apiCreateDomain"),
      description: t("developers.apiCreateDomainDesc"),
    },
    {
      method: "GET",
      path: "/v1/domains",
      title: t("developers.apiListDomains"),
      description: t("developers.apiListDomainsDesc"),
    },
    {
      method: "POST",
      path: "/v1/webhooks",
      title: t("developers.apiCreateWebhook"),
      description: t("developers.apiCreateWebhookDesc"),
    },
  ];

  const codeExamples = [
    {
      language: "bash",
      filename: "curl",
      code: `# Send an email
curl -X POST https://mailer.skygenesisenterprise.com/api/v1/emails/send \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "from": "noreply@yourdomain.com",
    "to": ["user@example.com"],
    "subject": "Hello World",
    "body": "This is a test email"
  }'`,
    },
    {
      language: "javascript",
      filename: "fetch.js",
      code: `const response = await fetch('https://mailer.skygenesisenterprise.com/api/v1/emails/send', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    from: 'noreply@yourdomain.com',
    to: ['user@example.com'],
    subject: 'Hello World',
    body: 'This is a test email'
  })
});

const data = await response.json();
console.log(data);`,
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
                {t("developers.apiBadge")}
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground leading-tight text-balance">
                {t("developers.apiHeroTitle")}
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
                {t("developers.apiHeroDescription")}
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-start gap-4">
                <Link href="#endpoints">
                  <Button size="lg" className="gap-2 h-12 px-6 text-base">
                    {t("developers.apiCta")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="https://github.com/skygenesisenterprise/aether-mailer">
                  <Button variant="outline" size="lg" className="gap-2 h-12 px-6 text-base">
                    <GitHubIcon className="h-4 w-4" />
                    {t("developers.apiGithub")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Base URL Section */}
        <section className="py-16 lg:py-20 border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mb-6">
                {t("developers.apiBaseTitle")}
              </h2>
              <div className="p-4 rounded-lg bg-muted font-mono text-sm">
                <code className="text-foreground">https://mailer.skygenesisenterprise.com/api/v1</code>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                {t("developers.apiBaseDescription")}
              </p>
            </div>
          </div>
        </section>

        {/* Authentication Section */}
        <section className="py-16 lg:py-20 border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-8">
              <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mb-4">
                {t("developers.apiAuthTitle")}
              </h2>
              <p className="text-base text-muted-foreground">
                {t("developers.apiAuthDescription")}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted font-mono text-sm">
              <code className="text-foreground">
                Authorization: Bearer YOUR_API_KEY
              </code>
            </div>
          </div>
        </section>

        {/* Endpoints Section */}
        <section id="endpoints" className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("developers.apiEndpointsTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("developers.apiEndpointsDescription")}
              </p>
            </div>
            <div className="space-y-4">
              {endpoints.map((endpoint) => (
                <div
                  key={`${endpoint.method}-${endpoint.path}`}
                  className="p-6 rounded-lg border border-border bg-card"
                >
                  <div className="flex items-center gap-4 mb-3">
                    <span
                      className={`px-2 py-1 text-xs font-bold rounded ${
                        endpoint.method === "POST"
                          ? "bg-emerald-500/10 text-emerald-500"
                          : endpoint.method === "GET"
                          ? "bg-blue-500/10 text-blue-500"
                          : endpoint.method === "PUT"
                          ? "bg-amber-500/10 text-amber-500"
                          : "bg-red-500/10 text-red-500"
                      }`}
                    >
                      {endpoint.method}
                    </span>
                    <code className="text-sm font-mono text-foreground">
                      {endpoint.path}
                    </code>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {endpoint.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {endpoint.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Code Example Section */}
        <section className="py-20 lg:py-28 bg-foreground text-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-12">
              <h2 className="text-3xl sm:text-4xl font-semibold text-balance">
                {t("developers.apiCodeTitle")}
              </h2>
              <p className="mt-4 text-lg text-background/70 leading-relaxed">
                {t("developers.apiCodeDescription")}
              </p>
            </div>
            <CodeBlock samples={codeExamples} defaultLanguage="bash" />
          </div>
        </section>

        {/* Response Codes Section */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("developers.apiResponseTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("developers.apiResponseDescription")}
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-card">
                <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5" />
                <div>
                  <code className="text-sm font-bold text-foreground">200 OK</code>
                  <p className="text-sm text-muted-foreground">
                    {t("developers.apiResponse200")}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-card">
                <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5" />
                <div>
                  <code className="text-sm font-bold text-foreground">201 Created</code>
                  <p className="text-sm text-muted-foreground">
                    {t("developers.apiResponse201")}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-card">
                <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                <div>
                  <code className="text-sm font-bold text-foreground">400 Bad Request</code>
                  <p className="text-sm text-muted-foreground">
                    {t("developers.apiResponse400")}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-card">
                <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                <div>
                  <code className="text-sm font-bold text-foreground">401 Unauthorized</code>
                  <p className="text-sm text-muted-foreground">
                    {t("developers.apiResponse401")}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-card">
                <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                <div>
                  <code className="text-sm font-bold text-foreground">404 Not Found</code>
                  <p className="text-sm text-muted-foreground">
                    {t("developers.apiResponse404")}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-card">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <code className="text-sm font-bold text-foreground">500 Server Error</code>
                  <p className="text-sm text-muted-foreground">
                    {t("developers.apiResponse500")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Rate Limiting Section */}
        <section className="py-20 lg:py-28 border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("developers.apiRateLimitTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("developers.apiRateLimitDescription")}
              </p>
            </div>
            <div className="p-6 rounded-lg border border-border bg-card">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-foreground">1000</div>
                  <div className="text-sm text-muted-foreground">
                    {t("developers.apiRateLimitRequests")}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-foreground">60</div>
                  <div className="text-sm text-muted-foreground">
                    {t("developers.apiRateLimitWindow")}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-foreground">X-RateLimit-*</div>
                  <div className="text-sm text-muted-foreground">
                    {t("developers.apiRateLimitHeaders")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Resources Section */}
        <section className="py-20 lg:py-28 border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("developers.apiResourcesTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("developers.apiResourcesDescription")}
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-6 rounded-lg border border-border bg-card hover:border-foreground/20 transition-colors">
                <BookOpen className="h-8 w-8 text-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t("developers.apiDocsTitle")}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("developers.apiDocsDesc")}
                </p>
              </div>
              <div className="p-6 rounded-lg border border-border bg-card hover:border-foreground/20 transition-colors">
                <Terminal className="h-8 w-8 text-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t("developers.apiSdksTitle")}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("developers.apiSdksDesc")}
                </p>
              </div>
              <div className="p-6 rounded-lg border border-border bg-card hover:border-foreground/20 transition-colors">
                <Code2 className="h-8 w-8 text-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t("developers.apiExamplesTitle")}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("developers.apiExamplesDesc")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("developers.apiCtaTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                {t("developers.apiCtaDescription")}
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href={`/${locale}/developers/quickstarts`}>
                  <Button size="lg" className="gap-2 h-12 px-8 text-base">
                    {t("developers.apiCtaGetStarted")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href={`/${locale}/company/contact`}>
                  <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                    {t("developers.apiCtaContact")}
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