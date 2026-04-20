import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/public/Header";
import { Footer } from "@/components/public/Footer";
import { Button } from "@/components/ui/button";
import { GitHubIcon } from "@/components/ui/icons/GitHubIcon";
import {
  ArrowRight,
  Clock,
  CheckCircle2,
  Target,
  Shield,
  Users,
  Zap,
  Globe,
  Award,
  Heart,
  Lightbulb,
} from "lucide-react";

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Public" });

  const values = [
    {
      icon: Shield,
      title: t("about.securityTitle"),
      description: t("about.securityDesc"),
    },
    {
      icon: Users,
      title: t("about.customerFocusTitle"),
      description: t("about.customerFocusDesc"),
    },
    {
      icon: Zap,
      title: t("about.innovationTitle"),
      description: t("about.innovationDesc"),
    },
    {
      icon: Globe,
      title: t("about.opennessTitle"),
      description: t("about.opennessDesc"),
    },
  ];

  const teamMembers = [
    { nameKey: "team.alex", roleKey: "team.alexRole", image: "AC" },
    { nameKey: "team.sarah", roleKey: "team.sarahRole", image: "SM" },
    { nameKey: "team.james", roleKey: "team.jamesRole", image: "JW" },
    { nameKey: "team.emily", roleKey: "team.emilyRole", image: "ED" },
  ];

  const recentUpdates = [
    { version: "v2.4.0", dateKey: "updates.v240", descKey: "updates.v240Desc" },
    { version: "v2.3.0", dateKey: "updates.v230", descKey: "updates.v230Desc" },
    { version: "v2.2.0", dateKey: "updates.v220", descKey: "updates.v220Desc" },
  ];

  const milestones = [
    { year: "2021", title: t("about.milestone2021"), description: t("about.milestone2021Desc") },
    { year: "2022", title: t("about.milestone2022"), description: t("about.milestone2022Desc") },
    { year: "2023", title: t("about.milestone2023"), description: t("about.milestone2023Desc") },
    { year: "2024", title: t("about.milestone2024"), description: t("about.milestone2024Desc") },
    { year: "2025", title: t("about.milestone2025"), description: t("about.milestone2025Desc") },
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
                {t("about.heroTitle")}
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
                {t("about.heroDescription")}
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-start gap-4">
                <Link href={`/${locale}/docs`}>
                  <Button size="lg" className="gap-2 h-12 px-6 text-base">
                    {t("hero.ctaDocs")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="https://github.com/skygenesisenterprise/aether-identity">
                  <Button variant="outline" size="lg" className="gap-2 h-12 px-6 text-base">
                    <GitHubIcon className="h-4 w-4" />
                    {t("hero.ctaGithub")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-20 lg:py-28 border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                  <Target className="h-4 w-4 text-emerald-500" />
                  <span className="font-medium">{t("about.missionLabel")}</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                  {t("about.missionTitle")}
                </h2>
                <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                  {t("about.missionDescription")}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 rounded-lg bg-muted/50 border border-border">
                  <Shield className="h-8 w-8 text-foreground mb-3" />
                  <div className="text-2xl font-semibold text-foreground">
                    {t("about.securityStat")}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t("about.securityStatLabel")}
                  </div>
                </div>
                <div className="p-6 rounded-lg bg-muted/50 border border-border">
                  <Globe className="h-8 w-8 text-foreground mb-3" />
                  <div className="text-2xl font-semibold text-foreground">
                    {t("about.globalStat")}
                  </div>
                  <div className="text-sm text-muted-foreground">{t("about.globalStatLabel")}</div>
                </div>
                <div className="p-6 rounded-lg bg-muted/50 border border-border">
                  <Users className="h-8 w-8 text-foreground mb-3" />
                  <div className="text-2xl font-semibold text-foreground">
                    {t("about.usersStat")}
                  </div>
                  <div className="text-sm text-muted-foreground">{t("about.usersStatLabel")}</div>
                </div>
                <div className="p-6 rounded-lg bg-muted/50 border border-border">
                  <Award className="h-8 w-8 text-foreground mb-3" />
                  <div className="text-2xl font-semibold text-foreground">
                    {t("about.uptimeStat")}
                  </div>
                  <div className="text-sm text-muted-foreground">{t("about.uptimeStatLabel")}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-20 lg:py-28 border-b border-border bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("about.valuesTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("about.valuesDescription")}
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value) => (
                <div
                  key={value.title}
                  className="p-6 rounded-lg border border-border bg-card hover:border-foreground/20 transition-colors"
                >
                  <value.icon className="h-8 w-8 text-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {value.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Story/Milestones Section */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("about.storyTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("about.storyDescription")}
              </p>
            </div>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-px bg-border md:left-1/2" />
              <div className="space-y-12">
                {milestones.map((milestone, index) => (
                  <div
                    key={milestone.year}
                    className={`relative flex items-center ${
                      index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                    }`}
                  >
                    <div className="absolute left-4 w-8 h-8 rounded-full bg-background border-2 border-border flex items-center justify-center md:left-1/2 md:-ml-4">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div
                      className={`ml-12 md:ml-0 md:w-[45%] ${
                        index % 2 === 0 ? "md:mr-auto md:pr-12" : "md:ml-auto md:pl-12"
                      }`}
                    >
                      <div className="text-sm font-medium text-emerald-600 mb-1">
                        {milestone.year}
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        {milestone.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {milestone.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-20 lg:py-28 border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("team.title")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("team.description")}
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {teamMembers.map((member) => (
                <div
                  key={member.nameKey}
                  className="p-6 rounded-lg border border-border bg-card text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-foreground/10 flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl font-semibold text-foreground">{member.image}</span>
                  </div>
                  <h3 className="text-base font-semibold text-foreground">{t(member.nameKey)}</h3>
                  <p className="text-sm text-muted-foreground">{t(member.roleKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Recent Updates */}
        <section className="py-20 lg:py-28 border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("updates.title")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("updates.description")}
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {recentUpdates.map((update) => (
                <div
                  key={update.version}
                  className="p-6 rounded-lg border border-border bg-card hover:border-foreground/20 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{t(update.dateKey)}</span>
                  </div>
                  <div className="text-lg font-semibold text-foreground mb-2">{update.version}</div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t(update.descKey)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("cta.title")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">{t("cta.description")}</p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href={`/${locale}/docs`}>
                  <Button size="lg" className="gap-2 h-12 px-8 text-base">
                    {t("cta.getStarted")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href={`/${locale}/contact`}>
                  <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                    {t("cta.contactSales")}
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
