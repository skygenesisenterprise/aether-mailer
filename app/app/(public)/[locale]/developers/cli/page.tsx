import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/public/Header";
import { Footer } from "@/components/public/Footer";
import { Button } from "@/components/ui/button";
import { GitHubIcon } from "@/components/ui/icons/GitHubIcon";
import { CodeBlock } from "@/components/public/CodeBlock";
import {
  ArrowRight,
  Terminal,
  Package,
  Shield,
  BookOpen,
  Play,
  Zap,
} from "lucide-react";

export default async function CLIPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Public" });

  const commands = [
    {
      name: "mailer init",
      description: t("developers.cliInitDesc"),
      example: "mailer init my-project",
    },
    {
      name: "mailer start",
      description: t("developers.cliStartDesc"),
      example: "mailer start",
    },
    {
      name: "mailer stop",
      description: t("developers.cliStopDesc"),
      example: "mailer stop",
    },
    {
      name: "mailer status",
      description: t("developers.cliStatusDesc"),
      example: "mailer status",
    },
    {
      name: "mailer domain add",
      description: t("developers.cliDomainAddDesc"),
      example: "mailer domain add example.com",
    },
    {
      name: "mailer user create",
      description: t("developers.cliUserCreateDesc"),
      example: "mailer user create user@example.com",
    },
    {
      name: "mailer send",
      description: t("developers.cliSendDesc"),
      example: 'mailer send --to "user@example.com" --subject "Hello"',
    },
    {
      name: "mailer config",
      description: t("developers.cliConfigDesc"),
      example: "mailer config set smtp.port=587",
    },
  ];

  const codeExamples = [
    {
      language: "bash",
      filename: "install.sh",
      code: `# Install Aether Mailer CLI
curl -sSL https://mailer.skygenesisenterprise.com/install | sh

# Verify installation
mailer --version

# Initialize a new project
mailer init my-mailer

# Start the server
cd my-mailer
mailer start`,
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
                {t("developers.cliBadge")}
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground leading-tight text-balance">
                {t("developers.cliHeroTitle")}
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
                {t("developers.cliHeroDescription")}
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-start gap-4">
                <Link href="#commands">
                  <Button size="lg" className="gap-2 h-12 px-6 text-base">
                    {t("developers.cliCta")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="https://github.com/skygenesisenterprise/aether-mailer">
                  <Button variant="outline" size="lg" className="gap-2 h-12 px-6 text-base">
                    <GitHubIcon className="h-4 w-4" />
                    {t("developers.cliGithub")}
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
                {t("developers.cliFeaturesTitle")}
              </h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-4 rounded-lg border border-border bg-card">
                <Terminal className="h-6 w-6 text-foreground mb-3" />
                <h3 className="text-base font-semibold text-foreground mb-2">
                  {t("developers.cliFeature1")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("developers.cliFeature1Desc")}
                </p>
              </div>
              <div className="p-4 rounded-lg border border-border bg-card">
                <Zap className="h-6 w-6 text-foreground mb-3" />
                <h3 className="text-base font-semibold text-foreground mb-2">
                  {t("developers.cliFeature2")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("developers.cliFeature2Desc")}
                </p>
              </div>
              <div className="p-4 rounded-lg border border-border bg-card">
                <Shield className="h-6 w-6 text-foreground mb-3" />
                <h3 className="text-base font-semibold text-foreground mb-2">
                  {t("developers.cliFeature3")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("developers.cliFeature3Desc")}
                </p>
              </div>
              <div className="p-4 rounded-lg border border-border bg-card">
                <Package className="h-6 w-6 text-foreground mb-3" />
                <h3 className="text-base font-semibold text-foreground mb-2">
                  {t("developers.cliFeature4")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("developers.cliFeature4Desc")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Commands List */}
        <section id="commands" className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("developers.cliCommandsTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("developers.cliCommandsDescription")}
              </p>
            </div>
            <div className="space-y-4">
              {commands.map((cmd) => (
                <div
                  key={cmd.name}
                  className="p-4 rounded-lg border border-border bg-card"
                >
                  <div className="flex items-center gap-4">
                    <code className="text-sm font-mono font-bold text-foreground min-w-50">
                      {cmd.name}
                    </code>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">
                        {cmd.description}
                      </p>
                      <code className="text-xs text-muted-foreground mt-1 block">
                        {cmd.example}
                      </code>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Installation Section */}
        <section className="py-20 lg:py-28 bg-foreground text-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                <h2 className="text-3xl sm:text-4xl font-semibold text-balance">
                  {t("developers.cliInstallTitle")}
                </h2>
                <p className="mt-4 text-lg text-background/70 leading-relaxed">
                  {t("developers.cliInstallDescription")}
                </p>
                <div className="mt-8">
                  <Link href={`/${locale}/developers/quickstarts`}>
                    <Button variant="secondary" size="lg" className="gap-2">
                      <Play className="h-4 w-4" />
                      {t("developers.cliInstallCta")}
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="relative">
                <CodeBlock samples={codeExamples} defaultLanguage="bash" />
              </div>
            </div>
          </div>
        </section>

        {/* Resources Section */}
        <section className="py-20 lg:py-28 border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("developers.cliResourcesTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("developers.cliResourcesDescription")}
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <Link
                href={`/${locale}/developers/docs`}
                className="p-6 rounded-lg border border-border bg-card hover:border-foreground/20 transition-colors"
              >
                <BookOpen className="h-8 w-8 text-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t("developers.cliDocsTitle")}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("developers.cliDocsDesc")}
                </p>
              </Link>
              <Link
                href={`/${locale}/developers/api`}
                className="p-6 rounded-lg border border-border bg-card hover:border-foreground/20 transition-colors"
              >
                <Terminal className="h-8 w-8 text-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t("developers.cliApiTitle")}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("developers.cliApiDesc")}
                </p>
              </Link>
              <Link
                href={`/${locale}/developers/sdks`}
                className="p-6 rounded-lg border border-border bg-card hover:border-foreground/20 transition-colors"
              >
                <Package className="h-8 w-8 text-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t("developers.cliSdksTitle")}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("developers.cliSdksDesc")}
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
                {t("developers.cliCtaTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                {t("developers.cliCtaDescription")}
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href={`/${locale}/developers/quickstarts`}>
                  <Button size="lg" className="gap-2 h-12 px-8 text-base">
                    {t("developers.cliCtaGetStarted")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href={`/${locale}/company/contact`}>
                  <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                    {t("developers.cliCtaContact")}
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