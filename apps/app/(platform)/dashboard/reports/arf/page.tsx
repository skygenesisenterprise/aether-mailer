"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Calendar,
  ArrowUpRight,
  Shield,
  Server,
  Globe,
  Clock,
  TrendingUp,
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
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const arfTrendData = [
  { date: "Jan 1", abuse: 12, auth: 8, fraud: 3, other: 2 },
  { date: "Jan 2", abuse: 15, auth: 12, fraud: 5, other: 3 },
  { date: "Jan 3", abuse: 8, auth: 6, fraud: 2, other: 1 },
  { date: "Jan 4", abuse: 22, auth: 15, fraud: 4, other: 6 },
  { date: "Jan 5", abuse: 18, auth: 10, fraud: 3, other: 5 },
  { date: "Jan 6", abuse: 25, auth: 18, fraud: 6, other: 4 },
  { date: "Jan 7", abuse: 20, auth: 14, fraud: 4, other: 3 },
];

const feedbackData = [
  { type: "abuse", count: 145, description: "Spam or abusive behavior", color: "oklch(0.6 0.2 20)" },
  { type: "auth-failure", count: 89, description: "Authentication failure", color: "oklch(0.6 0.2 280)" },
  { type: "fraud", count: 42, description: "Fraud or phishing", color: "oklch(0.6 0.2 40)" },
  { type: "virus", count: 28, description: "Malware or virus", color: "oklch(0.6 0.2 20)" },
];

const sourceData = [
  { domain: "suspicious-sender.net", reports: 45, type: "abuse", lastReport: "2h ago" },
  { domain: "fake-company.com", reports: 32, type: "fraud", lastReport: "5h ago" },
  { domain: "dark-net.io", reports: 28, type: "virus", lastReport: "1d ago" },
  { domain: "phishing-test.net", reports: 18, type: "auth-failure", lastReport: "3h ago" },
  { domain: "spam-source.org", reports: 15, type: "abuse", lastReport: "6h ago" },
];

const dispositionData = [
  { action: "quarantine", count: 145, percentage: 52 },
  { action: "reject", count: 98, percentage: 35 },
  { action: "soft bounce", count: 28, percentage: 10 },
  { action: "accept", count: 8, percentage: 3 },
];

const chartConfig = {
  abuse: { label: "Abuse", color: "oklch(0.6 0.2 20)" },
  auth: { label: "Auth Failure", color: "oklch(0.6 0.2 280)" },
  fraud: { label: "Fraud", color: "oklch(0.6 0.2 40)" },
  other: { label: "Other", color: "oklch(0.6 0.2 250)" },
};

function getReportTypeColor(type: string) {
  switch (type) {
    case "abuse":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    case "fraud":
      return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    case "virus":
      return "bg-purple-500/20 text-purple-400 border-purple-500/30";
    case "auth-failure":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    default:
      return "bg-slate-500/20 text-slate-400 border-slate-500/30";
  }
}

function getSeverityIcon(type: string) {
  switch (type) {
    case "abuse":
      return AlertTriangle;
    case "fraud":
      return XCircle;
    case "virus":
      return XCircle;
    case "auth-failure":
      return XCircle;
    default:
      return FileText;
  }
}

