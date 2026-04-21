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
  Package,
  Globe,
  Server,
  Database,
  Cloud,
  Zap,
  BookOpen,
  Play,
  CheckCircle,
} from "lucide-react";

export default async function QuickstartsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Public" });

  const quickstarts = [
    {
      icon: Terminal,
      title: t("developers.quickstartsCliTitle"),
      description: t("developers.quickstartsCliDesc"),
      duration: t("developers.quickstartsCliDuration"),
      level: t("developers.quickstartsBeginner"),
    },
    {
      icon: Package,
      title: t("developers.quickstartsApiTitle"),
      description: t("developers.quickstartsApiDesc"),
      duration: t("developers.quickstartsApiDuration"),
      level: t("developers.quickstartsIntermediate"),
    },
    {
      icon: Globe,
      title: t("developers.quickstartsSmtpTitle"),
      description: t("developers.quickstartsSmtpDesc"),
      duration: t("developers.quickstartsSmtpDuration"),
      level: t("developers.quickstartsBeginner"),
    },
    {
      icon: Server,
      title: t("developers.quickstartsDockerTitle"),
      description: t("developers.quickstartsDockerDesc"),
      duration: t("developers.quickstartsDockerDuration"),
      level: t("developers.quickstartsIntermediate"),
    },
    {
      icon: Database,
      title: t("developers.quickstartsDbTitle"),
      description: t("developers.quickstartsDbDesc"),
      duration: t("developers.quickstartsDbDuration"),
      level: t("developers.quickstartsAdvanced"),
    },
    {
      icon: Cloud,
      title: t("developers.quickstartsCloudTitle"),
      description: t("developers.quickstartsCloudDesc"),
      duration: t("developers.quickstartsCloudDuration"),
      level: t("developers.quickstartsBeginner"),
    },
  ];

  const prerequisites = [
    t("developers.quickstartsPrereq1"),
    t("developers.quickstartsPrereq2"),
    t("developers.quickstartsPrereq3"),
  ];

  const sampleCode = [
    {
      language: "bash",
      filename: "install.sh",
      code: `# Install Aether Mailer CLI
curl -sSL https://mailer.skygenesisenterprise.com/download | bash

# Verify installation
mailer --version

# Initialize a new project
mailer init my-email-project

# Start the development server
cd my-email-project
mailer dev`,
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
                {t("developers.quickstartsBadge")}
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground leading-tight text-balance">
                {t("developers.quickstartsHeroTitle")}
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
                {t("developers.quickstartsHeroDescription")}
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-start gap-4">
                <Link href="#quickstarts">
                  <Button size="lg" className="gap-2 h-12 px-6 text-base">
                    {t("developers.quickstartsCta")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="https://github.com/skygenesisenterprise/aether-mailer">
                  <Button variant="outline" size="lg" className="gap-2 h-12 px-6 text-base">
                    <GitHubIcon className="h-4 w-4" />
                    {t("developers.quickstartsGithub")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Prerequisites Section */}
        <section className="py-16 lg:py-20 border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-12">
              <h2 className="text-2xl sm:text-3xl font-semibold text-foreground">
                {t("developers.quickstartsPrereqTitle")}
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {prerequisites.map((prereq, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-4 rounded-lg border border-border bg-card"
                >
                  <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5" />
                  <span className="text-sm text-foreground">{prereq}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Quickstarts List */}
        <section id="quickstarts" className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("developers.quickstartsListTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("developers.quickstartsListDescription")}
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quickstarts.map((quickstart) => (
                <div
                  key={quickstart.title}
                  className="group p-6 rounded-lg border border-border bg-card hover:border-foreground/20 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-foreground/5 group-hover:bg-foreground/10 transition-colors">
                      <quickstart.icon className="h-5 w-5 text-foreground" />
                    </div>
                    <span className="text-xs text-muted-foreground">{quickstart.duration}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{quickstart.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    {quickstart.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs px-2 py-1 rounded-full bg-foreground/5 text-foreground">
                      {quickstart.level}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
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
                  {t("developers.quickstartsCodeTitle")}
                </h2>
                <p className="mt-4 text-lg text-background/70 leading-relaxed">
                  {t("developers.quickstartsCodeDescription")}
                </p>
                <div className="mt-8">
                  <Link href="https://github.com/skygenesisenterprise/aether-mailer">
                    <Button variant="secondary" size="lg" className="gap-2">
                      <Play className="h-4 w-4" />
                      {t("developers.quickstartsCodeCta")}
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="relative">
                <CodeBlock samples={sampleCode} defaultLanguage="bash" />
              </div>
            </div>
          </div>
        </section>

        {/* Resources Section */}
        <section className="py-20 lg:py-28 border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("developers.quickstartsResourcesTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("developers.quickstartsResourcesDescription")}
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-6 rounded-lg border border-border bg-card hover:border-foreground/20 transition-colors">
                <BookOpen className="h-8 w-8 text-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t("developers.quickstartsDocsTitle")}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("developers.quickstartsDocsDesc")}
                </p>
              </div>
              <div className="p-6 rounded-lg border border-border bg-card hover:border-foreground/20 transition-colors">
                <Code2 className="h-8 w-8 text-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t("developers.quickstartsApiTitle")}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("developers.quickstartsApiRefDesc")}
                </p>
              </div>
              <div className="p-6 rounded-lg border border-border bg-card hover:border-foreground/20 transition-colors">
                <Zap className="h-8 w-8 text-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t("developers.quickstartsSupportTitle")}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("developers.quickstartsSupportDesc")}
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
                {t("developers.quickstartsCtaTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                {t("developers.quickstartsCtaDescription")}
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href={`/${locale}/developers/docs`}>
                  <Button size="lg" className="gap-2 h-12 px-8 text-base">
                    {t("developers.quickstartsCtaGetStarted")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href={`/${locale}/company/contact`}>
                  <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                    {t("developers.quickstartsCtaContact")}
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