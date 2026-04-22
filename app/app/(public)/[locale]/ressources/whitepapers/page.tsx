import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/public/Header";
import { Footer } from "@/components/public/Footer";
import { Button } from "@/components/ui/button";
import { Download, Shield, Mail, Server, Users } from "lucide-react";

export default async function WhitepapersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Public.whitepapers" });

  const whitepapers = [
    {
      id: "secure-email-infrastructure",
      title: t("paper1Title"),
      description: t("paper1Desc"),
      category: t("categorySecurity"),
      pages: 24,
      icon: Shield,
    },
    {
      id: "multi-tenant-arch",
      title: t("paper2Title"),
      description: t("paper2Desc"),
      category: t("categoryArchitecture"),
      pages: 18,
      icon: Server,
    },
    {
      id: "compliance-gdpr",
      title: t("paper3Title"),
      description: t("paper3Desc"),
      category: t("categoryCompliance"),
      pages: 32,
      icon: Mail,
    },
    {
      id: "enterprise-scaling",
      title: t("paper4Title"),
      description: t("paper4Desc"),
      category: t("categoryEnterprise"),
      pages: 28,
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
              {whitepapers.map((paper) => (
                <div
                  key={paper.id}
                  className="p-8 rounded-lg border border-border bg-card hover:border-foreground/20 transition-colors flex flex-col"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-foreground/5">
                      <paper.icon className="h-6 w-6 text-foreground" />
                    </div>
                    <span className="text-xs text-muted-foreground">{paper.pages} {t("pages")}</span>
                  </div>
                  <span className="text-xs font-medium text-emerald-600 mb-2">{paper.category}</span>
                  <h3 className="text-xl font-semibold text-foreground mb-3">{paper.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6 flex-1">
                    {paper.description}
                  </p>
                  <Button variant="outline" className="w-full gap-2">
                    <Download className="h-4 w-4" />
                    {t("download")}
                  </Button>
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