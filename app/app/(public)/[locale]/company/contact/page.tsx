import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/public/Header";
import { Footer } from "@/components/public/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowRight,
  Mail,
  Phone,
  Clock,
  MessageSquare,
  HeadphonesIcon,
  Zap,
  Building2,
} from "lucide-react";

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Public" });

  const contactOptions = [
    {
      icon: MessageSquare,
      title: t("contact.salesTitle"),
      description: t("contact.salesDesc"),
      cta: t("contact.contactSales"),
      href: `/${locale}/contact`,
    },
    {
      icon: HeadphonesIcon,
      title: t("contact.supportTitle"),
      description: t("contact.supportDesc"),
      cta: t("contact.getSupport"),
      href: "https://support.skygenesisenterprise.com",
    },
    {
      icon: Zap,
      title: t("contact.technicalTitle"),
      description: t("contact.technicalDesc"),
      cta: t("contact.viewDocs"),
      href: `/${locale}/docs`,
    },
  ];

  const offices = [
    {
      city: t("contact.officeSanFrancisco"),
      address: t("contact.officeSanFranciscoAddress"),
      phone: "+1 (415) 555-0123",
    },
    {
      city: t("contact.officeLondon"),
      address: t("contact.officeLondonAddress"),
      phone: "+44 20 7946 0958",
    },
    {
      city: t("contact.officeSingapore"),
      address: t("contact.officeSingaporeAddress"),
      phone: "+65 6789 0123",
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
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground leading-tight text-balance">
                {t("contact.heroTitle")}
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
                {t("contact.heroDescription")}
              </p>
            </div>
          </div>
        </section>

        {/* Contact Options */}
        <section className="py-20 lg:py-28 border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-6">
              {contactOptions.map((option) => (
                <div
                  key={option.title}
                  className="p-6 rounded-lg border border-border bg-card hover:border-foreground/20 transition-colors"
                >
                  <option.icon className="h-8 w-8 text-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">{option.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    {option.description}
                  </p>
                  <Link href={option.href}>
                    <Button variant="outline" className="w-full">
                      {option.cta}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Form & Office Info */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
              {/* Contact Form */}
              <div>
                <h2 className="text-3xl sm:text-4xl font-semibold text-foreground mb-4">
                  {t("contact.formTitle")}
                </h2>
                <p className="text-lg text-muted-foreground mb-8">{t("contact.formDescription")}</p>
                <form className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="firstName" className="text-sm font-medium text-foreground">
                        {t("contact.formFirstName")}
                      </label>
                      <Input id="firstName" placeholder={t("contact.formFirstNamePlaceholder")} />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="lastName" className="text-sm font-medium text-foreground">
                        {t("contact.formLastName")}
                      </label>
                      <Input id="lastName" placeholder={t("contact.formLastNamePlaceholder")} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-foreground">
                      {t("contact.formEmail")}
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder={t("contact.formEmailPlaceholder")}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="company" className="text-sm font-medium text-foreground">
                      {t("contact.formCompany")}
                    </label>
                    <Input id="company" placeholder={t("contact.formCompanyPlaceholder")} />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-medium text-foreground">
                      {t("contact.formMessage")}
                    </label>
                    <Textarea
                      id="message"
                      placeholder={t("contact.formMessagePlaceholder")}
                      rows={5}
                    />
                  </div>
                  <Button type="submit" size="lg" className="w-full">
                    {t("contact.formSubmit")}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </form>
              </div>

              {/* Office Information */}
              <div>
                <h2 className="text-3xl sm:text-4xl font-semibold text-foreground mb-4">
                  {t("contact.officeTitle")}
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  {t("contact.officeDescription")}
                </p>
                <div className="space-y-6">
                  {offices.map((office) => (
                    <div key={office.city} className="p-6 rounded-lg border border-border bg-card">
                      <div className="flex items-start gap-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-foreground/5 shrink-0">
                          <Building2 className="h-5 w-5 text-foreground" />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-foreground mb-1">
                            {office.city}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-2">{office.address}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span>{office.phone}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 p-6 rounded-lg bg-muted/50 border border-border">
                  <div className="flex items-start gap-4">
                    <Clock className="h-5 w-5 text-foreground mt-0.5" />
                    <div>
                      <h3 className="text-base font-semibold text-foreground mb-1">
                        {t("contact.responseTime")}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {t("contact.responseTimeDesc")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Emergency Support */}
        <section className="py-20 lg:py-28 border-b border-border bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("contact.emergencyTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("contact.emergencyDescription")}
              </p>
              <div className="mt-8">
                <a href="mailto:support@skygenesisenterprise.com">
                  <Button variant="outline" size="lg">
                    <Mail className="h-4 w-4 mr-2" />
                    {t("contact.emergencyButton")}
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer locale={locale as "fr" | "be_fr" | "be_nl" | "ch_fr"} />
    </div>
  );
}
