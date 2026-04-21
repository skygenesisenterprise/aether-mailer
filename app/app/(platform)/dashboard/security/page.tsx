"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Calendar,
  ArrowUpRight,
  Lock,
  Server,
  Users,
  Eye,
  Fingerprint,
  Key,
  Globe,
  Mail,
  Activity,
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

const securityTrafficData = [
  { time: "00:00", blocked: 12, allowed: 340, suspicious: 5 },
  { time: "04:00", blocked: 8, allowed: 210, suspicious: 2 },
  { time: "08:00", blocked: 45, allowed: 890, suspicious: 12 },
  { time: "10:00", blocked: 68, allowed: 1240, suspicious: 8 },
  { time: "12:00", blocked: 52, allowed: 980, suspicious: 6 },
  { time: "14:00", blocked: 75, allowed: 1450, suspicious: 15 },
  { time: "16:00", blocked: 89, allowed: 1680, suspicious: 11 },
  { time: "18:00", blocked: 62, allowed: 1120, suspicious: 7 },
  { time: "20:00", blocked: 38, allowed: 720, suspicious: 4 },
  { time: "22:00", blocked: 18, allowed: 420, suspicious: 3 },
];

const threatLevelData = [
  { day: "Mon", critical: 2, high: 8, medium: 15, low: 28 },
  { day: "Tue", critical: 1, high: 12, medium: 18, low: 32 },
  { day: "Wed", critical: 4, high: 6, medium: 12, low: 25 },
  { day: "Thu", critical: 1, high: 9, medium: 14, low: 30 },
  { day: "Fri", critical: 3, high: 11, medium: 20, low: 35 },
  { day: "Sat", critical: 0, high: 3, medium: 8, low: 15 },
  { day: "Sun", critical: 1, high: 5, medium: 10, low: 22 },
];

const recentAlerts = [
  {
    id: 1,
    type: "intrusion",
    severity: "critical",
    message: "Multiple failed login attempts from IP 192.168.1.105",
    time: "2 min ago",
    source: "Auth Server",
  },
  {
    id: 2,
    type: "malware",
    severity: "high",
    message: "Suspicious attachment detected: invoice.exe",
    time: "15 min ago",
    source: "Mail Filter",
  },
  {
    id: 3,
    type: "phishing",
    severity: "high",
    message: "Phishing campaign detected targeting finance team",
    time: "1h ago",
    source: "DFI Scanner",
  },
  {
    id: 4,
    type: "bruteforce",
    severity: "medium",
    message: "Brute force attack detected on SMTP port",
    time: "3h ago",
    source: "Network Monitor",
  },
  {
    id: 5,
    type: "dns",
    severity: "low",
    message: "Suspicious DNS query pattern detected",
    time: "5h ago",
    source: "DNS Guard",
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
  blocked: { label: "Blocked", color: "oklch(0.6 0.2 20)" },
  allowed: { label: "Allowed", color: "oklch(0.5 0.2 150)" },
  suspicious: { label: "Suspicious", color: "oklch(0.6 0.2 50)" },
};

const threatConfig = {
  critical: { label: "Critical", color: "oklch(0.6 0.2 20)" },
  high: { label: "High", color: "oklch(0.6 0.2 40)" },
  medium: { label: "Medium", color: "oklch(0.6 0.2 80)" },
  low: { label: "Low", color: "oklch(0.5 0.2 200)" },
};

function getSeverityColor(severity: string) {
  switch (severity) {
    case "critical":
      return "bg-red-600/20 text-red-400 border-red-600/30";
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
    case "intrusion":
      return Fingerprint;
    case "malware":
      return Shield;
    case "phishing":
      return Mail;
    case "bruteforce":
      return Key;
    case "dns":
      return Globe;
    default:
      return Activity;
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

export default function SecurityPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("24h");
  const [securityStats, setSecurityStats] = useState({
    threatsBlocked: 4823,
    suspiciousBlocked: 12847,
    failedLogins: 89,
    activeThreats: 42,
    compliance: 98.2,
    spamBlocked: 234,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setSecurityStats((prev) => ({
        ...prev,
        threatsBlocked: prev.threatsBlocked + Math.floor(Math.random() * 3),
        suspiciousBlocked: prev.suspiciousBlocked + Math.floor(Math.random() * 5),
        activeThreats: Math.max(0, prev.activeThreats + Math.floor(Math.random() * 3) - 1),
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
          <h1 className="text-2xl font-bold text-foreground">Security</h1>
          <p className="text-sm text-muted-foreground">
            Security monitoring and threat protection
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
          title="Threats blocked"
          value={securityStats.threatsBlocked.toLocaleString()}
          change="+12%"
          changeType="positive"
          description="vs yesterday"
          icon={Shield}
        />
        <StatsCard
          title="Suspicious blocked"
          value={securityStats.suspiciousBlocked.toLocaleString()}
          change="+8%"
          changeType="positive"
          description="vs yesterday"
          icon={Eye}
        />
        <StatsCard
          title="Compliance rate"
          value={`${securityStats.compliance}%`}
          change="+0.3%"
          changeType="positive"
          description="vs yesterday"
          icon={CheckCircle}
        />
        <StatsCard
          title="Failed logins"
          value={securityStats.failedLogins.toString()}
          change="-15%"
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
                <CardTitle className="text-base">Security traffic</CardTitle>
                <CardDescription>Threats blocked and allowed</CardDescription>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[oklch(0.6 0.2 20)]" />
                  <span className="text-muted-foreground">Blocked</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[oklch(0.5 0.2 150)]" />
                  <span className="text-muted-foreground">Allowed</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-72 w-full min-h-70">
              <AreaChart data={securityTrafficData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillBlocked" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-blocked)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-blocked)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fillAllowed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-allowed)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-allowed)" stopOpacity={0} />
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
                  dataKey="allowed"
                  stroke="var(--color-allowed)"
                  strokeWidth={2}
                  fill="url(#fillAllowed)"
                />
                <Area
                  type="monotone"
                  dataKey="blocked"
                  stroke="var(--color-blocked)"
                  strokeWidth={2}
                  fill="url(#fillBlocked)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Security alerts</CardTitle>
                <CardDescription>Latest threats detected</CardDescription>
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
            <div className="divide-y divide-border max-h-80 overflow-y-auto">
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
                <CardTitle className="text-base">Threat level</CardTitle>
                <CardDescription>Threats by severity</CardDescription>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[oklch(0.6 0.2 20)]" />
                  <span className="text-muted-foreground">Critical</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[oklch(0.6 0.2 40)]" />
                  <span className="text-muted-foreground">High</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={threatConfig} className="h-64 w-full min-h-60">
              <BarChart data={threatLevelData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="critical" stackId="a" fill="var(--color-critical)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="high" stackId="a" fill="var(--color-high)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="medium" stackId="a" fill="var(--color-medium)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="low" stackId="a" fill="var(--color-low)" radius={[0, 0, 4, 4]} />
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
                <CardDescription>Email authentication by domain</CardDescription>
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
              <CardDescription>Security overview</CardDescription>
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
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm">Spam blocked</span>
                </div>
                <span className="text-sm font-medium">{securityStats.spamBlocked}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm">Active threats</span>
                </div>
                <span className="text-sm font-medium">{securityStats.activeThreats}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <Server className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm">Protected domains</span>
                </div>
                <span className="text-sm font-medium">24</span>
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