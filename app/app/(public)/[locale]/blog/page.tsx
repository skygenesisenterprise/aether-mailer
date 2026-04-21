import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/public/Header";
import { Footer } from "@/components/public/Footer";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Calendar,
  Clock,
  FileText,
  BookOpen,
  Shield,
  Zap,
} from "lucide-react";

export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Public.blog" });

  const featuredArticles = [
    {
      title: "Comment Migrer de Postfix vers Aether Mailer",
      excerpt: "Guide complet pour migrer votre infrastructure email depuis Postfix vers Aether Mailer sans interruption de service.",
      category: "guide",
      readTime: 15,
      date: "15 Jan 2026",
      icon: Zap,
    },
    {
      title: "Configurer DKIM, DMARC et SPF pour une Sécurité Email Optimale",
      excerpt: "Meilleures pratiques pour sécuriser vos emails d'entreprise avec les protocoles d'authentification standard.",
      category: "security",
      readTime: 10,
      date: "10 Jan 2026",
      icon: Shield,
    },
  ];

  const latestArticles = [
    {
      title: "Sortie d'Aether Mailer 2.0 avec Support IMAP Complet",
      excerpt: "Découvrez les nouvelles fonctionnalités de la version 2.0 incluant le support IMAP complet et les améliorations de performance.",
      category: "news",
      readTime: 5,
      date: "20 Avr 2026",
      icon: Zap,
    },
    {
      title: "Guide de Déploiement sur AWS EC2",
      excerpt: "Tutoriel pas-à-pas pour déployer Aether Mailer sur une instance AWS EC2 avec Terraform.",
      category: "tutorial",
      readTime: 20,
      date: "18 Avr 2026",
      icon: BookOpen,
    },
    {
      title: "Conformité RGPD pour les Serveurs de Messagerie",
      excerpt: "Tout ce que vous devez savoir sur la conformité RGPD lors de l'utilisation d'un serveur de messagerie auto-hébergé.",
      category: "guide",
      readTime: 12,
      date: "15 Avr 2026",
      icon: Shield,
    },
    {
      title: "Optimisation des Performances IMAP",
      excerpt: "Techniques avancées pour optimiser les performances de votre serveur IMAP pour des milliers d'utilisateurs simultanés.",
      category: "tutorial",
      readTime: 18,
      date: "12 Avr 2026",
      icon: Zap,
    },
    {
      title: "Intégration avec Microsoft Active Directory",
      excerpt: "Comment configurer l'authentification LDAP et l'intégration avec Active Directory pour une solution enterprise.",
      category: "tutorial",
      readTime: 25,
      date: "8 Avr 2026",
      icon: BookOpen,
    },
    {
      title: "Nouvelle Architecture de Haute Disponibilité",
      excerpt: "Présentation de la nouvelle architecture multi-datacenter pour une disponibilité de 99.99%.",
      category: "news",
      readTime: 8,
      date: "5 Avr 2026",
      icon: Zap,
    },
  ];

  const categories = [
    { key: "all", label: t("categoryAll") },
    { key: "news", label: t("categoryNews") },
    { key: "tutorial", label: t("categoryTutorial") },
    { key: "guide", label: t("categoryGuide") },
    { key: "security", label: t("categorySecurity") },
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

        <section className="py-16 lg:py-20 border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mb-8">
              {t("featuredArticles")}
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {featuredArticles.map((article) => (
                <div
                  key={article.title}
                  className="p-6 rounded-lg border border-border bg-card hover:border-foreground/20 transition-colors cursor-pointer"
                >
                  <article.icon className="h-8 w-8 text-foreground mb-4" />
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <span className="px-2 py-1 rounded-full bg-foreground/5 capitalize">
                      {article.category}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {article.readTime} {t("readTime")}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{article.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    {article.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {article.date}
                    </span>
                    <span className="text-sm text-foreground flex items-center gap-1">
                      {t("readMore")}
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12">
              <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mb-6 md:mb-0">
                {t("latestArticles")}
              </h2>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category.key}
                    className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                      category.key === "all"
                        ? "bg-foreground text-background"
                        : "bg-foreground/5 text-foreground hover:bg-foreground/10"
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {latestArticles.map((article) => (
                <div
                  key={article.title}
                  className="p-6 rounded-lg border border-border bg-card hover:border-foreground/20 transition-colors cursor-pointer"
                >
                  <article.icon className="h-6 w-6 text-foreground mb-4" />
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <span className="px-2 py-1 rounded-full bg-foreground/5 capitalize">
                      {article.category}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {article.readTime} {t("readTime")}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2">{article.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-2">
                    {article.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {article.date}
                    </span>
                    <span className="text-sm text-foreground flex items-center gap-1">
                      {t("readMore")}
                      <ArrowRight className="h-3 w-3" />
                    </span>
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
                {t("newsletterTitle")}
              </h2>
              <p className="text-base text-muted-foreground mb-6">
                {t("newsletterDescription")}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder={t("newsletterPlaceholder")}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
                />
                <Button className="h-11">
                  {t("newsletterButton")}
                </Button>
              </div>
            </div>
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