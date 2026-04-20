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
  Zap,
  ArrowRight,
  Server,
  Users,
  Globe,
  CheckCircle2,
  Building2,
  Landmark,
  HeartPulse,
  Phone,
  BarChart3,
  Database,
  Clock,
  Mail,
  FileCheck,
  Award,
  User,
  Wrench,
  LifeBuoy,
  Calendar,
} from "lucide-react";

export default async function EnterprisePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Public" });

  const features = [
    {
      icon: Globe,
      title: t("enterprise.featureMultiDomain"),
      description: t("enterprise.featureMultiDomainDesc"),
    },
    {
      icon: Server,
      title: t("enterprise.featureHighAvailability"),
      description: t("enterprise.featureHighAvailabilityDesc"),
    },
    {
      icon: Users,
      title: t("enterprise.featureDedicatedSupport"),
      description: t("enterprise.featureDedicatedSupportDesc"),
    },
    {
      icon: Shield,
      title: t("enterprise.featureCompliance"),
      description: t("enterprise.featureComplianceDesc"),
    },
    {
      icon: CheckCircle2,
      title: t("enterprise.featureSla"),
      description: t("enterprise.featureSlaDesc"),
    },
    {
      icon: Zap,
      title: t("enterprise.featureCustom"),
      description: t("enterprise.featureCustomDesc"),
    },
  ];

  const certifications = [
    {
      icon: FileCheck,
      title: t("enterprise.certIso"),
      description: t("enterprise.certIsoDesc"),
    },
    {
      icon: Award,
      title: t("enterprise.certSoc2"),
      description: t("enterprise.certSoc2Desc"),
    },
    {
      icon: HeartPulse,
      title: t("enterprise.certHipaa"),
      description: t("enterprise.certHipaaDesc"),
    },
    {
      icon: Shield,
      title: t("enterprise.certFedramp"),
      description: t("enterprise.certFedrampDesc"),
    },
    {
      icon: Lock,
      title: t("enterprise.certPci"),
      description: t("enterprise.certPciDesc"),
    },
  ];

  const testimonials = [
    {
      quote: t("enterprise.testimonial1"),
      author: t("enterprise.testimonial1Author"),
      role: t("enterprise.testimonial1Role"),
    },
    {
      quote: t("enterprise.testimonial2"),
      author: t("enterprise.testimonial2Author"),
      role: t("enterprise.testimonial2Role"),
    },
    {
      quote: t("enterprise.testimonial3"),
      author: t("enterprise.testimonial3Author"),
      role: t("enterprise.testimonial3Role"),
    },
  ];

  const dedicatedTeam = [
    {
      icon: User,
      title: t("enterprise.dedicatedAccount"),
      description: t("enterprise.dedicatedAccountDesc"),
    },
    {
      icon: Wrench,
      title: t("enterprise.dedicatedEngineer"),
      description: t("enterprise.dedicatedEngineerDesc"),
    },
    {
      icon: LifeBuoy,
      title: t("enterprise.dedicatedSupport"),
      description: t("enterprise.dedicatedSupportDesc"),
    },
    {
      icon: Calendar,
      title: t("enterprise.dedicatedOncall"),
      description: t("enterprise.dedicatedOncallDesc"),
    },
  ];

  const scaling = [
    {
      icon: Mail,
      statistic: "10M+",
      label: t("enterprise.scalingMillions"),
    },
    {
      icon: Globe,
      statistic: "1,000+",
      label: t("enterprise.scalingDomains"),
    },
    {
      icon: Users,
      statistic: "100k+",
      label: t("enterprise.scalingUsers"),
    },
    {
      icon: Database,
      statistic: "100TB+",
      label: t("enterprise.scalingStorage"),
    },
  ];

  const industries = [
    {
      icon: Landmark,
      title: t("enterprise.industriesFinance"),
      description: t("enterprise.industriesFinanceDesc"),
    },
    {
      icon: HeartPulse,
      title: t("enterprise.industriesHealthcare"),
      description: t("enterprise.industriesHealthcareDesc"),
    },
    {
      icon: Building2,
      title: t("enterprise.industriesGovernment"),
      description: t("enterprise.industriesGovernmentDesc"),
    },
    {
      icon: Phone,
      title: t("enterprise.industriesTelecom"),
      description: t("enterprise.industriesTelecomDesc"),
    },
  ];

  const migration = [
    {
      step: t("enterprise.migrationWeek1"),
      description: t("enterprise.migrationWeek1Desc"),
    },
    {
      step: t("enterprise.migrationWeek2"),
      description: t("enterprise.migrationWeek2Desc"),
    },
    {
      step: t("enterprise.migrationWeek3"),
      description: t("enterprise.migrationWeek3Desc"),
    },
    {
      step: t("enterprise.migrationWeek4"),
      description: t("enterprise.migrationWeek4Desc"),
    },
  ];

  const faqs = [
    {
      question: t("enterprise.faqSlaTitle"),
      answer: t("enterprise.faqSlaAnswer"),
    },
    {
      question: t("enterprise.faqMigrationTitle"),
      answer: t("enterprise.faqMigrationAnswer"),
    },
    {
      question: t("enterprise.faqSupportTitle"),
      answer: t("enterprise.faqSupportAnswer"),
    },
    {
      question: t("enterprise.faqFailoverTitle"),
      answer: t("enterprise.faqFailoverAnswer"),
    },
    {
      question: t("enterprise.faqTestTitle"),
      answer: t("enterprise.faqTestAnswer"),
    },
    {
      question: t("enterprise.faqContractTitle"),
      answer: t("enterprise.faqContractAnswer"),
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
                {t("enterprise.badge")}
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground leading-tight text-balance">
                {t("enterprise.heroTitle")}
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
                {t("enterprise.heroDescription")}
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-start gap-4">
                <Link href={`/${locale}/company/contact`}>
                  <Button size="lg" className="gap-2 h-12 px-6 text-base">
                    {t("enterprise.ctaGetStarted")}
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
                {t("enterprise.featuresTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("enterprise.featuresDescription")}
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

        {/* Certifications Section */}
        <section className="py-20 lg:py-28 border-b border-border bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("enterprise.certificationsTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("enterprise.certificationsDescription")}
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
              {certifications.map((cert) => (
                <div key={cert.title} className="p-6 rounded-lg border border-border bg-card">
                  <cert.icon className="h-8 w-8 text-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">{cert.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{cert.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("enterprise.testimonialsTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("enterprise.testimonialsDescription")}
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="p-6 rounded-lg border border-border bg-card">
                  <div className="flex items-center gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className="h-4 w-4 text-yellow-500 fill-current"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l.807 2.422a1 1 0 00.95.69h2.62c.969 0 1.371 1.24.588 1.81l-2.122 1.533a1 1 0 00-.364 1.118l.807 2.422c.3.921-.755 1.688-1.54 1.118l-2.122-1.533a1 1 0 00-1.176 0l-2.122 1.533c-.784.57-1.84-.197-1.539-1.118l.807-2.422a1 1 0 00-.363-1.118l-2.122-1.533c-.783-.57-.38-1.81.588-1.81h2.62a1 1 0 00.951-.69l.807-2.422z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-sm text-foreground leading-relaxed mb-4">"{testimonial.quote}"</p>
                  <p className="text-sm font-semibold text-foreground">{testimonial.author}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Dedicated Team Section */}
        <section className="py-20 lg:py-28 border-b border-border bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("enterprise.dedicatedTeamTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("enterprise.dedicatedTeamDescription")}
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {dedicatedTeam.map((member) => (
                <div key={member.title} className="p-6 rounded-lg border border-border bg-card text-center">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-foreground/10 mx-auto mb-4">
                    <member.icon className="h-6 w-6 text-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{member.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{member.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Scaling Section */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("enterprise.scalingTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("enterprise.scalingDescription")}
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {scaling.map((item) => (
                <div
                  key={item.label}
                  className="p-6 rounded-lg border border-border bg-card text-center"
                >
                  <BarChart3 className="h-8 w-8 text-foreground mx-auto mb-4" />
                  <p className="text-3xl font-bold text-foreground mb-2">{item.statistic}</p>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Migration Timeline Section */}
        <section className="py-20 lg:py-28 border-b border-border bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("enterprise.migrationTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("enterprise.migrationDescription")}
              </p>
            </div>
            <div className="grid md:grid-cols-4 gap-6">
              {migration.map((step, index) => (
                <div key={step.step} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500 text-white font-bold text-xl mb-4">
                    {index + 1}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{step.step}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Industries Section */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("enterprise.industriesTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("enterprise.industriesDescription")}
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
                {t("enterprise.faqTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("enterprise.faqDescription")}
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
                {t("enterprise.ctaTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">{t("enterprise.ctaDescription")}</p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href={`/${locale}/company/contact`}>
                  <Button size="lg" className="gap-2 h-12 px-8 text-base">
                    {t("enterprise.ctaContactSales")}
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