export default function ReportsArfPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("7j");
  const [arfStats, setArfStats] = useState({
    totalReports: 48234,
    abuseReports: 145,
    fraudReports: 42,
    virusReports: 28,
    authFailures: 89,
    sourcesMonitored: 156,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setArfStats((prev) => ({
        ...prev,
        totalReports: prev.totalReports + Math.floor(Math.random() * 5),
        abuseReports: Math.max(0, prev.abuseReports + Math.floor(Math.random() * 2) - 1),
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
          <h1 className="text-2xl font-bold text-foreground">ARF Reports</h1>
          <p className="text-sm text-muted-foreground">
            Abuse Feedback Reporting for spam and abuse notifications
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-36">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7j">7 days</SelectItem>
              <SelectItem value="30j">30 days</SelectItem>
              <SelectItem value="90j">90 days</SelectItem>
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatsCard
          title="Total reports"
          value={arfStats.totalReports.toLocaleString()}
          change="+8%"
          changeType="positive"
          description="vs last period"
          icon={FileText}
        />
        <StatsCard
          title="Abuse reports"
          value={arfStats.abuseReports.toString()}
          change="+12"
          changeType="negative"
          description="vs last period"
          icon={AlertTriangle}
        />
        <StatsCard
          title="Fraud reports"
          value={arfStats.fraudReports.toString()}
          change="+5"
          changeType="negative"
          description="vs last period"
          icon={XCircle}
        />
        <StatsCard
          title="Virus reports"
          value={arfStats.virusReports.toString()}
          change="-3"
          changeType="positive"
          description="vs last period"
          icon={XCircle}
        />
        <StatsCard
          title="Sources"
          value={arfStats.sourcesMonitored.toString()}
          change="+15"
          changeType="positive"
          description="new sources"
          icon={Globe}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">ARF trend</CardTitle>
                <CardDescription>Feedback reports over time</CardDescription>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[oklch(0.6 0.2 20)]" />
                  <span className="text-muted-foreground">Abuse</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[oklch(0.6 0.2 280)]" />
                  <span className="text-muted-foreground">Auth</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[oklch(0.6 0.2 40)]" />
                  <span className="text-muted-foreground">Fraud</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-72 w-full min-h-70">
              <AreaChart data={arfTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillAbuse" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-abuse)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-abuse)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fillAuth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-auth)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-auth)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fillFraud" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-fraud)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-fraud)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="date"
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
                  dataKey="abuse"
                  stroke="var(--color-abuse)"
                  strokeWidth={2}
                  fill="url(#fillAbuse)"
                />
                <Area
                  type="monotone"
                  dataKey="auth"
                  stroke="var(--color-auth)"
                  strokeWidth={2}
                  fill="url(#fillAuth)"
                />
                <Area
                  type="monotone"
                  dataKey="fraud"
                  stroke="var(--color-fraud)"
                  strokeWidth={2}
                  fill="url(#fillFraud)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Feedback breakdown</CardTitle>
                <CardDescription>Reports by type</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {feedbackData.map((item) => (
                <div key={item.type} className="p-3 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm font-medium capitalize">
                        {item.type.replace("-", " ")}
                      </span>
                    </div>
                    <Badge variant="outline" className={`text-xs ${getReportTypeColor(item.type)}`}>
                      {item.count}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
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
                <CardTitle className="text-base">Top abuse sources</CardTitle>
                <CardDescription>Domains with most reports</CardDescription>
              </div>
              <Button variant="ghost" size="sm">
                View all
                <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sourceData.map((source) => {
                const SeverityIcon = getSeverityIcon(source.type);
                return (
                  <div key={source.domain} className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div className="flex items-center gap-3">
                      <SeverityIcon
                        className={`h-4 w-4 ${
                          source.type === "abuse"
                            ? "text-red-500"
                            : source.type === "fraud"
                            ? "text-orange-500"
                            : source.type === "virus"
                            ? "text-purple-500"
                            : "text-yellow-500"
                        }`}
                      />
                      <div>
                        <span className="text-sm font-medium">{source.domain}</span>
                        <p className="text-xs text-muted-foreground">Last report: {source.lastReport}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={`text-xs ${getReportTypeColor(source.type)}`}>
                        {source.type}
                      </Badge>
                      <span className="text-sm font-medium">{source.reports}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Disposition actions</CardTitle>
                <CardDescription>How reports are handled</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dispositionData.map((action) => (
                <div key={action.action} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          action.action === "reject"
                            ? "bg-red-500"
                            : action.action === "quarantine"
                            ? "bg-yellow-500"
                            : action.action === "soft bounce"
                            ? "bg-blue-500"
                            : "bg-green-500"
                        }`}
                        style={{ width: `${action.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm capitalize">{action.action.replace("-", " ")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{action.count}</span>
                    <span className="text-xs text-muted-foreground">({action.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-7">
          <CardHeader className="pb-3">
            <div>
              <CardTitle className="text-base">Quick stats</CardTitle>
              <CardDescription>Summary overview</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                  <Server className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm">Active sources</p>
                  <p className="text-lg font-semibold">{arfStats.sourcesMonitored}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm">Avg response time</p>
                  <p className="text-lg font-semibold">2.5h</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm">Resolution rate</p>
                  <p className="text-lg font-semibold">94%</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm">Blocked sources</p>
                  <p className="text-lg font-semibold">23</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
          <Link href="/dashboard/reports/dmarc">
            <Shield className="h-5 w-5" />
            <span className="text-sm">DMARC Reports</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
          <Link href="/dashboard/reports/tls">
            <FileText className="h-5 w-5" />
            <span className="text-sm">TLS Reports</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
          <Link href="/dashboard">
            <Server className="h-5 w-5" />
            <span className="text-sm">Back to Dashboard</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}