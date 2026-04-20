import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/public/Header";
import { Footer } from "@/components/public/Footer";
import { Button } from "@/components/ui/button";
import { GitHubIcon } from "@/components/ui/icons/GitHubIcon";
import { FaqAccordion } from "@/components/public/FaqAccordion";
import {
  Cloud,
  Zap,
  Server,
  ArrowRight,
  CheckCircle2,
  Users,
  Database,
  BarChart3,
  Shield,
  Lock,
  CreditCard,
  Clock,
  Mail,
  FileCheck,
} from "lucide-react";

export default async function CloudEmailPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Public" });

  const features = [
    {
      icon: Zap,
      title: t("cloudEmail.featureDeploy"),
      description: t("cloudEmail.featureDeployDesc"),
    },
    {
      icon: Server,
      title: t("cloudEmail.featureManaged"),
      description: t("cloudEmail.featureManagedDesc"),
    },
    {
      icon: BarChart3,
      title: t("cloudEmail.featureScalable"),
      description: t("cloudEmail.featureScalableDesc"),
    },
    {
      icon: Cloud,
      title: t("cloudEmail.featureUptime"),
      description: t("cloudEmail.featureUptimeDesc"),
    },
    {
      icon: Users,
      title: t("cloudEmail.featureSupport"),
      description: t("cloudEmail.featureSupportDesc"),
    },
    {
      icon: Database,
      title: t("cloudEmail.featureBackup"),
      description: t("cloudEmail.featureBackupDesc"),
    },
  ];

  const whyItems = [
    {
      icon: CreditCard,
      title: t("cloudEmail.whyCost"),
      description: t("cloudEmail.whyCostDesc"),
    },
    {
      icon: Lock,
      title: t("cloudEmail.whyControl"),
      description: t("cloudEmail.whyControlDesc"),
    },
    {
      icon: Zap,
      title: t("cloudEmail.whyApi"),
      description: t("cloudEmail.whyApiDesc"),
    },
    {
      icon: Users,
      title: t("cloudEmail.whySupport"),
      description: t("cloudEmail.whySupportDesc"),
    },
  ];

  const stats = [
    { value: "50 000+", label: t("cloudEmail.statsUsers"), icon: Users },
    { value: "99.99%", label: t("cloudEmail.statsUptime"), icon: Clock },
    { value: "2Mds", label: t("cloudEmail.statsEmails"), icon: Mail },
    { value: "48h", label: t("cloudEmail.statsMigration"), icon: Clock },
  ];

  const securityItems = [
    {
      icon: Lock,
      title: t("cloudEmail.securityEncryption"),
      description: t("cloudEmail.securityEncryptionDesc"),
    },
    {
      icon: Shield,
      title: t("cloudEmail.securityTls"),
      description: t("cloudEmail.securityTlsDesc"),
    },
    {
      icon: Users,
      title: t("cloudEmail.security2fa"),
      description: t("cloudEmail.security2faDesc"),
    },
    {
      icon: FileCheck,
      title: t("cloudEmail.securityGdpr"),
      description: t("cloudEmail.securityGdprDesc"),
    },
  ];

  const plans = [
    {
      name: t("cloudEmail.planStarter"),
      description: t("cloudEmail.planStarterDesc"),
      price: t("cloudEmail.planStarterPrice"),
      features: [
        "5 utilisateurs",
        "10 Go de stockage",
        "Support par email",
        "Domaine personnalisé",
        "DKIM & DMARC",
        t("cloudEmail.planStarterMoneyBack"),
      ],
      popular: false,
    },
    {
      name: t("cloudEmail.planBusiness"),
      description: t("cloudEmail.planBusinessDesc"),
      price: t("cloudEmail.planBusinessPrice"),
      features: [
        "25 utilisateurs",
        "100 Go de stockage",
        "Support prioritaire",
        "Domaines illimités",
        "Archivage 1 an",
        "API complète",
      ],
      popular: true,
    },
    {
      name: t("cloudEmail.planEnterprise"),
      description: t("cloudEmail.planEnterpriseDesc"),
      price: t("cloudEmail.planEnterprisePrice"),
      features: [
        "Utilisateurs illimités",
        "Stockage illimité",
        "Support 24/7",
        "Infra dédiée",
        "Archivage 7 ans",
        "Formation offerte",
      ],
      popular: false,
    },
  ];

  const migration = [
    {
      step: t("cloudEmail.migrationDiscovery"),
      description: t("cloudEmail.migrationDiscoveryDesc"),
    },
    {
      step: t("cloudEmail.migrationPlan"),
      description: t("cloudEmail.migrationPlanDesc"),
    },
    {
      step: t("cloudEmail.migrationExecute"),
      description: t("cloudEmail.migrationExecuteDesc"),
    },
    {
      step: t("cloudEmail.migrationValidate"),
      description: t("cloudEmail.migrationValidateDesc"),
    },
  ];

  const faqs = [
    {
      question: t("cloudEmail.faqDataTitle"),
      answer: t("cloudEmail.faqDataAnswer"),
    },
    {
      question: t("cloudEmail.faqMigrateTitle"),
      answer: t("cloudEmail.faqMigrateAnswer"),
    },
    {
      question: t("cloudEmail.faqDowntimeTitle"),
      answer: t("cloudEmail.faqDowntimeAnswer"),
    },
    {
      question: t("cloudEmail.faqPrivacyTitle"),
      answer: t("cloudEmail.faqPrivacyAnswer"),
    },
    {
      question: t("cloudEmail.faqDomainTitle"),
      answer: t("cloudEmail.faqDomainAnswer"),
    },
    {
      question: t("cloudEmail.faqSlaTitle"),
      answer: t("cloudEmail.faqSlaAnswer"),
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
                {t("cloudEmail.badge")}
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground leading-tight text-balance">
                {t("cloudEmail.heroTitle")}
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
                {t("cloudEmail.heroDescription")}
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-start gap-4">
                <Link href="https://cloud.aethermailer.com">
                  <Button size="lg" className="gap-2 h-12 px-6 text-base">
                    {t("cloudEmail.ctaTryFree")}
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

        {/* Features Section */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("cloudEmail.featuresTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("cloudEmail.featuresDescription")}
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

        {/* Why Aether Section */}
        <section className="py-20 lg:py-28 border-b border-border bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("cloudEmail.whyTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("cloudEmail.whyDescription")}
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {whyItems.map((item) => (
                <div key={item.title} className="bg-card p-6 rounded-lg border border-border">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-emerald-500/10 mb-4">
                    <item.icon className="h-6 w-6 text-emerald-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Security Section */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("cloudEmail.securityTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("cloudEmail.securityDescription")}
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {securityItems.map((item) => (
                <div key={item.title} className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-foreground/5 shrink-0">
                    <item.icon className="h-5 w-5 text-foreground" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Plans Section */}
        <section className="py-20 lg:py-28 border-b border-border bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("cloudEmail.plansTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("cloudEmail.plansDescription")}
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {plans.map((plan) => (
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
                      {t("cloudEmail.planBusinessPopular")}
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
                      {t("cloudEmail.ctaContactSales")}
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Migration Section */}
        <section className="py-20 lg:py-28 border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("cloudEmail.migrationTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("cloudEmail.migrationDescription")}
              </p>
            </div>
            <div className="grid md:grid-cols-4 gap-6">
              {migration.map((step, index) => (
                <div key={step.step} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-foreground text-background font-bold text-xl mb-4">
                    {index + 1}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{step.step}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
            <div className="mt-12 flex flex-wrap justify-center gap-8 text-center">
              <div>
                <div className="text-2xl font-bold text-foreground">{t("cloudEmail.migrationTimelineSmall")}</div>
                <p className="text-sm text-muted-foreground">-500 boîte{`s`}</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{t("cloudEmail.migrationTimelineMedium")}</div>
                <p className="text-sm text-muted-foreground">-5000 boîte{`s`}</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{t("cloudEmail.migrationTimelineLarge")}</div>
                <p className="text-sm text-muted-foreground">Enterprise</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 lg:py-28 border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("cloudEmail.faqTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("cloudEmail.faqDescription")}
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
                {t("cloudEmail.ctaTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">{t("cloudEmail.ctaDescription")}</p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="https://cloud.aethermailer.com">
                  <Button size="lg" className="gap-2 h-12 px-8 text-base">
                    {t("cloudEmail.ctaTryFree")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href={`/${locale}/company/contact`}>
                  <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                    {t("cloudEmail.ctaContactSales")}
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