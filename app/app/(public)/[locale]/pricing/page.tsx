import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/public/Header";
import { Footer } from "@/components/public/Footer";
import { Button } from "@/components/ui/button";
import { FaqAccordion } from "@/components/public/FaqAccordion";
import {
  ArrowRight,
  CheckCircle2,
  Server,
  Shield,
  Zap,
} from "lucide-react";

export default async function PricingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Public.pricing" });

  const plans = [
    {
      name: t("pricingCommunity"),
      description: t("pricingCommunityDesc"),
      price: t("pricingCommunityPrice"),
      icon: Server,
      features: [
        "Serveur SMTP/IMAP complet",
        "1 domaine",
        "100 boîtes email",
        "Support communautaire",
        "Mises à jour de sécurité",
        "Documentation complète",
      ],
      popular: false,
    },
    {
      name: t("pricingPro"),
      description: t("pricingProDesc"),
      price: t("pricingProPrice"),
      icon: Zap,
      features: [
        "Tout dans Community",
        "Domaines illimités",
        "Boites email illimitées",
        "Support prioritaire",
        "Archivage email",
        "API REST complète",
        "Haute disponibilité",
      ],
      popular: true,
    },
    {
      name: t("pricingEnterprise"),
      description: t("pricingEnterpriseDesc"),
      price: t("pricingEnterprisePrice"),
      icon: Shield,
      features: [
        "Tout dans Professionnel",
        "Infrastructure dédiée",
        "Support 24/7",
        "SLA garanti",
        "Formation offerte",
        "Intégration sur mesure",
        "Audit de sécurité",
      ],
      popular: false,
    },
  ];

  const apiPlans = [
    {
      name: t("pricingFree"),
      description: t("pricingFreeDesc"),
      price: "Gratuit",
      features: [
        "1 000 emails/mois",
        "API REST",
        "Support communautaire",
        "Validation email basique",
      ],
    },
    {
      name: t("pricingStarter"),
      description: t("pricingStarterDesc"),
      price: t("pricingStarterPrice"),
      features: [
        "10 000 emails/mois",
        "API REST",
        "Support par email",
        "Validation email avancée",
        "Webhooks",
      ],
    },
    {
      name: t("pricingPro"),
      description: t("pricingProDesc"),
      price: t("pricingProPrice"),
      features: [
        "100 000 emails/mois",
        "API REST",
        "Support prioritaire",
        "Validation email complète",
        "Webhooks avancés",
        "Templates HTML",
      ],
    },
    {
      name: t("pricingEnterprise"),
      description: t("pricingEnterpriseDesc"),
      price: t("pricingEnterprisePrice"),
      features: [
        "Volume illimité",
        "API REST dédiée",
        "Support 24/7",
        "Infrastructure dédiée",
        "Intégrations sur mesure",
        "SLAs personnalisés",
      ],
    },
  ];

  const faqs = [
    {
      question: t("faqFreeTitle"),
      answer: t("faqFreeAnswer"),
    },
    {
      question: t("faqMigrateTitle"),
      answer: t("faqMigrateAnswer"),
    },
    {
      question: t("faqOfflineTitle"),
      answer: t("faqOfflineAnswer"),
    },
    {
      question: t("faqUpdatesTitle"),
      answer: t("faqUpdatesAnswer"),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header locale={locale as import("@/lib/locale").Locale} />

      <main className="flex-1">
        <section className="relative py-24 lg:py-32 border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                {t("badge")}
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground leading-tight text-balance">
                {t("pricingTitle")}
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
                {t("pricingDescription")}
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-start gap-4">
                <Link href={`/${locale}/products/mail-server`}>
                  <Button size="lg" className="gap-2 h-12 px-6 text-base">
                    {t("ctaSelfHosted")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href={`/${locale}/company/contact`}>
                  <Button variant="outline" size="lg" className="h-12 px-6 text-base">
                    {t("ctaContactSales")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-28 border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("selfHostedTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("selfHostedDescription")}
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`relative p-6 rounded-lg border ${
                    plan.popular
                      ? "border-emerald-500 bg-emerald-500/5"
                      : "border-border bg-card"
                  }`}
                >
                  {plan.popular && (
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-emerald-500 text-white rounded-full mb-4">
                      {t("popular")}
                    </span>
                  )}
                  <plan.icon className="h-8 w-8 text-foreground mb-4" />
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
                      {plan.popular ? t("ctaGetStarted") : t("ctaContactSales")}
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-28 border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("apiTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("apiDescription")}
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {apiPlans.map((plan) => (
                <div
                  key={plan.name}
                  className="p-6 rounded-lg border border-border bg-card"
                >
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
                  <Link href={`/${locale}/products/api`} className="block">
                    <Button variant="outline" className="w-full">
                      {t("ctaLearnMore")}
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-28 border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("comparisonTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("comparisonDescription")}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-4 px-4 font-semibold text-foreground">{t("feature")}</th>
                    <th className="text-center py-4 px-4 font-semibold text-foreground">{t("pricingCommunity")}</th>
                    <th className="text-center py-4 px-4 font-semibold text-foreground">{t("pricingPro")}</th>
                    <th className="text-center py-4 px-4 font-semibold text-foreground">{t("pricingEnterprise")}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="py-4 px-4 text-muted-foreground">{t("featureDomains")}</td>
                    <td className="py-4 px-4 text-center text-muted-foreground">1</td>
                    <td className="py-4 px-4 text-center text-foreground font-medium">{t("unlimited")}</td>
                    <td className="py-4 px-4 text-center text-foreground font-medium">{t("unlimited")}</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-4 px-4 text-muted-foreground">{t("featureMailboxes")}</td>
                    <td className="py-4 px-4 text-center text-muted-foreground">100</td>
                    <td className="py-4 px-4 text-center text-foreground font-medium">{t("unlimited")}</td>
                    <td className="py-4 px-4 text-center text-foreground font-medium">{t("unlimited")}</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-4 px-4 text-muted-foreground">{t("featureStorage")}</td>
                    <td className="py-4 px-4 text-center text-muted-foreground">10 GB</td>
                    <td className="py-4 px-4 text-center text-foreground font-medium">1 TB</td>
                    <td className="py-4 px-4 text-center text-foreground font-medium">{t("custom")}</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-4 px-4 text-muted-foreground">{t("featureSupport")}</td>
                    <td className="py-4 px-4 text-center text-muted-foreground">{t("community")}</td>
                    <td className="py-4 px-4 text-center text-foreground font-medium">{t("priority")}</td>
                    <td className="py-4 px-4 text-center text-foreground font-medium">24/7</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-4 px-4 text-muted-foreground">{t("featureApi")}</td>
                    <td className="py-4 px-4 text-center text-muted-foreground">-</td>
                    <td className="py-4 px-4 text-center text-foreground font-medium">{t("included")}</td>
                    <td className="py-4 px-4 text-center text-foreground font-medium">{t("dedicated")}</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-4 px-4 text-muted-foreground">{t("featureArchiving")}</td>
                    <td className="py-4 px-4 text-center text-muted-foreground">-</td>
                    <td className="py-4 px-4 text-center text-foreground font-medium">{t("included")}</td>
                    <td className="py-4 px-4 text-center text-foreground font-medium">{t("included")}</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-4 px-4 text-muted-foreground">{t("featureSla")}</td>
                    <td className="py-4 px-4 text-center text-muted-foreground">-</td>
                    <td className="py-4 px-4 text-center text-muted-foreground">99.5%</td>
                    <td className="py-4 px-4 text-center text-foreground font-medium">99.99%</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-4 px-4 text-muted-foreground">{t("featureSecurityAudit")}</td>
                    <td className="py-4 px-4 text-center text-muted-foreground">-</td>
                    <td className="py-4 px-4 text-center text-muted-foreground">-</td>
                    <td className="py-4 px-4 text-center text-foreground font-medium">{t("included")}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-28 border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("faqTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("faqDescription")}
              </p>
            </div>
            <FaqAccordion faqs={faqs} />
          </div>
        </section>

        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("ctaTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">{t("ctaDescription")}</p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href={`/${locale}/products/mail-server`}>
                  <Button size="lg" className="gap-2 h-12 px-8 text-base">
                    {t("ctaGetStarted")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href={`/${locale}/company/contact`}>
                  <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                    {t("ctaContactSales")}
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