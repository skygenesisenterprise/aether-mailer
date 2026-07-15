"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Mail,
  Send,
  Inbox,
  Clock,
  Activity,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Calendar,
  ArrowUpRight,
  Bell,
  Lock,
  FileText,
  Server,
  Database,
  Users,
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
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const emailTrafficData = [
  { time: "00:00", sent: 120, received: 340, failed: 5 },
  { time: "04:00", sent: 80, received: 210, failed: 2 },
  { time: "08:00", sent: 450, received: 890, failed: 12 },
  { time: "10:00", sent: 680, received: 1240, failed: 8 },
  { time: "12:00", sent: 520, received: 980, failed: 6 },
  { time: "14:00", sent: 750, received: 1450, failed: 15 },
  { time: "16:00", sent: 890, received: 1680, failed: 11 },
  { time: "18:00", sent: 620, received: 1120, failed: 7 },
  { time: "20:00", sent: 380, received: 720, failed: 4 },
  { time: "22:00", sent: 180, received: 420, failed: 3 },
];

const deliveryRateData = [
  { day: "Mon", success: 98.2, failed: 1.8 },
  { day: "Tue", success: 97.8, failed: 2.2 },
  { day: "Wed", success: 99.1, failed: 0.9 },
  { day: "Thu", success: 98.5, failed: 1.5 },
  { day: "Fri", success: 97.2, failed: 2.8 },
  { day: "Sat", success: 99.4, failed: 0.6 },
  { day: "Sun", success: 98.9, failed: 1.1 },
];

const recentAlerts = [
  {
    id: 1,
    type: "security",
    severity: "high",
    message: "Suspicious login attempt detected",
    time: "5 min ago",
    domain: "mail.example.com",
  },
  {
    id: 2,
    type: "delivery",
    severity: "medium",
    message: "High bounce rate for domain.com",
    time: "1h ago",
    domain: "domain.com",
  },
  {
    id: 3,
    type: "system",
    severity: "low",
    message: "Update available: v2.4.1",
    time: "3h ago",
    domain: "System",
  },
  {
    id: 4,
    type: "dmarc",
    severity: "medium",
    message: "DMARC failure detected",
    time: "5h ago",
    domain: "client.net",
  },
];

const dmarcSummary = [
  { domain: "example.com", pass: 985, fail: 15, quarantine: 0 },
  { domain: "company.org", pass: 1240, fail: 8, quarantine: 2 },
  { domain: "business.net", pass: 856, fail: 42, quarantine: 8 },
];

const tlsSummary = [
  { protocol: "TLS 1.3", usage: 72, status: "good" },
  { protocol: "TLS 1.2", usage: 25, status: "ok" },
  { protocol: "TLS 1.1", usage: 3, status: "warning" },
];

const chartConfig = {
  sent: { label: "Sent", color: "oklch(0.6 0.2 250)" },
  received: { label: "Received", color: "oklch(0.5 0.2 150)" },
  failed: { label: "Failed", color: "oklch(0.6 0.2 20)" },
};

const deliveryConfig = {
  success: { label: "Success", color: "oklch(0.6 0.2 150)" },
  failed: { label: "Failed", color: "oklch(0.6 0.2 20)" },
};

function getSeverityColor(severity: string) {
  switch (severity) {
    case "high":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    case "medium":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    case "low":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    default:
      return "bg-slate-500/20 text-slate-400 border-slate-500/30";
  }
}

