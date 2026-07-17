"use client";

import * as React from "react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Clock,
  Globe,
  HardDrive,
  Inbox,
  KeyRound,
  MailWarning,
  Plus,
  Send,
  Server,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// ---------- Data ----------

const sparklineData = {
  messages: [
    { v: 8 }, { v: 6 }, { v: 9 }, { v: 7 }, { v: 12 },
    { v: 14 }, { v: 11 }, { v: 16 }, { v: 15 }, { v: 19 },
    { v: 18 }, { v: 22 },
  ],
  storage: [
    { v: 42 }, { v: 45 }, { v: 44 }, { v: 47 }, { v: 49 },
    { v: 52 }, { v: 51 }, { v: 54 }, { v: 56 }, { v: 58 },
    { v: 60 }, { v: 62 },
  ],
  sessions: [
    { v: 92 }, { v: 88 }, { v: 95 }, { v: 91 }, { v: 99 },
    { v: 86 }, { v: 90 }, { v: 94 }, { v: 89 }, { v: 96 },
    { v: 91 }, { v: 89 },
  ],
  deliverability: [
    { v: 99.1 }, { v: 99.4 }, { v: 99.3 }, { v: 99.6 }, { v: 99.5 },
    { v: 99.7 }, { v: 99.6 }, { v: 99.8 }, { v: 99.7 }, { v: 99.9 },
    { v: 99.6 }, { v: 99.7 },
  ],
};

const trafficData = [
  { hour: "00h", incoming: 4200, outgoing: 3100 },
  { hour: "02h", incoming: 2800, outgoing: 1900 },
  { hour: "04h", incoming: 1900, outgoing: 1200 },
  { hour: "06h", incoming: 3100, outgoing: 2400 },
  { hour: "08h", incoming: 8400, outgoing: 6200 },
  { hour: "10h", incoming: 12600, outgoing: 9800 },
  { hour: "12h", incoming: 11200, outgoing: 8900 },
  { hour: "14h", incoming: 13800, outgoing: 10400 },
  { hour: "16h", incoming: 14200, outgoing: 11100 },
  { hour: "18h", incoming: 9800, outgoing: 7600 },
  { hour: "20h", incoming: 6400, outgoing: 4800 },
  { hour: "22h", incoming: 5100, outgoing: 3900 },
];

const queueStatus = [
  { label: "En attente", value: 342, max: 500, tone: "blue" as const },
  { label: "En cours", value: 89, max: 200, tone: "amber" as const },
  { label: "Échoués", value: 12, max: 50, tone: "rose" as const },
  { label: "Réussis (24h)", value: 196, max: 200, tone: "emerald" as const, suffix: "K" },
];

const insights = [
  {
    icon: TrendingUp,
    color: "text-emerald-400",
    pill: "+12.5%",
    title: "Pic de trafic vendredi 14h",
    detail: "3 200 msg/h en sortie — saturation proche sur aether.io.",
  },
  {
    icon: Globe,
    color: "text-primary",
    pill: "65%",
    title: "Domaine aether.io domine",
    detail: "Concentré sur 18 domaines — surveille la charge SMTP sortante.",
  },
  {
    icon: ShieldCheck,
    color: "text-emerald-400",
    pill: "99.7%",
    title: "Délivrance stable",
    detail: "23 hard bounces sur 24h, sous le seuil de tolérance interne.",
  },
  {
    icon: MailWarning,
    color: "text-amber-400",
    pill: "Alerte",
    title: "5 échecs répétés",
    detail: "Bloc IP 83.12.45.102 — déclenche une règle anti-brute-force.",
  },
];

const recentActivity = [
  {
    tone: "emerald" as const,
    message: "Authentification réussie",
    detail: "john@aether.io — IMAP depuis 192.168.1.42",
    time: "02:14",
  },
  {
    tone: "amber" as const,
    message: "Tentative de connexion suspecte",
    detail: "5 échecs depuis 83.12.45.102 — Port SMTP",
    time: "02:08",
  },
  {
    tone: "blue" as const,
    message: "File SMTP purgée",
    detail: "23 messages expirés nettoyés automatiquement",
    time: "02:01",
  },
  {
    tone: "emerald" as const,
    message: "Certificat TLS renouvelé",
    detail: "mail.aether.io — ACME Let's Encrypt",
    time: "01:20",
  },
  {
    tone: "blue" as const,
    message: "Nouveau compte créé",
    detail: "marie.dupont@globex.fr — Quota 5 Go",
    time: "00:34",
  },
  {
    tone: "amber" as const,
    message: "Seuil de stockage atteint",
    detail: "tenant 'acme' — 85% du quota",
    time: "23:46",
  },
];

