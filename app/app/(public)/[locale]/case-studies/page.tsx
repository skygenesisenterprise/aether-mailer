import { getTranslations } from "next-intl/server";
import { Header } from "@/components/public/Header";
import { Footer } from "@/components/public/Footer";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Building2,
  Landmark,
  HeartPulse,
  ShoppingCart,
} from "lucide-react";

export default async function CaseStudiesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Public.caseStudies" });

  const caseStudies = [
    {
      id: "healthcare-network",
      company: t("study1Company"),
      industry: t("study1Industry"),
      title: t("study1Title"),
      challenge: t("study1Challenge"),
      solution: t("study1Solution"),
      results: [t("study1Results1"), t("study1Results2"), t("study1Results3")],
      icon: HeartPulse,
    },
    {
      id: "fintech-scale",
      company: t("study2Company"),
      industry: t("study2Industry"),
      title: t("study2Title"),
      challenge: t("study2Challenge"),
      solution: t("study2Solution"),
      results: [t("study2Results1"), t("study2Results2"), t("study2Results3")],
      icon: Landmark,
    },
    {
      id: "government-modernization",
      company: t("study3Company"),
      industry: t("study3Industry"),
      title: t("study3Title"),
      challenge: t("study3Challenge"),
      solution: t("study3Solution"),
      results: [t("study3Results1"), t("study3Results2"), t("study3Results3")],
      icon: Building2,
    },
    {
      id: "ecommerce-growth",
      company: t("study4Company"),
      industry: t("study4Industry"),
      title: t("study4Title"),
      challenge: t("study4Challenge"),
      solution: t("study4Solution"),
      results: [t("study4Results1"), t("study4Results2"), t("study4Results3")],
      icon: ShoppingCart,
    },
  ];

  const industries = [
    { key: "all", label: t("categoryAll") },
    { key: "Healthcare", label: t("categoryHealthcare") },
    { key: "Finance", label: t("categoryFinance") },
    { key: "Government", label: t("categoryGovernment") },
    { key: "E-commerce", label: t("categoryEcommerce") },
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
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12">
              <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mb-6 md:mb-0">
                {t("caseStudiesTitle")}
              </h2>
              <div className="flex flex-wrap gap-2">
                {industries.map((industry) => (
                  <button
                    key={industry.key}
                    className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                      industry.key === "all"
                        ? "bg-foreground text-background"
                        : "bg-foreground/5 text-foreground hover:bg-foreground/10"
                    }`}
                  >
                    {industry.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {caseStudies.map((study) => (
                <div
                  key={study.id}
                  className="p-8 rounded-lg border border-border bg-card hover:border-foreground/20 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <study.icon className="h-12 w-12 text-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wide">
                        {study.industry}
                      </div>
                      <div className="text-lg font-semibold text-foreground">
                        {study.company}
                      </div>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-4">
                    {study.title}
                  </h3>
                  <div className="space-y-4 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium text-foreground">{t("challenge")}</span>
                      <p>{study.challenge}</p>
                    </div>
                    <div>
                      <span className="font-medium text-foreground">{t("solution")}</span>
                      <p>{study.solution}</p>
                    </div>
                    <div>
                      <span className="font-medium text-foreground">{t("results")}</span>
                      <ul className="mt-2 space-y-1">
                        {study.results.map((result, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-emerald-500 mt-1">•</span>
                            <span>{result}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="mt-6 pt-6 border-t border-border flex items-center gap-2 text-sm text-foreground">
                    {t("readMore")}
                    <ArrowRight className="h-4 w-4" />
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