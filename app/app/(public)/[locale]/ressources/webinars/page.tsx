import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/public/Header";
import { Footer } from "@/components/public/Footer";
import { Button } from "@/components/ui/button";
import { Calendar, Play, Shield, Mail, Server, Users } from "lucide-react";

export default async function WebinarsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Public.webinars" });

  const webinars = [
    {
      id: "secure-email-101",
      title: t("webinar1Title"),
      description: t("webinar1Desc"),
      category: t("categorySecurity"),
      duration: "45 min",
      date: t("webinar1Date"),
      icon: Shield,
    },
    {
      id: "multi-tenant-deep-dive",
      title: t("webinar2Title"),
      description: t("webinar2Desc"),
      category: t("categoryArchitecture"),
      duration: "60 min",
      date: t("webinar2Date"),
      icon: Server,
    },
    {
      id: "gdpr-compliance",
      title: t("webinar3Title"),
      description: t("webinar3Desc"),
      category: t("categoryCompliance"),
      duration: "45 min",
      date: t("webinar3Date"),
      icon: Mail,
    },
    {
      id: "enterprise-scaling",
      title: t("webinar4Title"),
      description: t("webinar4Desc"),
      category: t("categoryEnterprise"),
      duration: "50 min",
      date: t("webinar4Date"),
      icon: Users,
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
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {webinars.map((webinar) => (
                <div
                  key={webinar.id}
                  className="p-8 rounded-lg border border-border bg-card hover:border-foreground/20 transition-colors flex flex-col"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-foreground/5">
                      <webinar.icon className="h-6 w-6 text-foreground" />
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {webinar.date}
                    </div>
                  </div>
                  <span className="text-xs font-medium text-emerald-600 mb-2">{webinar.category}</span>
                  <h3 className="text-xl font-semibold text-foreground mb-3">{webinar.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1">
                    {webinar.description}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <span className="text-xs text-muted-foreground">{webinar.duration}</span>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Play className="h-3 w-3" />
                      {t("watch")}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-28 border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center p-8 rounded-lg border border-border bg-card">
              <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mb-4">
                {t("ctaTitle")}
              </h2>
              <p className="text-base text-muted-foreground mb-6">
                {t("ctaDescription")}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button className="h-11">
                  {t("ctaButton")}
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer locale={locale as "fr" | "be_fr" | "be_nl" | "ch_fr"} />
    </div>
  );
}