const services = [
  { name: "IMAP", status: "operational", latency: "12 ms" },
  { name: "SMTP", status: "operational", latency: "18 ms" },
  { name: "JMAP", status: "operational", latency: "21 ms" },
  { name: "HTTP", status: "operational", latency: "8 ms" },
  { name: "WebDAV", status: "degraded", latency: "62 ms" },
  { name: "Antispam", status: "operational", latency: "34 ms" },
  { name: "Antivirus", status: "operational", latency: "41 ms" },
  { name: "ACME", status: "operational", latency: "78 ms" },
] as const;

const hubLinks = [
  {
    title: "Utilisateurs",
    description: "Comptes, alias, mots de passe et quotas",
    icon: Users,
    href: "/dash/management/accounts/users",
    accent: "from-blue-500/20 to-blue-500/0",
  },
  {
    title: "Domaines & DNS",
    description: "SPF, DKIM, DMARC — configuration complète",
    icon: Globe,
    href: "/dash/management/domains/list",
    accent: "from-emerald-500/20 to-emerald-500/0",
  },
  {
    title: "Rôles & permissions",
    description: "Politiques d'accès et équipes",
    icon: ShieldCheck,
    href: "/dash/management/roles/list",
    accent: "from-violet-500/20 to-violet-500/0",
  },
  {
    title: "File SMTP",
    description: "Messages entrants, sortants et relai",
    icon: Send,
    href: "/dash/config/smtp/queue",
    accent: "from-amber-500/20 to-amber-500/0",
  },
  {
    title: "Authentification",
    description: "OIDC, LDAP, MFA et mots de passe applicatifs",
    icon: KeyRound,
    href: "/dash/config/auth/oidc",
    accent: "from-pink-500/20 to-pink-500/0",
  },
  {
    title: "Monitoring",
    description: "Santé système, journaux et métriques",
    icon: Server,
    href: "/dash/monitoring/overview",
    accent: "from-cyan-500/20 to-cyan-500/0",
  },
];

const toneColor = {
  emerald: "text-emerald-400",
  amber: "text-amber-400",
  rose: "text-rose-400",
  blue: "text-blue-400",
  violet: "text-violet-400",
} as const;

// ---------- Types & helpers ----------

type Tone = keyof typeof toneColor;

const fadeIn = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] as const },
});

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toString();
}

// ---------- Sub-components ----------

const sparklineStroke: Record<Tone, string> = {
  emerald: "oklch(0.77 0.16 162)",
  amber: "oklch(0.82 0.16 78)",
  rose: "oklch(0.72 0.2 16)",
  blue: "oklch(0.78 0.16 232)",
  violet: "oklch(0.7 0.18 264)",
} as const;

const kpiGradient: Record<Tone, string> = {
  emerald: "from-emerald-500/40",
  amber: "from-amber-500/40",
  rose: "from-rose-500/40",
  blue: "from-blue-500/40",
  violet: "from-violet-500/40",
} as const;