function getAlertIcon(type: string) {
  switch (type) {
    case "security":
      return Shield;
    case "delivery":
      return Mail;
    case "dmarc":
      return FileText;
    case "system":
      return Server;
    default:
      return Bell;
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "good":
      return "text-green-500";
    case "ok":
      return "text-blue-500";
    case "warning":
      return "text-yellow-500";
    case "error":
      return "text-red-500";
    default:
      return "text-slate-500";
  }
}

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("24h");
  const [emailStats, setEmailStats] = useState({
    sent: 4823,
    received: 12847,
    failed: 89,
    pending: 42,
    delivered: 98.2,
    spamBlocked: 234,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setEmailStats((prev) => ({
        ...prev,
        sent: prev.sent + Math.floor(Math.random() * 3),
        received: prev.received + Math.floor(Math.random() * 5),
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
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Real-time monitoring of your email infrastructure
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
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Emails sent"
          value={emailStats.sent.toLocaleString()}
          change="+12%"
          changeType="positive"
          description="vs yesterday"
          icon={Send}
        />
        <StatsCard
          title="Emails received"
          value={emailStats.received.toLocaleString()}
          change="+8%"
          changeType="positive"
          description="vs yesterday"
          icon={Inbox}
        />
        <StatsCard
          title="Delivery rate"
          value={`${emailStats.delivered}%`}
          change="+0.3%"
          changeType="positive"
          description="vs yesterday"
          icon={CheckCircle}
        />
        <StatsCard
          title="Failed emails"
          value={emailStats.failed.toString()}
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
                <CardTitle className="text-base">Email traffic</CardTitle>
                <CardDescription>Sent and received emails per hour</CardDescription>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[oklch(0.6 0.2 250)]" />
                  <span className="text-muted-foreground">Sent</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[oklch(0.5 0.2 150)]" />
                  <span className="text-muted-foreground">Received</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-72 w-full min-h-70">
              <AreaChart data={emailTrafficData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillSent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-sent)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-sent)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fillReceived" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-received)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-received)" stopOpacity={0} />
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
                  dataKey="received"
                  stroke="var(--color-received)"
                  strokeWidth={2}
                  fill="url(#fillReceived)"
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
                <CardTitle className="text-base">Recent alerts</CardTitle>
                <CardDescription>Latest notifications</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/notifications" className="gap-1">
                  View all
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {recentAlerts.map((alert) => {
                const AlertIcon = getAlertIcon(alert.type);
                return (
                  <div key={alert.id} className="flex items-center gap-3 px-6 py-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      <AlertIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{alert.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-normal ${getSeverityColor(alert.severity)}`}>
                          {alert.severity}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{alert.time}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Delivery rate</CardTitle>
                <CardDescription>Percentage by day</CardDescription>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[oklch(0.5 0.2 150)]" />
                  <span className="text-muted-foreground">Success</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[oklch(0.6 0.2 20)]" />
                  <span className="text-muted-foreground">Failed</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={deliveryConfig} className="h-64 w-full min-h-60">
              <BarChart data={deliveryRateData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                  tickFormatter={(value) => `${value}%`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="success" stackId="a" fill="var(--color-success)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="failed" stackId="a" fill="var(--color-failed)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">TLS Security</CardTitle>
                <CardDescription>Protocol usage</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/reports/tls" className="gap-1">
                  Details
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tlsSummary.map((item) => (
                <div key={item.protocol} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Lock className={`h-4 w-4 ${getStatusColor(item.status)}`} />
                    <span className="text-sm font-medium">{item.protocol}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${getStatusColor(item.status)} bg-current`}
                        style={{ width: `${item.usage}%` }}
                      />
                    </div>
                    <span className="text-sm w-10 text-right">{item.usage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">DMARC Summary</CardTitle>
                <CardDescription>Compliance statistics by domain</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/reports/dmarc" className="gap-1">
                  View report
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dmarcSummary.map((item) => (
                <div key={item.domain} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20">
                      <Shield className="h-4 w-4 text-green-500" />
                    </div>
                    <span className="text-sm font-medium">{item.domain}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                      <span className="text-green-500">{item.pass}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <XCircle className="h-3.5 w-3.5 text-red-500" />
                      <span className="text-red-500">{item.fail}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />
                      <span className="text-yellow-500">{item.quarantine}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <div>
              <CardTitle className="text-base">Quick stats</CardTitle>
              <CardDescription>System overview</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm">Active accounts</span>
                </div>
                <span className="text-sm font-medium">1,247</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <Database className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm">Storage used</span>
                </div>
                <span className="text-sm font-medium">67%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm">Spam blocked</span>
                </div>
                <span className="text-sm font-medium">{emailStats.spamBlocked}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm">Pending emails</span>
                </div>
                <span className="text-sm font-medium">{emailStats.pending}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
          <Link href="/dashboard/overview">
            <Activity className="h-5 w-5" />
            <span className="text-sm">Overview</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
          <Link href="/dashboard/delivery">
            <Mail className="h-5 w-5" />
            <span className="text-sm">Delivery</span>
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
