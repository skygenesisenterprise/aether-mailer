import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/public/Header";
import { Footer } from "@/components/public/Footer";
import { Button } from "@/components/ui/button";
import { FaqAccordion } from "@/components/public/FaqAccordion";
import {
  ArrowRight,
  Globe,
  Shield,
  UserCheck,
  FileCheck,
  BadgeCheck,
  Settings,
  Users,
  Server,
  Building2,
  Landmark,
  HeartPulse,
  Phone,
  Clock,
  Database,
  HardDrive,
  CheckCircle2,
  Star,
} from "lucide-react";

export default async function EnterprisePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Public.enterprise" });

  const features = [
    {
      icon: Globe,
      title: t("featureMultiDomain"),
      description: t("featureMultiDomainDesc"),
    },
    {
      icon: Shield,
      title: t("featureHighAvailability"),
      description: t("featureHighAvailabilityDesc"),
    },
    {
      icon: UserCheck,
      title: t("featureDedicatedSupport"),
      description: t("featureDedicatedSupportDesc"),
    },
    {
      icon: FileCheck,
      title: t("featureCompliance"),
      description: t("featureComplianceDesc"),
    },
    {
      icon: BadgeCheck,
      title: t("featureSla"),
      description: t("featureSlaDesc"),
    },
    {
      icon: Settings,
      title: t("featureCustom"),
      description: t("featureCustomDesc"),
    },
  ];

  const certifications = [
    {
      icon: Shield,
      title: t("certIso"),
      description: t("certIsoDesc"),
    },
    {
      icon: Shield,
      title: t("certSoc2"),
      description: t("certSoc2Desc"),
    },
    {
      icon: HeartPulse,
      title: t("certHipaa"),
      description: t("certHipaaDesc"),
    },
    {
      icon: Building2,
      title: t("certFedramp"),
      description: t("certFedrampDesc"),
    },
    {
      icon: Shield,
      title: t("certPci"),
      description: t("certPciDesc"),
    },
  ];

  const testimonials = [
    {
      quote: t("testimonial1"),
      author: t("testimonial1Author"),
      role: t("testimonial1Role"),
    },
    {
      quote: t("testimonial2"),
      author: t("testimonial2Author"),
      role: t("testimonial2Role"),
    },
    {
      quote: t("testimonial3"),
      author: t("testimonial3Author"),
      role: t("testimonial3Role"),
    },
  ];

  const dedicatedTeam = [
    {
      icon: UserCheck,
      title: t("dedicatedAccount"),
      description: t("dedicatedAccountDesc"),
    },
    {
      icon: UserCheck,
      title: t("dedicatedEngineer"),
      description: t("dedicatedEngineerDesc"),
    },
    {
      icon: Clock,
      title: t("dedicatedSupport"),
      description: t("dedicatedSupportDesc"),
    },
    {
      icon: Phone,
      title: t("dedicatedOncall"),
      description: t("dedicatedOncallDesc"),
    },
  ];

  const scaling = [
    {
      icon: Server,
      value: "50M+",
      label: t("scalingMillions"),
    },
    {
      icon: Globe,
      value: "1000+",
      label: t("scalingDomains"),
    },
    {
      icon: Users,
      value: "100K+",
      label: t("scalingUsers"),
    },
    {
      icon: Database,
      value: "PB",
      label: t("scalingStorage"),
    },
  ];

  const industries = [
    {
      icon: Landmark,
      title: t("industriesFinance"),
      description: t("industriesFinanceDesc"),
    },
    {
      icon: HeartPulse,
      title: t("industriesHealthcare"),
      description: t("industriesHealthcareDesc"),
    },
    {
      icon: Building2,
      title: t("industriesGovernment"),
      description: t("industriesGovernmentDesc"),
    },
    {
      icon: Phone,
      title: t("industriesTelecom"),
      description: t("industriesTelecomDesc"),
    },
  ];

  const faqs = [
    {
      question: t("faqSlaTitle"),
      answer: t("faqSlaAnswer"),
    },
    {
      question: t("faqMigrationTitle"),
      answer: t("faqMigrationAnswer"),
    },
    {
      question: t("faqSupportTitle"),
      answer: t("faqSupportAnswer"),
    },
    {
      question: t("faqFailoverTitle"),
      answer: t("faqFailoverAnswer"),
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
                {t("heroTitle")}
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
                {t("heroDescription")}
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-start gap-4">
                <Link href={`/${locale}/company/contact`}>
                  <Button size="lg" className="gap-2 h-12 px-6 text-base">
                    {t("ctaGetStarted")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("featuresTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("featuresDescription")}
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

        <section className="py-20 lg:py-28 border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("certificationsTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("certificationsDescription")}
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
              {certifications.map((cert) => (
                <div
                  key={cert.title}
                  className="p-6 rounded-lg border border-border bg-card hover:border-foreground/20 transition-colors"
                >
                  <cert.icon className="h-8 w-8 text-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">{cert.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {cert.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("testimonialsTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("testimonialsDescription")}
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className="p-6 rounded-lg border border-border bg-card"
                >
                  <Star className="h-6 w-6 text-foreground mb-4" />
                  <p className="text-base text-muted-foreground leading-relaxed mb-4">
                    "{testimonial.quote}"
                  </p>
                  <div>
                    <div className="font-semibold text-foreground">{testimonial.author}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-28 border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("dedicatedTeamTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("dedicatedTeamDescription")}
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {dedicatedTeam.map((item) => (
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

        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("scalingTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("scalingDescription")}
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {scaling.map((item) => (
                <div key={item.label} className="text-center">
                  <item.icon className="h-8 w-8 mx-auto text-foreground mb-3" />
                  <div className="text-3xl sm:text-4xl font-bold text-foreground">{item.value}</div>
                  <div className="text-sm text-muted-foreground mt-1">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-28 border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("industriesTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("industriesDescription")}
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

        <section className="py-20 lg:py-28">
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
                <Link href={`/${locale}/company/contact`}>
                  <Button size="lg" className="gap-2 h-12 px-8 text-base">
                    {t("ctaGetStarted")}
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