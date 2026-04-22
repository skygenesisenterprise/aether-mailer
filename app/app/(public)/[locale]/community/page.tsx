import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/public/Header";
import { Footer } from "@/components/public/Footer";
import { Button } from "@/components/ui/button";
import { GitHubIcon } from "@/components/ui/icons/GitHubIcon";
import {
  ArrowRight,
  MessageCircle,
  Users,
  Calendar,
  Heart,
  Gift,
  Mic,
  Plug,
} from "lucide-react";

export default async function CommunityPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Public.community" });

  const communityStats = [
    {
      value: "5000+",
      label: t("members"),
    },
    {
      value: "12000+",
      label: t("messages"),
    },
    {
      value: "150+",
      label: t("online"),
    },
  ];

  const communityChannels = [
    {
      icon: Users,
      title: t("joinTitle"),
      description: t("joinDescription"),
      href: "https://discord.com",
    },
  ];

  const contributions = [
    {
      icon: GitHubIcon,
      title: t("contributeTitle"),
      description: t("contributeDescription"),
      href: "https://github.com/skygenesisenterprise/aether-mailer",
    },
    {
      icon: MessageCircle,
      title: t("discordTitle"),
      description: t("discordDescription"),
      href: "https://discord.com",
    },
    {
      icon: MessageCircle,
      title: t("forumTitle"),
      description: t("forumDescription"),
      href: "https://forum.aether-mailer.com",
    },
    {
      icon: Calendar,
      title: t("eventsTitle"),
      description: t("eventsDescription"),
      href: `/${locale}/community/events`,
    },
  ];

  const getInvolved = [
    {
      icon: Mic,
      title: t("talkTitle"),
      description: t("talkDescription"),
    },
    {
      icon: Gift,
      title: t("sponsorTitle"),
      description: t("sponsorDescription"),
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

        <section className="py-16 lg:py-20 border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-3 md:grid-cols-3 gap-8">
              {communityStats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("joinTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("joinDescription")}
              </p>
            </div>
            <div className="grid md:grid-cols-1 gap-6">
              {contributions.map((channel) => (
                <Link
                  key={channel.title}
                  href={channel.href}
                  className="p-6 rounded-lg border border-border bg-card hover:border-foreground/20 transition-colors cursor-pointer"
                >
                  <channel.icon className="h-8 w-8 text-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">{channel.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {channel.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-28 border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("contributeTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("contributeDescription")}
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {contributions.map((contribution) => (
                <Link
                  key={contribution.title}
                  href={contribution.href}
                  className="p-6 rounded-lg border border-border bg-card hover:border-foreground/20 transition-colors cursor-pointer"
                >
                  <contribution.icon className="h-8 w-8 text-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">{contribution.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {contribution.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-16">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("contributeTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {t("contributeDescription")}
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {getInvolved.map((item) => (
                <div
                  key={item.title}
                  className="p-6 rounded-lg border border-border bg-card hover:border-foreground/20 transition-colors"
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

        <section className="py-20 lg:py-28 border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl sm:text-4xl font-semibold text-foreground">
                {t("ctaTitle")}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                {t("ctaDescription")}
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="https://discord.com">
                  <Button size="lg" className="gap-2 h-12 px-8 text-base">
                    {t("ctaButton")}
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