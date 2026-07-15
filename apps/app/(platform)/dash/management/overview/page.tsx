"use client";

import * as React from "react";
import {
  Users,
  Globe,
  Mail,
  Inbox,
  Send,
  HardDrive,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Server,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";

const statsCards = [
  {
    title: "Comptes",
    value: "1 247",
    change: "+3.2%",
    trend: "up" as const,
    description: "vs mois dernier",
    icon: Users,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    title: "Domaines",
    value: "18",
    change: "+2",
    trend: "up" as const,
    description: "ce mois-ci",
    icon: Globe,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  {
    title: "Messages reçus",
    value: "284K",
    change: "+12.5%",
    trend: "up" as const,
    description: "vs mois dernier",
    icon: Inbox,
    color: "text-violet-500",
    bgColor: "bg-violet-500/10",
  },
  {
    title: "Messages envoyés",
    value: "196K",
    change: "+8.1%",
    trend: "up" as const,
    description: "vs mois dernier",
    icon: Send,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    title: "Sessions actives",
    value: "89",
    change: "-2.4%",
    trend: "down" as const,
    description: "vs heure précédente",
    icon: Activity,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  {
    title: "Stockage utilisé",
    value: "2,4 To",
    change: "+180 Go",
    trend: "up" as const,
    description: "ce mois-ci",
    icon: HardDrive,
    color: "text-rose-500",
    bgColor: "bg-rose-500/10",
  },
];

const messageTrafficData = [
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

const domainMessageData = [
  { domain: "aether.io", sent: 42300, received: 58100 },
  { domain: "acme.com", sent: 28100, received: 31200 },
  { domain: "globex.fr", sent: 18900, received: 22400 },
  { domain: "initech.org", sent: 14200, received: 16800 },
  { domain: "wayne.co", sent: 9800, received: 11200 },
];

const recentActivity = [
  {
    type: "success",
    icon: ShieldCheck,
    color: "text-emerald-500",
    message: "Authentification réussie",
    detail: "john@aether.io — IMAP depuis 192.168.1.42",
    time: "Il y a 2 min",
  },
  {
    type: "warning",
    icon: AlertTriangle,
    color: "text-amber-500",
    message: "Tentative de connexion suspecte",
    detail: "5 échecs depuis 83.12.45.102 — Port SMTP",
    time: "Il y a 8 min",
  },
  {
    type: "info",
    icon: Mail,
    color: "text-blue-500",
    message: "File d'attente SMTP purgée",
    detail: "23 messages expirés nettoyés automatiquement",
    time: "Il y a 15 min",
  },
  {
    type: "success",
    icon: Server,
    color: "text-emerald-500",
    message: "Certificat TLS renouvelé",
    detail: "mail.aether.io — ACME Let's Encrypt",
    time: "Il y a 1h",
  },
  {
    type: "info",
    icon: Users,
    color: "text-blue-500",
    message: "Nouveau compte créé",
    detail: "marie.dupont@globex.fr — Quota 5 Go",
    time: "Il y a 2h",
  },
  {
    type: "warning",
    icon: HardDrive,
    color: "text-amber-500",
    message: "Seuil de stockage atteint",
    detail: "tenant 'acme' — 85% de la quota utilisée",
    time: "Il y a 3h",
  },
];

const queueStatus = [
  { label: "En attente", value: 342, color: "bg-blue-500" },
  { label: "En cours", value: 89, color: "bg-amber-500" },
  { label: "Échoués", value: 12, color: "bg-red-500" },
  { label: "Réussis (24h)", value: 196400, color: "bg-emerald-500" },
];

const trafficChartConfig = {
  incoming: {
    label: "Reçus",
    color: "oklch(0.65 0.19 260)",
  },
  outgoing: {
    label: "Envoyés",
    color: "oklch(0.65 0.15 160)",
  },
} satisfies ChartConfig;

const domainChartConfig = {
  sent: {
    label: "Envoyés",
    color: "oklch(0.65 0.15 160)",
  },
  received: {
    label: "Reçus",
    color: "oklch(0.65 0.19 260)",
  },
} satisfies ChartConfig;

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toString();
}

export default function ManagementOverviewPage() {
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  return (
    <div className="min-h-full p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              Gestion du serveur
            </h1>
            <Badge variant="secondary" className="text-xs">
              <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Opérationnel
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Vue d&apos;ensemble des comptes, domaines et ressources
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
          />
          Actualiser
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statsCards.map((stat) => (
          <Card key={stat.title} className="py-4">
            <CardContent className="px-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  {stat.title}
                </span>
                <div className={`rounded-md p-1.5 ${stat.bgColor}`}>
                  <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold tracking-tight">
                  {stat.value}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-1 text-xs">
                {stat.trend === "up" ? (
                  <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-red-500" />
                )}
                <span
                  className={
                    stat.trend === "up" ? "text-emerald-500" : "text-red-500"
                  }
                >
                  {stat.change}
                </span>
                <span className="text-muted-foreground">
                  {stat.description}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Message Traffic Chart */}
        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">
                  Trafic de messagerie
                </CardTitle>
                <CardDescription>
                  Messages entrants et sortants — dernières 24h
                </CardDescription>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[oklch(0.65_0.19_260)]" />
                  <span className="text-muted-foreground">Reçus</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[oklch(0.65_0.15_160)]" />
                  <span className="text-muted-foreground">Envoyés</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={trafficChartConfig}
              className="h-72 w-full"
            >
              <AreaChart
                data={messageTrafficData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="fillIncoming" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-incoming)"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-incoming)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                  <linearGradient id="fillOutgoing" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-outgoing)"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-outgoing)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--border)"
                />
                <XAxis
                  dataKey="hour"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="incoming"
                  stroke="var(--color-incoming)"
                  strokeWidth={2}
                  fill="url(#fillIncoming)"
                />
                <Area
                  type="monotone"
                  dataKey="outgoing"
                  stroke="var(--color-outgoing)"
                  strokeWidth={2}
                  fill="url(#fillOutgoing)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Domain Breakdown */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Par domaine</CardTitle>
            <CardDescription>Messages par domaine — ce mois</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={domainChartConfig}
              className="h-72 w-full"
            >
              <BarChart
                data={domainMessageData}
                layout="vertical"
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="var(--border)"
                />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <YAxis
                  type="category"
                  dataKey="domain"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                  width={80}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="received"
                  stackId="a"
                  fill="var(--color-received)"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="sent"
                  stackId="a"
                  fill="var(--color-sent)"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Queue Status + Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Queue Status */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">
                  File d&apos;attente SMTP
                </CardTitle>
                <CardDescription>État actuel</CardDescription>
              </div>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {queueStatus.map((item) => (
              <div key={item.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium font-mono tabular-nums">
                    {formatNumber(item.value)}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${item.color}`}
                    style={{
                      width: `${Math.min((item.value / 196400) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
            <Separator />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Dernière vérification</span>
              <span>Il y a 30 secondes</span>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">
                  Activité récente
                </CardTitle>
                <CardDescription>
                  Événements et alertes du serveur
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="gap-1">
                Tout voir
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {recentActivity.map((event, i) => (
                <div key={i} className="flex items-start gap-3 px-6 py-3">
                  <div className="mt-0.5">
                    <event.icon className={`h-4 w-4 ${event.color}`} />
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium leading-none">
                        {event.message}
                      </p>
                      <Badge
                        variant={event.type === "warning" ? "destructive" : event.type === "success" ? "secondary" : "outline"}
                        className="text-[10px] px-1.5 py-0 font-normal"
                      >
                        {event.type === "warning" ? "Alerte" : event.type === "success" ? "Succès" : "Info"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {event.detail}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {event.time}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="py-4">
          <CardContent className="px-4">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-emerald-500/10 p-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Taux de délivrance
                </p>
                <p className="text-lg font-bold">99.7%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="px-4">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-blue-500/10 p-2">
                <ShieldCheck className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Spam filtré (24h)
                </p>
                <p className="text-lg font-bold">4 218</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="px-4">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-violet-500/10 p-2">
                <Globe className="h-4 w-4 text-violet-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Connexions IMAP
                </p>
                <p className="text-lg font-bold">234</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="px-4">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-amber-500/10 p-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Bounces hard (24h)
                </p>
                <p className="text-lg font-bold">67</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
