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
  Zap,
  ArrowRight,
  Server,
  Code2,
  CheckCircle2,
  Database,
  Clock,
  Users,
  Mail,
  Archive,
  Globe,
} from "lucide-react";

export default async function MailServerPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Public" });

  const features = [
    {
      icon: Mail,
      title: t("mailServer.featureSmtp"),
      description: t("mailServer.featureSmtpDesc"),
    },
    {
      icon: Database,
      title: t("mailServer.featureImap"),
      description: t("mailServer.featureImapDesc"),
    },
    {
      icon: Shield,
      title: t("mailServer.featureSecurity"),
      description: t("mailServer.featureSecurityDesc"),
    },
    {
      icon: Lock,
      title: t("mailServer.featureSpam"),
      description: t("mailServer.featureSpamDesc"),
    },
    {
      icon: Archive,
      title: t("mailServer.featureArchiving"),
      description: t("mailServer.featureArchivingDesc"),
    },
    {
      icon: Globe,
      title: t("mailServer.featureMultiDomain"),
      description: t("mailServer.featureMultiDomainDesc"),
    },
  ];

  const techSpecs = [
    {
      icon: Zap,
      title: t("mailServer.scalabilityTitle"),
      description: t("mailServer.scalabilityDesc"),
    },
    {
      icon: Clock,
      title: t("mailServer.performanceTitle"),
      description: t("mailServer.performanceDesc"),
    },
    {
      icon: Server,
      title: t("mailServer.reliabilityTitle"),
      description: t("mailServer.reliabilityDesc"),
    },
    {
      icon: Users,
      title: t("mailServer.supportTitle"),
      description: t("mailServer.supportDesc"),
    },
  ];

  const pricingPlans = [
    {
      name: t("mailServer.pricingCommunity"),
      description: t("mailServer.pricingCommunityDesc"),
      price: t("mailServer.pricingCommunityPrice"),
      features: [
        "Serveur SMTP/IMAP complet",
        "1 domaine",
        "100 boîtes email",
        "Support communautaire",
        "Mise à jour de sécurité",
      ],
      cta: t("mailServer.ctaGetStarted"),
      popular: false,
    },
    {
      name: t("mailServer.pricingPro"),
      description: t("mailServer.pricingProDesc"),
      price: t("mailServer.pricingProPrice"),
      features: [
        "Tout dans Community",
        "Domaines illimités",
        "Boites email illimitées",
        "Support prioritaire",
        "Archivage email",
        "APIREST complète",
      ],
      cta: t("mailServer.ctaContactSales"),
      popular: true,
    },
    {
      name: t("mailServer.pricingEnterprise"),
      description: t("mailServer.pricingEnterpriseDesc"),
      price: t("mailServer.pricingEnterprisePrice"),
      features: [
        "Tout dans Professionnel",
        "Infrastructure dédiée",
        "Support 24/7",
        "SLA garanti",
        "Formation offerte",
        "Intégration sur mesure",
      ],
      cta: t("mailServer.ctaContactSales"),
      popular: false,
    },
  ];

  const faqs = [
    {
      question: t("mailServer.faqMigrateTitle"),
      answer: t("mailServer.faqMigrateAnswer"),
    },
    {
      question: t("mailServer.faqOfflineTitle"),
      answer: t("mailServer.faqOfflineAnswer"),
    },
    {
      question: t("mailServer.faqFreeTitle"),
      answer: t("mailServer.faqFreeAnswer"),
    },
    {
      question: t("mailServer.faqUpdatesTitle"),
      answer: t("mailServer.faqUpdatesAnswer"),
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
                {t("mailServer.badge")}
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground leading-tight text-balance">
                {t("mailServer.heroTitle")}
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
                {t("mailServer.heroDescription")}
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-start gap-4">
                <Link href="https://github.com/skygenesisenterprise/aether-mailer">
                  <Button size="lg" className="gap-2 h-12 px-6 text-base">
                    {t("mailServer.ctaSelfHosted")}
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
                {t("mailServer.featuresTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("mailServer.featuresDescription")}
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

        {/* Technical Specs */}
        <section className="py-20 lg:py-28 border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("mailServer.techspecsTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("mailServer.techspecsDescription")}
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {techSpecs.map((spec) => (
                <div
                  key={spec.title}
                  className="p-6 rounded-lg border border-border bg-card"
                >
                  <spec.icon className="h-8 w-8 text-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">{spec.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {spec.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-20 lg:py-28 border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("mailServer.pricingTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("mailServer.pricingDescription")}
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {pricingPlans.map((plan) => (
                <div
                  key={plan.name}
                  className={`p-6 rounded-lg border ${
                    plan.popular
                      ? "border-emerald-500 bg-emerald-500/5"
                      : "border-border bg-card"
                  }`}
                >
                  {plan.popular && (
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-emerald-500 text-white rounded-full mb-4">
                      Populaire
                    </span>
                  )}
                  <h3 className="text-lg font-semibold text-foreground mb-2">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                  <div className="text-3xl font-semibold text-foreground mb-6">{plan.price}</div>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href={`/${locale}/company/contact`} className="block">
                    <Button
                      variant={plan.popular ? "default" : "outline"}
                      className="w-full"
                    >
                      {plan.cta}
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
                {t("mailServer.faqTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("mailServer.faqDescription")}
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
                {t("mailServer.ctaTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">{t("mailServer.ctaDescription")}</p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="https://github.com/skygenesisenterprise/aether-mailer">
                  <Button size="lg" className="gap-2 h-12 px-8 text-base">
                    {t("mailServer.ctaGetStarted")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href={`/${locale}/company/contact`}>
                  <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                    {t("mailServer.ctaContactSales")}
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