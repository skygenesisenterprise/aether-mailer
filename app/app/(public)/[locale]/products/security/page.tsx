import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/public/Header";
import { Footer } from "@/components/public/Footer";
import { Button } from "@/components/ui/button";
import { GitHubIcon } from "@/components/ui/icons/GitHubIcon";
import { FaqAccordion } from "@/components/public/FaqAccordion";
import {
  Shield,
  Lock,
  Fingerprint,
  ArrowRight,
  LockKeyhole,
  AlertTriangle,
  FileCheck,
  Users,
} from "lucide-react";

export default async function EmailSecurityPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Public" });

  const features = [
    {
      icon: Shield,
      title: t("emailSecurity.featureDkim"),
      description: t("emailSecurity.featureDkimDesc"),
    },
    {
      icon: Lock,
      title: t("emailSecurity.featureDmarc"),
      description: t("emailSecurity.featureDmarcDesc"),
    },
    {
      icon: Fingerprint,
      title: t("emailSecurity.featureSpf"),
      description: t("emailSecurity.featureSpfDesc"),
    },
    {
      icon: LockKeyhole,
      title: t("emailSecurity.featureTls"),
      description: t("emailSecurity.featureTlsDesc"),
    },
    {
      icon: Shield,
      title: t("emailSecurity.featureSpam"),
      description: t("emailSecurity.featureSpamDesc"),
    },
    {
      icon: AlertTriangle,
      title: t("emailSecurity.featurePhishing"),
      description: t("emailSecurity.featurePhishingDesc"),
    },
  ];

  const howItWorks = [
    {
      step: "01",
      title: t("emailSecurity.step1Title"),
      description: t("emailSecurity.step1Desc"),
    },
    {
      step: "02",
      title: t("emailSecurity.step2Title"),
      description: t("emailSecurity.step2Desc"),
    },
    {
      step: "03",
      title: t("emailSecurity.step3Title"),
      description: t("emailSecurity.step3Desc"),
    },
    {
      step: "04",
      title: t("emailSecurity.step4Title"),
      description: t("emailSecurity.step4Desc"),
    },
  ];

  const compliance = [
    {
      icon: FileCheck,
      title: t("emailSecurity.complianceGdpr"),
      description: t("emailSecurity.complianceGdprDesc"),
    },
    {
      icon: Users,
      title: t("emailSecurity.complianceHipaa"),
      description: t("emailSecurity.complianceHipaaDesc"),
    },
    {
      icon: Shield,
      title: t("emailSecurity.compliancePci"),
      description: t("emailSecurity.compliancePciDesc"),
    },
  ];

  const faqs = [
    {
      question: t("emailSecurity.faqDkimTitle"),
      answer: t("emailSecurity.faqDkimAnswer"),
    },
    {
      question: t("emailSecurity.faqCostTitle"),
      answer: t("emailSecurity.faqCostAnswer"),
    },
    {
      question: t("emailSecurity.faqSetupTitle"),
      answer: t("emailSecurity.faqSetupAnswer"),
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
                {t("emailSecurity.badge")}
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground leading-tight text-balance">
                {t("emailSecurity.heroTitle")}
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
                {t("emailSecurity.heroDescription")}
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-start gap-4">
                <Link href="https://github.com/skygenesisenterprise/aether-mailer">
                  <Button size="lg" className="gap-2 h-12 px-6 text-base">
                    {t("emailSecurity.ctaGetStarted")}
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
                {t("emailSecurity.featuresTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("emailSecurity.featuresDescription")}
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

        {/* How It Works Section */}
        <section className="py-20 lg:py-28 border-b border-border bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("emailSecurity.howItWorksTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("emailSecurity.howItWorksDescription")}
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {howItWorks.map((step) => (
                <div key={step.step} className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-foreground text-background font-bold text-2xl mb-4">
                    {step.step}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Compliance Section */}
        <section className="py-20 lg:py-28 border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("emailSecurity.complianceTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("emailSecurity.complianceDescription")}
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {compliance.map((item) => (
                <div
                  key={item.title}
                  className="p-6 rounded-lg border border-border bg-card"
                >
                  <item.icon className="h-8 w-8 text-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.description}
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
                {t("emailSecurity.faqTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("emailSecurity.faqDescription")}
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
                {t("emailSecurity.ctaTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">{t("emailSecurity.ctaDescription")}</p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="https://github.com/skygenesisenterprise/aether-mailer">
                  <Button size="lg" className="gap-2 h-12 px-8 text-base">
                    {t("emailSecurity.ctaGetStarted")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href={`/${locale}/company/contact`}>
                  <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                    {t("emailSecurity.ctaContactSales")}
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