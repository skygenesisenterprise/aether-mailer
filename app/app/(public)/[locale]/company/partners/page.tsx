import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/public/Header";
import { Footer } from "@/components/public/Footer";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  CheckCircle2,
  Star,
  Globe,
  Shield,
  Users,
  Handshake,
  Building2,
} from "lucide-react";

export default async function PartnersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Public" });

  const partnershipLevels = [
    {
      title: t("partners.technologyTitle"),
      description: t("partners.technologyDesc"),
      benefits: [
        t("partners.benefit1"),
        t("partners.benefit2"),
        t("partners.benefit3"),
        t("partners.benefit4"),
      ],
    },
    {
      title: t("partners.solutionTitle"),
      description: t("partners.solutionDesc"),
      benefits: [
        t("partners.benefit5"),
        t("partners.benefit6"),
        t("partners.benefit7"),
        t("partners.benefit8"),
      ],
    },
    {
      title: t("partners.managedTitle"),
      description: t("partners.managedDesc"),
      benefits: [
        t("partners.benefit9"),
        t("partners.benefit10"),
        t("partners.benefit11"),
        t("partners.benefit12"),
      ],
    },
  ];

  const featuredPartners = [
    { name: "AWS", category: t("partners.categoryCloud"), logo: "AWS" },
    { name: "Microsoft Azure", category: t("partners.categoryCloud"), logo: "Azure" },
    { name: "Google Cloud", category: t("partners.categoryCloud"), logo: "GCP" },
    { name: "Kubernetes", category: t("partners.categoryContainer"), logo: "K8s" },
    { name: "Docker", category: t("partners.categoryContainer"), logo: "Docker" },
    { name: "Terraform", category: t("partners.categoryInfrastructure"), logo: "TF" },
    { name: "Datadog", category: t("partners.categoryMonitoring"), logo: "DD" },
    { name: "HashiCorp", category: t("partners.categoryInfrastructure"), logo: "HC" },
  ];

  const testimonials = [
    {
      quote: t("partners.testimonial1Quote"),
      author: t("partners.testimonial1Author"),
      role: t("partners.testimonial1Role"),
    },
    {
      quote: t("partners.testimonial2Quote"),
      author: t("partners.testimonial2Author"),
      role: t("partners.testimonial2Role"),
    },
    {
      quote: t("partners.testimonial3Quote"),
      author: t("partners.testimonial3Author"),
      role: t("partners.testimonial3Role"),
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
                <Handshake className="h-4 w-4 text-emerald-500" />
                <span className="font-medium">{t("partners.badge")}</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground leading-tight text-balance">
                {t("partners.heroTitle")}
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
                {t("partners.heroDescription")}
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-start gap-4">
                <Link href={`/${locale}/contact`}>
                  <Button size="lg" className="gap-2 h-12 px-6 text-base">
                    {t("partners.becomePartner")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href={`/${locale}/docs`}>
                  <Button variant="outline" size="lg" className="gap-2 h-12 px-6 text-base">
                    {t("partners.viewDocumentation")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Partners */}
        <section className="py-20 lg:py-28 border-b border-border bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("partners.featuredTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("partners.featuredDescription")}
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {featuredPartners.map((partner) => (
                <div
                  key={partner.name}
                  className="p-6 rounded-lg border border-border bg-card hover:border-foreground/20 transition-colors text-center"
                >
                  <div className="w-16 h-16 rounded-lg bg-foreground/5 flex items-center justify-center mx-auto mb-3">
                    <span className="text-lg font-semibold text-foreground">{partner.logo}</span>
                  </div>
                  <h3 className="text-base font-semibold text-foreground">{partner.name}</h3>
                  <p className="text-sm text-muted-foreground">{partner.category}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Partnership Levels */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("partners.levelsTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("partners.levelsDescription")}
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {partnershipLevels.map((level) => (
                <div
                  key={level.title}
                  className="p-6 rounded-lg border border-border bg-card hover:border-foreground/20 transition-colors"
                >
                  <Building2 className="h-8 w-8 text-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">{level.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                    {level.description}
                  </p>
                  <ul className="space-y-3">
                    {level.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6">
                    <Link href={`/${locale}/contact`}>
                      <Button variant="outline" className="w-full">
                        {t("partners.learnMore")}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 lg:py-28 border-b border-border bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("partners.testimonialsTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("partners.testimonialsDescription")}
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="p-6 rounded-lg border border-border bg-card">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    "{testimonial.quote}"
                  </p>
                  <div>
                    <div className="text-base font-semibold text-foreground">
                      {testimonial.author}
                    </div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Partner */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                  {t("partners.whyTitle")}
                </h2>
                <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                  {t("partners.whyDescription")}
                </p>
                <div className="mt-8 grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50 border border-border">
                    <Shield className="h-6 w-6 text-foreground mb-2" />
                    <div className="text-lg font-semibold text-foreground">
                      {t("partners.whyStat1")}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t("partners.whyStat1Label")}
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 border border-border">
                    <Users className="h-6 w-6 text-foreground mb-2" />
                    <div className="text-lg font-semibold text-foreground">
                      {t("partners.whyStat2")}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t("partners.whyStat2Label")}
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 border border-border">
                    <Globe className="h-6 w-6 text-foreground mb-2" />
                    <div className="text-lg font-semibold text-foreground">
                      {t("partners.whyStat3")}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t("partners.whyStat3Label")}
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 border border-border">
                    <Handshake className="h-6 w-6 text-foreground mb-2" />
                    <div className="text-lg font-semibold text-foreground">
                      {t("partners.whyStat4")}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t("partners.whyStat4Label")}
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-8 rounded-lg border border-border bg-card">
                <h3 className="text-xl font-semibold text-foreground mb-6">
                  {t("partners.ctaTitle")}
                </h3>
                <p className="text-muted-foreground mb-6">{t("partners.ctaDescription")}</p>
                <Link href={`/${locale}/contact`}>
                  <Button size="lg" className="w-full gap-2">
                    {t("partners.applyNow")}
                    <ArrowRight className="h-4 w-4" />
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
