"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Mail,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Calendar,
  ArrowUpRight,
  FileText,
  Globe,
  Server,
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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const dmarcTrendData = [
  { date: "Jan 1", pass: 985, fail: 15, quarantine: 0 },
  { date: "Jan 2", pass: 1020, fail: 12, quarantine: 2 },
  { date: "Jan 3", pass: 1150, fail: 18, quarantine: 1 },
  { date: "Jan 4", pass: 980, fail: 22, quarantine: 3 },
  { date: "Jan 5", pass: 1240, fail: 8, quarantine: 2 },
  { date: "Jan 6", pass: 1180, fail: 14, quarantine: 0 },
  { date: "Jan 7", pass: 1320, fail: 10, quarantine: 1 },
];

const domainComplianceData = [
  { domain: "example.com", pass: 985, fail: 15, quarantine: 0, compliance: 98.5 },
  { domain: "company.org", pass: 1240, fail: 8, quarantine: 2, compliance: 99.2 },
  { domain: "business.net", pass: 856, fail: 42, quarantine: 8, compliance: 94.5 },
  { domain: "client.io", pass: 2100, fail: 45, quarantine: 12, compliance: 97.4 },
  { domain: "partner.co", pass: 680, fail: 35, quarantine: 5, compliance: 94.2 },
];

const failureReasonsData = [
  { name: "SPF Fail", value: 45, color: "oklch(0.6 0.2 20)" },
  { name: "DKIM Fail", value: 30, color: "oklch(0.6 0.2 280)" },
  { name: "Alignment Fail", value: 25, color: "oklch(0.6 0.2 40)" },
];

const policyDistributionData = [
  { name: "quarantine", value: 15, color: "oklch(0.6 0.2 40)" },
  { name: "reject", value: 65, color: "oklch(0.6 0.2 150)" },
  { name: "none", value: 20, color: "oklch(0.6 0.2 250)" },
];

const chartConfig = {
  pass: { label: "Pass", color: "oklch(0.6 0.2 150)" },
  fail: { label: "Fail", color: "oklch(0.6 0.2 20)" },
  quarantine: { label: "Quarantine", color: "oklch(0.6 0.2 40)" },
};

function getComplianceColor(compliance: number) {
  if (compliance >= 98) return "text-green-500";
  if (compliance >= 95) return "text-yellow-500";
  return "text-red-500";
}

function getStatusColor(status: string) {
  switch (status) {
    case "pass":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case "fail":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    case "quarantine":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    default:
      return "bg-slate-500/20 text-slate-400 border-slate-500/30";
  }
}

export default function ReportsDmarcPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("7j");
  const [dmarcStats, setDmarcStats] = useState({
    totalMessages: 48234,
    passRate: 98.2,
    failRate: 1.8,
    quarantineCount: 45,
    domainsMonitored: 12,
    activePolicies: 8,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setDmarcStats((prev) => ({
        ...prev,
        totalMessages: prev.totalMessages + Math.floor(Math.random() * 10),
        passRate: Math.min(100, prev.passRate + (Math.random() * 0.2 - 0.1)),
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
          <h1 className="text-2xl font-bold text-foreground">DMARC Reports</h1>
          <p className="text-sm text-muted-foreground">
            Domain-based Message Authentication, Reporting, and Conformance
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
          title="Total messages"
          value={dmarcStats.totalMessages.toLocaleString()}
          change="+12%"
          changeType="positive"
          description="vs last period"
          icon={Mail}
        />
        <StatsCard
          title="Pass rate"
          value={`${dmarcStats.passRate.toFixed(1)}%`}
          change="+0.3%"
          changeType="positive"
          description="vs last period"
          icon={CheckCircle}
        />
        <StatsCard
          title="Fail rate"
          value={`${dmarcStats.failRate.toFixed(1)}%`}
          change="-0.2%"
          changeType="positive"
          description="vs last period"
          icon={XCircle}
        />
        <StatsCard
          title="Quarantined"
          value={dmarcStats.quarantineCount.toString()}
          change="-5"
          changeType="positive"
          description="vs last period"
          icon={AlertTriangle}
        />
        <StatsCard
          title="Domains"
          value={dmarcStats.domainsMonitored.toString()}
          change="+1"
          changeType="positive"
          description="new this period"
          icon={Globe}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">DMARC trend</CardTitle>
                <CardDescription>Authentication results over time</CardDescription>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[oklch(0.6 0.2 150)]" />
                  <span className="text-muted-foreground">Pass</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[oklch(0.6 0.2 20)]" />
                  <span className="text-muted-foreground">Fail</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[oklch(0.6 0.2 40)]" />
                  <span className="text-muted-foreground">Quarantine</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-72 w-full min-h-70">
              <AreaChart data={dmarcTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillPass" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-pass)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-pass)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fillFail" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-fail)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-fail)" stopOpacity={0} />
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
                  dataKey="pass"
                  stroke="var(--color-pass)"
                  strokeWidth={2}
                  fill="url(#fillPass)"
                />
                <Area
                  type="monotone"
                  dataKey="fail"
                  stroke="var(--color-fail)"
                  strokeWidth={2}
                  fill="url(#fillFail)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Failure reasons</CardTitle>
                <CardDescription>Why messages failed DMARC</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <ChartContainer config={{}} className="h-48 w-full">
                <PieChart>
                  <Pie
                    data={failureReasonsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {failureReasonsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            </div>
            <div className="mt-4 space-y-2">
              {failureReasonsData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span>{item.name}</span>
                  </div>
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Domain compliance</CardTitle>
                <CardDescription>DMARC compliance by domain</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/reports" className="gap-1">
                  View all
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {domainComplianceData.map((domain) => (
                <div key={domain.domain} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20">
                      <Globe className="h-4 w-4 text-green-500" />
                    </div>
                    <div>
                      <span className="text-sm font-medium">{domain.domain}</span>
                      <p className="text-xs text-muted-foreground">
                        {domain.pass + domain.fail + domain.quarantine} messages
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                      <span className="text-sm text-green-500">{domain.pass}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <XCircle className="h-3.5 w-3.5 text-red-500" />
                      <span className="text-sm text-red-500">{domain.fail}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />
                      <span className="text-sm text-yellow-500">{domain.quarantine}</span>
                    </div>
                    <div className="ml-2">
                      <Badge variant="outline" className={`text-xs ${getComplianceColor(domain.compliance)}`}>
                        {domain.compliance}%
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div>
              <CardTitle className="text-base">Policy distribution</CardTitle>
              <CardDescription>DMARC policies in use</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {policyDistributionData.map((policy) => (
                <div key={policy.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-3 w-3 rounded-full`} style={{ backgroundColor: policy.color }} />
                    <span className="text-sm capitalize">{policy.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${policy.value}%`, backgroundColor: policy.color }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{policy.value}%</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Active policies</span>
                <span className="font-semibold">{dmarcStats.activePolicies}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
          <Link href="/dashboard/reports/tls">
            <Shield className="h-5 w-5" />
            <span className="text-sm">TLS Reports</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
          <Link href="/dashboard/reports/arf">
            <FileText className="h-5 w-5" />
            <span className="text-sm">ARF Reports</span>
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
