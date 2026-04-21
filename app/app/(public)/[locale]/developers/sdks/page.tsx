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
  Globe,
  BookOpen,
  CheckCircle,
} from "lucide-react";

export default async function SDKsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Public" });

  const sdks = [
    {
      name: "Go",
      version: "v1.0.0",
      description: t("developers.sdksGoDesc"),
      status: t("developers.sdksStable"),
      downloads: "10K+",
      link: "https://github.com/skygenesisenterprise/aether-mailer-go",
    },
    {
      name: "Python",
      version: "v1.0.0",
      description: t("developers.sdksPythonDesc"),
      status: t("developers.sdksStable"),
      downloads: "25K+",
      link: "https://github.com/skygenesisenterprise/aether-mailer-python",
    },
    {
      name: "JavaScript",
      version: "v1.0.0",
      description: t("developers.sdksJsDesc"),
      status: t("developers.sdksStable"),
      downloads: "50K+",
      link: "https://github.com/skygenesisenterprise/aether-mailer-js",
    },
    {
      name: "TypeScript",
      version: "v1.0.0",
      description: t("developers.sdksTsDesc"),
      status: t("developers.sdksStable"),
      downloads: "50K+",
      link: "https://github.com/skygenesisenterprise/aether-mailer-ts",
    },
    {
      name: "Ruby",
      version: "v1.0.0",
      description: t("developers.sdksRubyDesc"),
      status: t("developers.sdksBeta"),
      downloads: "5K+",
      link: "https://github.com/skygenesisenterprise/aether-mailer-ruby",
    },
    {
      name: "Rust",
      version: "v0.9.0",
      description: t("developers.sdksRustDesc"),
      status: t("developers.sdksAlpha"),
      downloads: "2K+",
      link: "https://github.com/skygenesisenterprise/aether-mailer-rust",
    },
  ];

  const features = [
    t("developers.sdksFeature1"),
    t("developers.sdksFeature2"),
    t("developers.sdksFeature3"),
    t("developers.sdksFeature4"),
    t("developers.sdksFeature5"),
  ];

  const codeExamples = [
    {
      language: "go",
      filename: "main.go",
      code: `package main

import (
    "log"
    "github.com/skygenesisenterprise/aether-mailer-go/pkg/client"
)

func main() {
    mailer, err := client.New(
        client.WithAPIKey("your-api-key"),
    )
    if err != nil {
        log.Fatal(err)
    }

    err = mailer.Send(&client.Email{
        From:    "noreply@yourdomain.com",
        To:      []string{"user@example.com"},
        Subject: "Welcome",
        Body:    "Hello, World!",
    })
    if err != nil {
        log.Fatal(err)
    }

    log.Println("Email sent successfully!")
}`,
    },
    {
      language: "python",
      filename: "main.py",
      code: `from aether_mailer import Client

client = Client(api_key="your-api-key")

response = client.emails.send(
    from_="noreply@yourdomain.com",
    to=["user@example.com"],
    subject="Welcome",
    body="Hello, World!"
)

print(f"Email sent: {response.id}")`,
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
                {t("developers.sdksBadge")}
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground leading-tight text-balance">
                {t("developers.sdksHeroTitle")}
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
                {t("developers.sdksHeroDescription")}
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-start gap-4">
                <Link href="#sdks">
                  <Button size="lg" className="gap-2 h-12 px-6 text-base">
                    {t("developers.sdksCta")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="https://github.com/skygenesisenterprise/aether-mailer">
                  <Button variant="outline" size="lg" className="gap-2 h-12 px-6 text-base">
                    <GitHubIcon className="h-4 w-4" />
                    {t("developers.sdksGithub")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 lg:py-20 border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-12">
              <h2 className="text-2xl sm:text-3xl font-semibold text-foreground">
                {t("developers.sdksFeaturesTitle")}
              </h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-4 rounded-lg border border-border bg-card"
                >
                  <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5" />
                  <span className="text-sm text-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SDKs List */}
        <section id="sdks" className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("developers.sdksListTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("developers.sdksListDescription")}
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sdks.map((sdk) => (
                <div
                  key={sdk.name}
                  className="p-6 rounded-lg border border-border bg-card hover:border-foreground/20 transition-colors"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Globe className="h-6 w-6 text-foreground" />
                      <h3 className="text-lg font-semibold text-foreground">
                        {sdk.name}
                      </h3>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        sdk.status === t("developers.sdksStable")
                          ? "bg-emerald-500/10 text-emerald-500"
                          : sdk.status === t("developers.sdksBeta")
                          ? "bg-amber-500/10 text-amber-500"
                          : "bg-red-500/10 text-red-500"
                      }`}
                    >
                      {sdk.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    {sdk.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>v{sdk.version}</span>
                    <span>{sdk.downloads} downloads/month</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Code Examples */}
        <section className="py-20 lg:py-28 bg-foreground text-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-12">
              <h2 className="text-3xl sm:text-4xl font-semibold text-balance">
                {t("developers.sdksCodeTitle")}
              </h2>
              <p className="mt-4 text-lg text-background/70 leading-relaxed">
                {t("developers.sdksCodeDescription")}
              </p>
            </div>
            <CodeBlock samples={codeExamples} defaultLanguage="go" />
          </div>
        </section>

        {/* Installation Section */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("developers.sdksInstallTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("developers.sdksInstallDescription")}
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 rounded-lg border border-border bg-card">
                <h3 className="text-lg font-semibold text-foreground mb-4">Go</h3>
                <div className="p-3 rounded bg-muted font-mono text-sm">
                  <code className="text-foreground">
                    go get github.com/skygenesisenterprise/aether-mailer-go
                  </code>
                </div>
              </div>
              <div className="p-6 rounded-lg border border-border bg-card">
                <h3 className="text-lg font-semibold text-foreground mb-4">Python</h3>
                <div className="p-3 rounded bg-muted font-mono text-sm">
                  <code className="text-foreground">
                    pip install aether-mailer
                  </code>
                </div>
              </div>
              <div className="p-6 rounded-lg border border-border bg-card">
                <h3 className="text-lg font-semibold text-foreground mb-4">JavaScript</h3>
                <div className="p-3 rounded bg-muted font-mono text-sm">
                  <code className="text-foreground">
                    npm install aether-mailer
                  </code>
                </div>
              </div>
              <div className="p-6 rounded-lg border border-border bg-card">
                <h3 className="text-lg font-semibold text-foreground mb-4">Ruby</h3>
                <div className="p-3 rounded bg-muted font-mono text-sm">
                  <code className="text-foreground">
                    gem install aether-mailer
                  </code>
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
                {t("developers.sdksResourcesTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("developers.sdksResourcesDescription")}
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <Link
                href={`/${locale}/developers/api`}
                className="p-6 rounded-lg border border-border bg-card hover:border-foreground/20 transition-colors"
              >
                <BookOpen className="h-8 w-8 text-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t("developers.sdksDocsTitle")}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("developers.sdksDocsDesc")}
                </p>
              </Link>
              <Link
                href={`/${locale}/developers/quickstarts`}
                className="p-6 rounded-lg border border-border bg-card hover:border-foreground/20 transition-colors"
              >
                <Code2 className="h-8 w-8 text-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t("developers.sdksQuickstartsTitle")}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("developers.sdksQuickstartsDesc")}
                </p>
              </Link>
              <Link
                href="https://github.com/skygenesisenterprise/aether-mailer"
                className="p-6 rounded-lg border border-border bg-card hover:border-foreground/20 transition-colors"
              >
                <Terminal className="h-8 w-8 text-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t("developers.sdksGithubTitle")}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("developers.sdksGithubDesc")}
                </p>
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("developers.sdksCtaTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                {t("developers.sdksCtaDescription")}
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href={`/${locale}/developers/quickstarts`}>
                  <Button size="lg" className="gap-2 h-12 px-8 text-base">
                    {t("developers.sdksCtaGetStarted")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href={`/${locale}/company/contact`}>
                  <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                    {t("developers.sdksCtaContact")}
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