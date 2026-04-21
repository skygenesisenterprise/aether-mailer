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
  BookOpen,
  Terminal,
  Package,
  Plug,
  FileJson,
  GitBranch,
  Shield,
  Rocket,
} from "lucide-react";

export default async function DevelopersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Public" });

  const features = [
    {
      icon: Terminal,
      title: t("developers.featuresCliTitle"),
      description: t("developers.featuresCliDesc"),
    },
    {
      icon: Package,
      title: t("developers.featuresApiTitle"),
      description: t("developers.featuresApiDesc"),
    },
    {
      icon: Shield,
      title: t("developers.featuresSecurityTitle"),
      description: t("developers.featuresSecurityDesc"),
    },
    {
      icon: Plug,
      title: t("developers.featuresWebhooksTitle"),
      description: t("developers.featuresWebhooksDesc"),
    },
  ];

  const languages = [
    { name: "Go", icon: "go", color: "#00ADD8" },
    { name: "Python", icon: "python", color: "#3776AB" },
    { name: "JavaScript", icon: "js", color: "#F7DF1E" },
    { name: "TypeScript", icon: "ts", color: "#3178C6" },
    { name: "Rust", icon: "rust", color: "#CE422B" },
    { name: "Ruby", icon: "ruby", color: "#CC342D" },
  ];

  const sampleCode = [
    {
      language: "go",
      filename: "main.go",
      code: `package main

import (
    "log"
    "github.com/skygenesisenterprise/aether-mailer/pkg/client"
)

func main() {
    mailer, err := client.New(
        client.WithAPIKey("your-api-key"),
        client.WithRegion("eu-west-1"),
    )
    if err != nil {
        log.Fatal(err)
    }

    err = mailer.Send(&client.Email{
        From:    "noreply@yourdomain.com",
        To:      []string{"user@example.com"},
        Subject: "Welcome to Aether Mailer",
        Body:    "Hello, world!",
    })
    if err != nil {
        log.Fatal(err)
    }
}`,
    },
  ];

  const resources = [
    {
      icon: BookOpen,
      title: t("developers.docsTitle"),
      description: t("developers.docsDesc"),
      link: `/${locale}/developers/docs`,
    },
    {
      icon: Rocket,
      title: t("developers.quickstartsTitle"),
      description: t("developers.quickstartsDesc"),
      link: `/${locale}/developers/quickstarts`,
    },
    {
      icon: FileJson,
      title: t("developers.apiReferenceTitle"),
      description: t("developers.apiReferenceDesc"),
      link: `/${locale}/developers/api-reference`,
    },
    {
      icon: GitBranch,
      title: t("developers.sdkLibrariesTitle"),
      description: t("developers.sdkLibrariesDesc"),
      link: `/${locale}/developers/sdks`,
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
                {t("developers.badge")}
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground leading-tight text-balance">
                {t("developers.heroTitle")}
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
                {t("developers.heroDescription")}
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-start gap-4">
                <Link href={`/${locale}/developers/docs`}>
                  <Button size="lg" className="gap-2 h-12 px-6 text-base">
                    {t("developers.ctaDocs")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="https://github.com/skygenesisenterprise/aether-mailer">
                  <Button variant="outline" size="lg" className="gap-2 h-12 px-6 text-base">
                    <GitHubIcon className="h-4 w-4" />
                    {t("developers.ctaGithub")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Languages Section */}
        <section className="py-16 lg:py-20 border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-semibold text-foreground">
                {t("developers.languagesTitle")}
              </h2>
              <p className="mt-3 text-base text-muted-foreground">
                {t("developers.languagesDescription")}
              </p>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              {languages.map((lang) => (
                <div
                  key={lang.name}
                  className="flex flex-col items-center justify-center p-4 rounded-lg border border-border bg-card hover:border-foreground/20 transition-colors"
                >
                  <span className="text-2xl font-bold text-foreground mb-2">{lang.name}</span>
                  <span className="text-xs text-muted-foreground">{lang.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("developers.featuresTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("developers.featuresDescription")}
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
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
                  {t("developers.codeTitle")}
                </h2>
                <p className="mt-4 text-lg text-background/70 leading-relaxed">
                  {t("developers.codeDescription")}
                </p>
                <div className="mt-8">
                  <Link href={`/${locale}/developers/quickstarts`}>
                    <Button variant="secondary" size="lg" className="gap-2">
                      <Code2 className="h-4 w-4" />
                      {t("developers.codeCta")}
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="relative">
                <CodeBlock samples={sampleCode} defaultLanguage="go" />
              </div>
            </div>
          </div>
        </section>

        {/* Resources Section */}
        <section className="py-20 lg:py-28 border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("developers.resourcesTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("developers.resourcesDescription")}
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {resources.map((resource) => (
                <Link
                  key={resource.title}
                  href={resource.link}
                  className="p-6 rounded-lg border border-border bg-card hover:border-foreground/20 transition-colors"
                >
                  <resource.icon className="h-8 w-8 text-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">{resource.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {resource.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("developers.ctaTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">{t("developers.ctaDescription")}</p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href={`/${locale}/developers/quickstarts`}>
                  <Button size="lg" className="gap-2 h-12 px-8 text-base">
                    {t("developers.ctaGetStarted")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href={`/${locale}/company/contact`}>
                  <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                    {t("developers.ctaContactSales")}
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