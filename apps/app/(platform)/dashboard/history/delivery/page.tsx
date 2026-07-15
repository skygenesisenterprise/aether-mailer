"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Mail,
  Send,
  Clock,
  Activity,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Calendar,
  ArrowUpRight,
  Lock,
  Server,
  Truck,
  Target,
  Route,
  Eye,
  MoreHorizontal,
  Filter,
  Search,
  User,
  MailCheck,
  Download,
  ArrowUp,
  Package,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/admin/stats-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const deliveryTimelineData = [
  { time: "00:00", sent: 120, delivered: 118, failed: 2 },
  { time: "04:00", sent: 80, delivered: 79, failed: 1 },
  { time: "08:00", sent: 450, delivered: 442, failed: 8 },
  { time: "10:00", sent: 680, delivered: 668, failed: 12 },
  { time: "12:00", sent: 520, delivered: 512, failed: 8 },
  { time: "14:00", sent: 750, delivered: 735, failed: 15 },
  { time: "16:00", sent: 890, delivered: 875, failed: 15 },
  { time: "18:00", sent: 620, delivered: 610, failed: 10 },
  { time: "20:00", sent: 380, delivered: 375, failed: 5 },
  { time: "22:00", sent: 180, delivered: 178, failed: 2 },
];

const deliveryEvents = [
  {
    id: 1,
    messageId: "msg-2024-001",
    from: "john.doe@company.com",
    to: "client@external.com",
    subject: "Monthly Report - Q4 Performance",
    status: "delivered",
    server: "smtp-primary-01",
    route: "direct",
    time: "2 min ago",
    deliveryTime: "1.2s",
    size: "2.3 MB",
    attempts: 1,
  },
  {
    id: 2,
    messageId: "msg-2024-002",
    from: "newsletter@techblog.com",
    to: "subscribers@lists.com",
    subject: "Weekly Newsletter - Tech News",
    status: "delivered",
    server: "smtp-secondary-02",
    route: "relay",
    time: "15 min ago",
    deliveryTime: "3.8s",
    size: "156 KB",
    attempts: 1,
  },
  {
    id: 3,
    messageId: "msg-2024-003",
    from: "support@client.com",
    to: "help@external.com",
    subject: "Support Ticket #12345 - Resolved",
    status: "failed",
    server: "smtp-primary-01",
    route: "direct",
    time: "1h ago",
    deliveryTime: "N/A",
    size: "45 KB",
    attempts: 3,
    error: "Connection timeout",
  },
  {
    id: 4,
    messageId: "msg-2024-004",
    from: "system@aether-mailer.com",
    to: "admin@partner.com",
    subject: "Security Alert - Update Required",
    status: "delivered",
    server: "smtp-backup-03",
    route: "fallback",
    time: "2h ago",
    deliveryTime: "5.1s",
    size: "89 KB",
    attempts: 2,
  },
  {
    id: 5,
    messageId: "msg-2024-005",
    from: "billing@company.com",
    to: "customers@domain.com",
    subject: "Invoice #F2024-001 - Due 30 days",
    status: "pending",
    server: "smtp-primary-01",
    route: "direct",
    time: "3h ago",
    deliveryTime: "In progress",
    size: "234 KB",
    attempts: 1,
  },
];

const serverStatus = [
  { name: "smtp-primary-01", status: "active", load: 87 },
  { name: "smtp-secondary-02", status: "active", load: 65 },
  { name: "smtp-backup-03", status: "standby", load: 0 },
];

const routeStats = [
  { route: "Direct", usage: 67, color: "text-blue-500" },
  { route: "Relay", usage: 23, color: "text-purple-500" },
  { route: "Fallback", usage: 10, color: "text-orange-500" },
];

const networkStats = [
  { metric: "Bandwidth", value: "1.2 Gbps", status: "good" },
  { metric: "Latency", value: "12ms", status: "good" },
  { metric: "Packet Loss", value: "0.01%", status: "good" },
];

const chartConfig = {
  sent: { label: "Sent", color: "oklch(0.6 0.2 250)" },
  delivered: { label: "Delivered", color: "oklch(0.5 0.2 150)" },
  failed: { label: "Failed", color: "oklch(0.6 0.2 20)" },
};

function getStatusIcon(status: string) {
  switch (status) {
    case "delivered":
      return <MailCheck className="h-4 w-4 text-green-400" />;
    case "failed":
      return <XCircle className="h-4 w-4 text-red-400" />;
    case "pending":
      return <Clock className="h-4 w-4 text-yellow-400" />;
    case "deferred":
      return <AlertTriangle className="h-4 w-4 text-orange-400" />;
    default:
      return <Mail className="h-4 w-4 text-slate-400" />;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "delivered":
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Delivered</Badge>;
    case "failed":
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Failed</Badge>;
    case "pending":
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pending</Badge>;
    case "deferred":
      return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Deferred</Badge>;
    default:
      return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">Unknown</Badge>;
  }
}

function getRouteIcon(route: string) {
  switch (route) {
    case "direct":
      return <Route className="h-3 w-3 text-blue-400" />;
    case "relay":
      return <Route className="h-3 w-3 text-purple-400" />;
    case "fallback":
      return <Route className="h-3 w-3 text-orange-400" />;
    default:
      return <Route className="h-3 w-3 text-slate-400" />;
  }
}

