import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/public/Header";
import { Footer } from "@/components/public/Footer";
import { Button } from "@/components/ui/button";
import { GitHubIcon } from "@/components/ui/icons/GitHubIcon";
import { FaqAccordion } from "@/components/public/FaqAccordion";
import { CodeBlock } from "@/components/public/CodeBlock";
import {
  Shield,
  Lock,
  Users,
  Key,
  Fingerprint,
  Zap,
  ArrowRight,
  Server,
  Globe,
  Code2,
  Building2,
  CheckCircle2,
  GitBranch,
  Database,
  Cloud,
  FileText,
  BookOpen,
  Calendar,
  BarChart3,
  X,
  Landmark,
  ShoppingCart,
  HeartPulse,
  Building,
  Mail,
  Archive,
  HardDrive,
} from "lucide-react";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Public" });

  const capabilities = [
    {
      icon: Mail,
      title: t("home.capabilitiesSmtp"),
      description: t("home.capabilitiesSmtpDesc"),
    },
    {
      icon: Database,
      title: t("home.capabilitiesImap"),
      description: t("home.capabilitiesImapDesc"),
    },
    {
      icon: Shield,
      title: t("home.capabilitiesSecurity"),
      description: t("home.capabilitiesSecurityDesc"),
    },
    {
      icon: Lock,
      title: t("home.capabilitiesSpam"),
      description: t("home.capabilitiesSpamDesc"),
    },
    {
      icon: Archive,
      title: t("home.capabilitiesArchiving"),
      description: t("home.capabilitiesArchivingDesc"),
    },
    {
      icon: Globe,
      title: t("home.capabilitiesMultiDomain"),
      description: t("home.capabilitiesMultiDomainDesc"),
    },
  ];

  const deploymentOptions = [
    {
      icon: HardDrive,
      title: t("home.deploymentOnPremise"),
      description: t("home.deploymentOnPremiseDesc"),
    },
    {
      icon: Cloud,
      title: t("home.deploymentCloud"),
      description: t("home.deploymentCloudDesc"),
    },
    {
      icon: GitBranch,
      title: t("home.deploymentHybrid"),
      description: t("home.deploymentHybridDesc"),
    },
  ];

  const industries = [
    {
      icon: HeartPulse,
      title: t("home.industriesHealthcare"),
      description: t("home.industriesHealthcareDesc"),
    },
    {
      icon: Landmark,
      title: t("home.industriesFinance"),
      description: t("home.industriesFinanceDesc"),
    },
    {
      icon: Building,
      title: t("home.industriesGovernment"),
      description: t("home.industriesGovernmentDesc"),
    },
    {
      icon: ShoppingCart,
      title: t("home.industriesEcommerce"),
      description: t("home.industriesEcommerceDesc"),
    },
  ];

  const faqs = [
    {
      question: t("home.faqMigrateTitle"),
      answer: t("home.faqMigrateAnswer"),
    },
    {
      question: t("home.faqOfflineTitle"),
      answer: t("home.faqOfflineAnswer"),
    },
    {
      question: t("home.faqFreeTitle"),
      answer: t("home.faqFreeAnswer"),
    },
    {
      question: t("home.faqUpdatesTitle"),
      answer: t("home.faqUpdatesAnswer"),
    },
  ];

  const resources = [
    {
      icon: FileText,
      title: t("home.resourcesWhitepaper"),
      description: t("home.resourcesWhitepaperDesc"),
    },
    {
      icon: BookOpen,
      title: t("home.resourcesEbook"),
      description: t("home.resourcesEbookDesc"),
    },
    {
      icon: Calendar,
      title: t("home.resourcesWebhook"),
      description: t("home.resourcesWebhookDesc"),
    },
    {
      icon: BarChart3,
      title: t("home.resourcesCaseStudy"),
      description: t("home.resourcesCaseStudyDesc"),
    },
  ];

  const sampleCode = [
    {
      language: "bash",
      filename: "install.sh",
      code: `# Install Aether Mailer
curl -sSL https://mailer.skygenesisenterprise.com/download | bash

# Start the server
mailer start

# Access the admin panel
open https://localhost:3000/login`,
    },
    {
      language: "yaml",
      filename: "config.yml",
      code: `server:
  hostname: mail.yourdomain.com
  port: 587
  tls: required

domains:
  - yourdomain.com
  - mail.yourdomain.com

security:
  dkim: true
  dmarc: true
  spf: true

storage:
  type: postgresql
  connection: postgres://user:pass@localhost/mailer`,
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
                {t("home.badge")}
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground leading-tight text-balance">
                {t("home.heroTitle")}
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
                {t("home.heroDescription")}
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-start gap-4">
                <Link href={`/${locale}/products/mail-server`}>
                  <Button size="lg" className="gap-2 h-12 px-6 text-base">
                    {t("home.ctaSelfHosted")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="https://github.com/skygenesisenterprise/aether-mailer">
                  <Button variant="outline" size="lg" className="gap-2 h-12 px-6 text-base">
                    <GitHubIcon className="h-4 w-4" />
                    {t("home.ctaGithub")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Core Capabilities */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("home.capabilitiesTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("home.capabilitiesDescription")}
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {capabilities.map((capability) => (
                <div key={capability.title} className="group">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-foreground/5 group-hover:bg-foreground/10 transition-colors">
                      <capability.icon className="h-5 w-5 text-foreground" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground">{capability.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed pl-13">
                    {capability.description}
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
                  <Link href={`/${locale}/developers/quickstarts`}>
                    <Button variant="secondary" size="lg" className="gap-2">
                      <Code2 className="h-4 w-4" />
                      {t("home.codeCta")}
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

        {/* Deployment Options */}
        <section className="py-20 lg:py-28 border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("home.deploymentTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("home.deploymentDescription")}
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {deploymentOptions.map((option) => (
                <div
                  key={option.title}
                  className="p-6 rounded-lg border border-border bg-card hover:border-foreground/20 transition-colors"
                >
                  <option.icon className="h-8 w-8 text-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">{option.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {option.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Industry Use Cases */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("home.industriesTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("home.industriesDescription")}
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
                {t("home.faqTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("home.faqDescription")}
              </p>
            </div>
            <FaqAccordion faqs={faqs} />
          </div>
        </section>

        {/* Resources Section */}
        <section className="py-20 lg:py-28 border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("home.resourcesTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("home.resourcesDescription")}
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

        {/* CTA Section */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("home.ctaTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">{t("home.ctaDescription")}</p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href={`/${locale}/products/mail-server`}>
                  <Button size="lg" className="gap-2 h-12 px-8 text-base">
                    {t("home.ctaGetStarted")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href={`/${locale}/company/contact`}>
                  <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                    {t("home.ctaContactSales")}
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