function Sparkline({ data, tone }: { data: { v: number }[]; tone: Tone }) {
  const stroke = sparklineStroke[tone];
  const gradId = `spark-${tone}`;
  return (
    <div className="h-12 w-full" aria-hidden>
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity={0.45} />
              <stop offset="100%" stopColor={stroke} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={stroke}
            strokeWidth={1.75}
            fill={`url(#${gradId})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function PulseDot({ tone = "emerald" }: { tone?: Tone }) {
  const color = toneColor[tone] ?? toneColor.emerald;
  return (
    <span className="relative inline-flex h-2 w-2 items-center justify-center">
      <span
        className={cn(
          "absolute inline-flex h-full w-full rounded-full opacity-60",
          color,
          "animate-ping",
        )}
      />
      <span className={cn("relative inline-flex h-2 w-2 rounded-full", color, "bg-current")} />
    </span>
  );
}

function KpiCard({
  label,
  value,
  change,
  trend,
  description,
  icon: Icon,
  color,
  sparkline,
  delay = 0,
}: {
  label: string;
  value: string;
  change: string;
  trend: "up" | "down";
  description: string;
  icon: LucideIcon;
  color: Tone;
  sparkline: { v: number }[];
  delay?: number;
}) {
  const accent = toneColor[color];
  return (
    <motion.div
      initial={fadeIn(delay).initial}
      animate={fadeIn(delay).animate}
      transition={fadeIn(delay).transition}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
    >
      <Card
        className={cn(
          "relative h-full overflow-hidden border-white/5 bg-white/2 backdrop-blur-md",
          "hover:border-white/10 hover:bg-white/4",
          "transition-colors",
        )}
      >
        <div
          className={cn(
            "pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full blur-3xl opacity-40 bg-linear-to-br",
            kpiGradient[color],
          )}
        />
        <CardContent className="relative px-5 py-5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-lg",
                  "bg-white/4 ring-1 ring-inset ring-white/5",
                )}
              >
                <Icon className={cn("h-3.5 w-3.5", accent)} />
              </div>
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {label}
              </span>
            </div>
            <div
              className={cn(
                "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                trend === "up"
                  ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20"
                  : "bg-rose-500/10 text-rose-400 ring-1 ring-inset ring-rose-500/20",
              )}
            >
              {trend === "up" ? (
                <ArrowUpRight className="h-2.5 w-2.5" />
              ) : (
                <ArrowDownRight className="h-2.5 w-2.5" />
              )}
              {change}
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-semibold tracking-tight text-foreground font-mono tabular-nums">
              {value}
            </span>
          </div>
          <div className="-mx-1 mt-3">
            <Sparkline data={sparkline} tone={color} />
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const incoming = payload.find((p) => p.name === "incoming");
  const outgoing = payload.find((p) => p.name === "outgoing");
  return (
    <div className="rounded-lg border border-white/10 bg-zinc-950/90 px-3 py-2 shadow-2xl backdrop-blur-md">
      <div className="mb-1.5 flex items-center justify-between gap-3 text-[10px] uppercase tracking-wider text-zinc-500">
        <span className="font-mono">{label}</span>
        <span>messages</span>
      </div>
      <div className="space-y-1">
        {incoming && (
          <div className="flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[oklch(0.7_0.18_264)]" />
              <Inbox className="h-3 w-3 text-zinc-400" />
              <span className="text-zinc-300">Reçus</span>
            </div>
            <span className="font-mono tabular-nums text-zinc-100">{formatNumber(incoming.value)}</span>
          </div>
        )}
        {outgoing && (
          <div className="flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[oklch(0.77_0.16_162)]" />
              <Send className="h-3 w-3 text-zinc-400" />
              <span className="text-zinc-300">Envoyés</span>
            </div>
            <span className="font-mono tabular-nums text-zinc-100">{formatNumber(outgoing.value)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Main page ----------

export default function ManagementOverviewPage() {
  const [now, setNow] = React.useState<Date | null>(null);

  React.useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const dateLabel = now
    ? now.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";

  const timeLabel = now
    ? now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className="relative isolate min-h-full overflow-hidden pb-12">
      {/* Aurora background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-105 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgb(107_115_228/0.22),transparent_60%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-32 -z-10 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,rgb(94_189_153/0.18),transparent_70%)] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-0 top-96 -z-10 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,rgb(124_180_232/0.16),transparent_70%)] blur-3xl"
      />

      <div className="flex flex-col gap-10 p-6 md:p-8 lg:p-10">
        {/* ---------- HERO ---------- */}
        <motion.section {...fadeIn(0)} className="relative">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className="gap-2 border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-emerald-400"
                >
                  <PulseDot tone="emerald" />
                  <span className="font-mono text-[10px] uppercase tracking-wider">
                    Opérationnel
                  </span>
                </Badge>
                <Badge
                  variant="outline"
                  className="gap-2 border-white/10 bg-white/4 px-2.5 py-1 text-zinc-300"
                >
                  <Server className="h-3 w-3" />
                  <span className="font-mono text-[10px]">mail.aether.io</span>
                </Badge>
                <Badge
                  variant="outline"
                  className="gap-2 border-white/10 bg-white/4 px-2.5 py-1 text-zinc-300"
                >
                  <Building2 className="h-3 w-3" />
                  <span className="text-[10px]">Production · UE-West</span>
                </Badge>
              </div>

              <div>
                <p className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-500">
                  Centre de contrôle · {dateLabel}
                </p>
                <h1 className="mt-2 text-4xl font-semibold tracking-tight text-zinc-50 md:text-5xl">
                  Pilotez votre{" "}
                  <span className="bg-linear-to-br from-zinc-50 via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
                    infrastructure mail
                  </span>
                  .
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
                  Vue d&apos;ensemble en temps réel des comptes, domaines et flux de
                  messagerie. Tout est sous contrôle, aucune alerte critique n&apos;est
                  ouverte.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  asChild
                  size="default"
                  className="gap-2 bg-zinc-50 text-zinc-950 hover:bg-zinc-200"
                >
                  <Link href="/dash/management/accounts/users">
                    <UserPlus className="h-4 w-4" />
                    Inviter un utilisateur
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="gap-2 border-white/10 bg-white/4 text-zinc-100 hover:bg-white/8"
                >
                  <Link href="/dash/management/domains/list">
                    <Plus className="h-4 w-4" />
                    Ajouter un domaine
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  className="gap-2 text-zinc-400 hover:bg-white/4 hover:text-zinc-100"
                >
                  <Link href="/dash/monitoring/overview">
                    <Sparkles className="h-4 w-4" />
                    Tableau de bord monitoring
                  </Link>
                </Button>
              </div>
            </div>

            {/* System vitals card */}
            <Card className="border-white/5 bg-white/2 backdrop-blur-md lg:w-80">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-[11px] uppercase tracking-wider text-zinc-500">
                    Système
                  </CardDescription>
                  {timeLabel && (
                    <span className="font-mono text-[10px] text-zinc-500">
                      {timeLabel}
                    </span>
                  )}
                </div>
                <CardTitle className="text-base text-zinc-100">
                  Signaux vitaux
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 px-5 pb-5">
                <VitalRow
                  label="Disponibilité (90j)"
                  value="99.97%"
                  tone="emerald"
                />
                <VitalRow
                  label="Charge CPU"
                  value="42%"
                  tone="blue"
                />
                <VitalRow label="Latence SMTP" value="18 ms" tone="violet" />
                <Separator className="my-2" />
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-zinc-500">Prochaine maintenance</span>
                  <span className="font-mono text-zinc-300">17 juil. 03:00</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.section>

        {/* ---------- PULSE (Primary KPIs) ---------- */}
        <section className="space-y-3">
          <SectionHeader
            eyebrow="Indicateurs"
            title="Le pouls du serveur"
            description="Quatre signaux en temps réel qui résument l'état de la plateforme."
          />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Trafic routé"
              value="480K"
              change="+12.5%"
              trend="up"
              description="Messages traités sur 24h"
              icon={Inbox}
              color="violet"
              sparkline={sparklineData.messages}
              delay={0.05}
            />
            <KpiCard
              label="Taux de délivrance"
              value="99.7%"
              change="+0.4%"
              trend="up"
              description="Destination atteinte — 24h"
              icon={ShieldCheck}
              color="emerald"
              sparkline={sparklineData.deliverability}
              delay={0.1}
            />
            <KpiCard
              label="Sessions actives"
              value="89"
              change="-2.4%"
              trend="down"
              description="IMAP + JMAP connectés maintenant"
              icon={Activity}
              color="amber"
              sparkline={sparklineData.sessions}
              delay={0.15}
            />
            <KpiCard
              label="Stockage utilisé"
              value="2.4 To"
              change="+180 Go"
              trend="up"
              description="74% de la capacité provisionnée"
              icon={HardDrive}
              color="blue"
              sparkline={sparklineData.storage}
              delay={0.2}
            />
          </div>

          {/* Secondary ticker */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: "Comptes", value: "1 247", sub: "+3.2% ce mois" },
              { label: "Domaines", value: "18", sub: "Dont 4 wildcard" },
              { label: "Spam filtré (24h)", value: "4 218", sub: "+8.1% vs hier" },
              { label: "Hard bounces", value: "67", sub: "Sous le seuil" },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                {...fadeIn(0.25 + i * 0.04)}
                className="group flex items-center justify-between rounded-lg border border-white/5 bg-white/2 px-4 py-3 transition-colors hover:border-white/10 hover:bg-white/4"
              >
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                    {item.label}
                  </p>
                  <p className="font-mono text-xl tabular-nums text-zinc-100">
                    {item.value}
                  </p>
                </div>
                <p className="text-[11px] text-zinc-500 group-hover:text-zinc-400">
                  {item.sub}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ---------- TRAFFIC + INSIGHTS ---------- */}
        <section className="grid gap-4 xl:grid-cols-3">
          <motion.div {...fadeIn(0.3)} className="xl:col-span-2">
            <Card className="h-full overflow-hidden border-white/5 bg-white/2 backdrop-blur-md">
              <CardHeader className="flex flex-row items-start justify-between gap-2">
                <div>
                  <CardDescription className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-zinc-500">
                    <PulseDot tone="emerald" />
                    Trafic en direct
                  </CardDescription>
                  <CardTitle className="mt-1 text-base text-zinc-100">
                    Flux de messagerie — dernières 24h
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <LegendChip color="oklch(0.7 0.18 264)" label="Reçus" />
                  <LegendChip color="oklch(0.77 0.16 162)" label="Envoyés" />
                </div>
              </CardHeader>
              <CardContent className="px-2 pb-2 pt-0 sm:px-4">
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <AreaChart
                      data={trafficData}
                      margin={{ top: 10, right: 8, left: -8, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="grad-incoming" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="oklch(0.7 0.18 264)" stopOpacity={0.45} />
                          <stop offset="100%" stopColor="oklch(0.7 0.18 264)" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="grad-outgoing" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="oklch(0.77 0.16 162)" stopOpacity={0.45} />
                          <stop offset="100%" stopColor="oklch(0.77 0.16 162)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="rgba(255,255,255,0.06)"
                      />
                      <XAxis
                        dataKey="hour"
                        tickLine={false}
                        axisLine={false}
                        stroke="rgba(255,255,255,0.35)"
                        tick={{ fontSize: 11, fill: "rgba(255,255,255,0.45)" }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        stroke="rgba(255,255,255,0.35)"
                        tick={{ fontSize: 11, fill: "rgba(255,255,255,0.45)" }}
                        tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                      />
                      <RechartsTooltip
                        cursor={{ stroke: "rgba(255,255,255,0.15)", strokeWidth: 1 }}
                        content={<CustomTooltip />}
                      />
                      <Area
                        type="monotone"
                        name="incoming"
                        dataKey="incoming"
                        stroke="oklch(0.7 0.18 264)"
                        strokeWidth={2}
                        fill="url(#grad-incoming)"
                      />
                      <Area
                        type="monotone"
                        name="outgoing"
                        dataKey="outgoing"
                        stroke="oklch(0.77 0.16 162)"
                        strokeWidth={2}
                        fill="url(#grad-outgoing)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Insights */}
          <motion.div {...fadeIn(0.35)}>
            <Card className="h-full overflow-hidden border-white/5 bg-white/2 backdrop-blur-md">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-zinc-500">
                  <Sparkles className="h-3 w-3" />
                  Synthèse
                </CardDescription>
                <CardTitle className="text-base text-zinc-100">
                  Ce qu&apos;il faut savoir
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 pb-2 pt-0">
                <ul className="divide-y divide-white/5">
                  {insights.map((insight, i) => (
                    <li
                      key={i}
                      className="group flex items-start gap-3 px-3 py-3 transition-colors hover:bg-white/3"
                    >
                      <div
                        className={cn(
                          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                          "bg-white/4 ring-1 ring-inset ring-white/5",
                        )}
                      >
                        <insight.icon className={cn("h-3.5 w-3.5", insight.color)} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium leading-tight text-zinc-100">
                            {insight.title}
                          </p>
                        </div>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-400">
                          {insight.detail}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "shrink-0 border-white/10 bg-white/4 px-1.5 py-0 font-mono text-[10px]",
                          insight.color,
                        )}
                      >
                        {insight.pill}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </section>

        {/* ---------- OPERATIONS CONSOLE ---------- */}
        <section className="grid gap-4 xl:grid-cols-3">
          {/* Queue */}
          <motion.div {...fadeIn(0.4)}>
            <Card className="h-full border-white/5 bg-white/2 backdrop-blur-md">
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div>
                  <CardDescription className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-zinc-500">
                    <PulseDot tone={queueStatus.some((q) => q.tone === "rose") ? "amber" : "emerald"} />
                    File SMTP
                  </CardDescription>
                  <CardTitle className="mt-1 text-base text-zinc-100">
                    État de la file
                  </CardTitle>
                </div>
                <Clock className="h-4 w-4 text-zinc-500" />
              </CardHeader>
              <CardContent className="space-y-4 px-5 pb-5">
                {queueStatus.map((item) => {
                  const pct = Math.min((item.value / item.max) * 100, 100);
                  const bar =
                    item.tone === "emerald"
                      ? "oklch(0.77 0.16 162)"
                      : item.tone === "amber"
                        ? "oklch(0.82 0.16 78)"
                        : item.tone === "rose"
                          ? "oklch(0.72 0.2 16)"
                          : "oklch(0.78 0.16 232)";
                  return (
                    <div key={item.label} className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-1.5 text-xs text-zinc-400">
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: bar }}
                          />
                          {item.label}
                        </span>
                        <span className="font-mono text-xs tabular-nums text-zinc-100">
                          {item.value}
                          {item.suffix ?? ""}
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full transition-[width] duration-700"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: bar,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
                <Separator />
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-zinc-500">Dernière vérif.</span>
                  <span className="flex items-center gap-1.5 text-zinc-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    il y a 30s
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Activity stream */}
          <motion.div {...fadeIn(0.45)} className="xl:col-span-2">
            <Card className="h-full border-white/5 bg-white/2 backdrop-blur-md">
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div>
                  <CardDescription className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-zinc-500">
                    <Activity className="h-3 w-3" />
                    Flux d&apos;événements
                  </CardDescription>
                  <CardTitle className="mt-1 text-base text-zinc-100">
                    Activité récente
                  </CardTitle>
                </div>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-zinc-400 hover:bg-white/4 hover:text-zinc-100"
                >
                  <Link href="/dash/monitoring/events/system">
                    Tout voir
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="px-0 pb-0 pt-0">
                <div className="grid grid-cols-[80px_1fr]">
                  {recentActivity.map((event, i) => {
                    const dot = toneColor[event.tone] ?? toneColor.blue;
                    return (
                      <React.Fragment key={i}>
                        <div className="flex items-start justify-end pr-4 pt-3 font-mono text-[10px] tabular-nums text-zinc-500">
                          {event.time}
                        </div>
                        <div
                          className={cn(
                            "group relative flex items-start gap-3 border-l border-white/5 px-4 py-3 transition-colors hover:bg-white/3",
                            i === 0 && "bg-white/2",
                          )}
                        >
                          <span
                            className={cn(
                              "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ring-4 ring-inset",
                              dot,
                              "bg-current",
                            )}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline gap-2">
                              <p className="text-sm font-medium leading-tight text-zinc-100">
                                {event.message}
                              </p>
                              <span
                                className={cn(
                                  "hidden text-[10px] uppercase tracking-wider sm:inline",
                                  dot,
                                )}
                              >
                                {event.tone === "emerald"
                                  ? "Succès"
                                  : event.tone === "amber"
                                    ? "Alerte"
                                    : "Info"}
                              </span>
                            </div>
                            <p className="mt-0.5 truncate font-mono text-[11px] text-zinc-500">
                              {event.detail}
                            </p>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </section>

        {/* ---------- SERVICES GRID ---------- */}
        <section className="space-y-3">
          <SectionHeader
            eyebrow="Santé système"
            title="État des services"
            description="Latence et disponibilité des composants du serveur mail."
          />
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((service, i) => (
              <motion.div
                key={service.name}
                initial={fadeIn(0.5 + i * 0.03).initial}
                animate={fadeIn(0.5 + i * 0.03).animate}
                transition={fadeIn(0.5 + i * 0.03).transition}
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                className={cn(
                  "group flex items-center justify-between rounded-lg border border-white/5 bg-white/2 px-4 py-3 backdrop-blur-md transition-colors",
                  service.status === "operational"
                    ? "hover:border-emerald-500/20 hover:bg-emerald-500/4"
                    : "hover:border-amber-500/20 hover:bg-amber-500/4",
                )}
              >
                <div className="flex items-center gap-3">
                  <PulseDot
                    tone={service.status === "operational" ? "emerald" : "amber"}
                  />
                  <div>
                    <p className="text-xs font-medium text-zinc-100">
                      {service.name}
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      {service.status === "operational"
                        ? "Opérationnel"
                        : "Performances dégradées"}
                    </p>
                  </div>
                </div>
                <span className="font-mono text-xs tabular-nums text-zinc-400 group-hover:text-zinc-100">
                  {service.latency}
                </span>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ---------- HUB DIRECTORY ---------- */}
        <section className="space-y-3">
          <SectionHeader
            eyebrow="Accès rapide"
            title="Naviguez dans la plateforme"
            description="Les sections les plus utilisées, prêtes en un clic."
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {hubLinks.map((link, i) => (
              <motion.div
                key={link.href}
                initial={fadeIn(0.55 + i * 0.04).initial}
                animate={fadeIn(0.55 + i * 0.04).animate}
                transition={fadeIn(0.55 + i * 0.04).transition}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
              >
                <Link
                  href={link.href}
                  className={cn(
                    "group relative block h-full overflow-hidden rounded-xl border border-white/5 bg-white/2 p-5 backdrop-blur-md",
                    "transition-colors hover:border-white/10 hover:bg-white/4",
                    "focus-visible:border-white/20 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none",
                  )}
                >
                  <div
                    aria-hidden
                    className={cn(
                      "pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-linear-to-br opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-60",
                      link.accent,
                    )}
                  />
                  <div className="relative flex items-start justify-between gap-3">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-xl",
                        "bg-white/4 ring-1 ring-inset ring-white/5",
                        "group-hover:ring-white/10",
                      )}
                    >
                      <link.icon className="h-5 w-5 text-zinc-200 group-hover:text-white" />
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-zinc-600 transition-colors group-hover:text-zinc-200" />
                  </div>
                  <div className="relative mt-4 space-y-1">
                    <h3 className="text-sm font-semibold text-zinc-100">
                      {link.title}
                    </h3>
                    <p className="text-[12px] leading-relaxed text-zinc-500">
                      {link.description}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ---------- TRUST STRIP ---------- */}
        <motion.section
          {...fadeIn(0.8)}
          className="mt-2 overflow-hidden rounded-2xl border border-white/5 bg-linear-to-br from-white/4 via-white/2 to-transparent backdrop-blur-md"
        >
          <div className="grid gap-6 p-6 md:grid-cols-3">
            <TrustCell
              icon={CheckCircle2}
              title="Chiffrement bout en bout"
              detail="TLS 1.3, MTA-STS, DANE — certificats renouvelés automatiquement."
              tone="emerald"
            />
            <TrustCell
              icon={ShieldCheck}
              title="Conformité RGPD"
              detail="Logs conservés 30 jours, chiffrement at-rest, droit à l'oubli."
              tone="violet"
            />
            <TrustCell
              icon={Clock}
              title="SLA 99.95%"
              detail="Surveillance 24/7 et astreinte sur incidents critiques."
              tone="blue"
            />
          </div>
        </motion.section>
      </div>
    </div>
  );
}

// ---------- Helpers (page-level) ----------

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-zinc-500">
        {eyebrow}
      </p>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-100">
          {title}
        </h2>
        <p className="max-w-md text-xs text-zinc-500">{description}</p>
      </div>
    </div>
  );
}

function VitalRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: Tone;
}) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="flex items-center gap-2 text-zinc-400">
        <PulseDot tone={tone} />
        {label}
      </span>
      <span className="font-mono tabular-nums text-zinc-100">{value}</span>
    </div>
  );
}

function LegendChip({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-white/5 bg-white/2 px-2.5 py-1 text-[10px] uppercase tracking-wider text-zinc-400">
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </div>
  );
}

function TrustCell({
  icon: Icon,
  title,
  detail,
  tone,
}: {
  icon: LucideIcon;
  title: string;
  detail: string;
  tone: Tone;
}) {
  return (
    <div className="flex items-start gap-4">
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset",
          "bg-white/4 ring-white/5",
        )}
      >
        <Icon className={cn("h-5 w-5", toneColor[tone])} />
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
        <p className="text-[12px] leading-relaxed text-zinc-400">{detail}</p>
      </div>
    </div>
  );
}