export default function DeliveryPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("24h");
  const [deliveryStats, setDeliveryStats] = useState({
    totalSent: 4823,
    delivered: 4623,
    failed: 89,
    pending: 42,
    successRate: 98.2,
    avgDeliveryTime: 2.3,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setDeliveryStats((prev) => ({
        ...prev,
        totalSent: prev.totalSent + Math.floor(Math.random() * 3),
        delivered: prev.delivered + Math.floor(Math.random() * 3),
        pending: Math.max(0, prev.pending + Math.floor(Math.random() * 3) - 1),
      }));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1500);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Delivery</h1>
          <p className="text-sm text-muted-foreground">
            Monitor and analyze email delivery performance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-36">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last hour</SelectItem>
              <SelectItem value="24h">24 hours</SelectItem>
              <SelectItem value="7j">7 days</SelectItem>
              <SelectItem value="30j">30 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Emails delivered"
          value={deliveryStats.delivered.toLocaleString()}
          change="+12%"
          changeType="positive"
          description="vs yesterday"
          icon={CheckCircle}
        />
        <StatsCard
          title="Emails sent"
          value={deliveryStats.totalSent.toLocaleString()}
          change="+8%"
          changeType="positive"
          description="vs yesterday"
          icon={Send}
        />
        <StatsCard
          title="Success rate"
          value={`${deliveryStats.successRate}%`}
          change="+0.3%"
          changeType="positive"
          description="vs yesterday"
          icon={Target}
        />
        <StatsCard
          title="Failed emails"
          value={deliveryStats.failed.toString()}
          change="-5%"
          changeType="positive"
          description="vs yesterday"
          icon={XCircle}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Delivery timeline</CardTitle>
                <CardDescription>Sent and delivered emails per hour</CardDescription>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[oklch(0.6 0.2 250)]" />
                  <span className="text-muted-foreground">Sent</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[oklch(0.5 0.2 150)]" />
                  <span className="text-muted-foreground">Delivered</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-72 w-full min-h-70">
              <AreaChart data={deliveryTimelineData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillSent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-sent)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-sent)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fillDelivered" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-delivered)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-delivered)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="time"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="delivered"
                  stroke="var(--color-delivered)"
                  strokeWidth={2}
                  fill="url(#fillDelivered)"
                />
                <Area
                  type="monotone"
                  dataKey="sent"
                  stroke="var(--color-sent)"
                  strokeWidth={2}
                  fill="url(#fillSent)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Pending emails</CardTitle>
                <CardDescription>In queue</CardDescription>
              </div>
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                {deliveryStats.pending} pending
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Queued</span>
              <span className="text-sm font-medium">{deliveryStats.pending}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Avg delivery time</span>
              <span className="text-sm font-medium">{deliveryStats.avgDeliveryTime}s</span>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-4" asChild>
              <Link href="/dashboard/queues/messages">
                View queue <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">SMTP Servers</CardTitle>
                <CardDescription>Server status</CardDescription>
              </div>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">3 Active</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {serverStatus.map((server) => (
              <div key={server.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{server.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${server.status === "active" ? "bg-green-500 animate-pulse" : "bg-yellow-500"}`} />
                  <span className="text-xs text-muted-foreground capitalize">{server.status}</span>
                </div>
              </div>
            ))}
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-purple-500 h-2 rounded-full" style={{ width: "87%" }} />
            </div>
            <div className="text-xs text-purple-400">Avg load: 87%</div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Delivery routes</CardTitle>
                <CardDescription>Route usage</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {routeStats.map((item) => (
              <div key={item.route} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{item.route}</span>
                <span className={`text-sm font-medium ${item.color}`}>{item.usage}%</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Network</CardTitle>
                <CardDescription>Connection quality</CardDescription>
              </div>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Stable</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {networkStats.map((item) => (
              <div key={item.metric} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{item.metric}</span>
                <span className="text-sm font-medium text-green-500">{item.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent delivery events</CardTitle>
              <CardDescription>Latest emails with delivery details</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button variant="ghost" size="sm">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {deliveryEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-muted rounded-lg">{getStatusIcon(event.status)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium truncate">{event.subject}</p>
                      {getStatusBadge(event.status)}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {event.from}
                      </span>
                      <span className="flex items-center gap-1">
                        <ArrowUp className="h-3 w-3" />
                        {event.to}
                      </span>
                      <span className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        {event.size}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Server className="h-3 w-3" />
                        {event.server}
                      </span>
                      <span className="flex items-center gap-1">
                        {getRouteIcon(event.route)}
                        {event.route}
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        {event.deliveryTime}
                      </span>
                    </div>
                    {event.error && (
                      <div className="mt-1 text-xs text-red-500">Error: {event.error}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">{event.time}</div>
                    <div className="text-xs text-muted-foreground">ID: {event.messageId}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-8 w-8">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
          <Link href="/dashboard">
            <Activity className="h-5 w-5" />
            <span className="text-sm">Dashboard</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
          <Link href="/dashboard/overview">
            <Truck className="h-5 w-5" />
            <span className="text-sm">Overview</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
          <Link href="/dashboard/reports/dmarc">
            <Shield className="h-5 w-5" />
            <span className="text-sm">DMARC Report</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
          <Link href="/dashboard/reports/tls">
            <Lock className="h-5 w-5" />
            <span className="text-sm">TLS Report</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}