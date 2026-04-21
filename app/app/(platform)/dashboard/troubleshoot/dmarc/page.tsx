"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Mail,
  Activity,
  Shield,
  RefreshCw,
  Calendar,
  ArrowUpRight,
  FileText,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Search,
  Filter,
  Download,
  Settings,
  Globe,
  Key,
  Verified,
} from "lucide-react";
import { Input } from "@/components/ui/input";
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

const dmarcTrafficData = [
  { time: "00:00", pass: 340, fail: 12, quarantine: 5 },
  { time: "04:00", pass: 210, fail: 8, quarantine: 2 },
  { time: "08:00", pass: 890, fail: 45, quarantine: 12 },
  { time: "10:00", pass: 1240, fail: 68, quarantine: 8 },
  { time: "12:00", pass: 980, fail: 52, quarantine: 6 },
  { time: "14:00", pass: 1450, fail: 75, quarantine: 15 },
  { time: "16:00", pass: 1680, fail: 89, quarantine: 11 },
  { time: "18:00", pass: 1120, fail: 62, quarantine: 7 },
  { time: "20:00", pass: 720, fail: 38, quarantine: 4 },
  { time: "22:00", pass: 420, fail: 18, quarantine: 3 },
];

const authResultData = [
  { day: "Mon", pass: 98.2, fail: 1.8 },
  { day: "Tue", pass: 97.8, fail: 2.2 },
  { day: "Wed", pass: 99.1, fail: 0.9 },
  { day: "Thu", pass: 98.5, fail: 1.5 },
  { day: "Fri", pass: 97.2, fail: 2.8 },
  { day: "Sat", pass: 99.4, fail: 0.6 },
  { day: "Sun", pass: 98.9, fail: 1.1 },
];

const dmarcFailures = [
  {
    id: 1,
    domain: "example.com",
    reason: "SPF fail",
    count: 45,
    severity: "high",
    timestamp: "10:45:32",
  },
  {
    id: 2,
    domain: "domain.net",
    reason: "DKIM fail",
    count: 28,
    severity: "medium",
    timestamp: "10:44:18",
  },
  {
    id: 3,
    domain: "business.org",
    reason: "Alignment fail",
    count: 15,
    severity: "low",
    timestamp: "10:43:55",
  },
  {
    id: 4,
    domain: "client.net",
    reason: "SPF softfail",
    count: 32,
    severity: "medium",
    timestamp: "10:42:12",
  },
  {
    id: 5,
    domain: "company.com",
    reason: "Missing DKIM",
    count: 12,
    severity: "high",
    timestamp: "10:41:03",
  },
];

const domainPolicies = [
  { domain: "example.com", policy: "reject", subdomain: "reject", percentage: 98.2 },
  { domain: "company.org", policy: "quarantine", subdomain: "none", percentage: 95.5 },
  { domain: "business.net", policy: "none", subdomain: "none", percentage: 89.2 },
];

const authenticationChecks = [
  {
    id: 1,
    check: "SPF",
    status: "passed",
    description: "SPF record found and validated",
    details: "sender IPs authorized",
  },
  {
    id: 2,
    check: "DKIM",
    status: "passed",
    description: "DKIM signature valid",
    details: "key length 2048-bit",
  },
  {
    id: 3,
    check: "DMARC",
    status: "passed",
    description: "Alignment check passed",
    details: "SPF and DKIM aligned",
  },
];

const chartConfig = {
  pass: { label: "Pass", color: "oklch(0.5 0.2 150)" },
  fail: { label: "Fail", color: "oklch(0.6 0.2 20)" },
  quarantine: { label: "Quarantine", color: "oklch(0.6 0.2 80)" },
};

const authConfig = {
  pass: { label: "Pass", color: "oklch(0.5 0.2 150)" },
  fail: { label: "Fail", color: "oklch(0.6 0.2 20)" },
};

function getStatusColor(status: string) {
  switch (status) {
    case "passed":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case "failed":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    case "warning":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    case "quarantine":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    default:
      return "bg-slate-500/20 text-slate-400 border-slate-500/30";
  }
}

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

function getAuthIcon(status: string) {
  switch (status) {
    case "passed":
      return ShieldCheck;
    case "failed":
      return ShieldX;
    case "warning":
      return ShieldAlert;
    default:
      return Shield;
  }
}

function getPolicyColor(policy: string) {
  switch (policy) {
    case "reject":
      return "text-green-500";
    case "quarantine":
      return "text-yellow-500";
    case "none":
      return "text-muted-foreground";
    default:
      return "text-slate-500";
  }
}

export default function TroubleshootDmarcPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("24h");
  const [searchQuery, setSearchQuery] = useState("");
  const [dmarcStats, setDmarcStats] = useState({
    totalEmails: 48234,
    passCount: 47521,
    failCount: 482,
    quarantineCount: 231,
    compliance: 98.2,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setDmarcStats((prev) => ({
        ...prev,
        totalEmails: prev.totalEmails + Math.floor(Math.random() * 10),
        passCount: prev.passCount + Math.floor(Math.random() * 8),
      }));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1500);
  };

  const handleRunDiagnostics = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">DMARC Troubleshooting</h1>
          <p className="text-sm text-muted-foreground">
            Diagnose and fix DMARC authentication issues
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
          <Button variant="outline" size="sm" onClick={handleRunDiagnostics}>
            <ShieldCheck className="h-4 w-4 mr-2" />
            Run Diagnostics
          </Button>
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

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by domain..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select>
          <SelectTrigger className="w-40">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Results</SelectItem>
            <SelectItem value="passed">Passed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="quarantine">Quarantine</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total emails"
          value={dmarcStats.totalEmails.toLocaleString()}
          change="+1.2K"
          changeType="positive"
          description="vs yesterday"
          icon={Mail}
        />
        <StatsCard
          title="Passed"
          value={dmarcStats.passCount.toLocaleString()}
          change="+1.1K"
          changeType="positive"
          description="vs yesterday"
          icon={ShieldCheck}
        />
        <StatsCard
          title="Failed"
          value={dmarcStats.failCount.toString()}
          change="-15"
          changeType="positive"
          description="vs yesterday"
          icon={ShieldX}
        />
        <StatsCard
          title="Compliance"
          value={`${dmarcStats.compliance}%`}
          change="+0.3%"
          changeType="positive"
          description="vs yesterday"
          icon={Verified}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">DMARC results</CardTitle>
                <CardDescription>Authentication results</CardDescription>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[oklch(0.5 0.2 150)]" />
                  <span className="text-muted-foreground">Pass</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[oklch(0.6 0.2 20)]" />
                  <span className="text-muted-foreground">Fail</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-72 w-full min-h-70">
              <AreaChart data={dmarcTrafficData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                <CardTitle className="text-base">DMARC failures</CardTitle>
                <CardDescription>Recent failures</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/troubleshoot/failures" className="gap-1">
                  View all
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {dmarcFailures.map((failure) => {
                const AuthIcon = getAuthIcon(failure.severity === "high" ? "failed" : "warning");
                return (
                  <div key={failure.id} className="flex items-center gap-3 px-6 py-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      <AuthIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{failure.domain}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-normal ${getSeverityColor(failure.severity)}`}>
                          {failure.severity}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{failure.reason}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium">{failure.count}</span>
                      <span className="text-xs text-muted-foreground ml-2 block">{failure.timestamp}</span>
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
                <CardTitle className="text-base">Authentication rate</CardTitle>
                <CardDescription>Percentage by day</CardDescription>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[oklch(0.5 0.2 150)]" />
                  <span className="text-muted-foreground">Pass</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[oklch(0.6 0.2 20)]" />
                  <span className="text-muted-foreground">Fail</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={authConfig} className="h-64 w-full min-h-60">
              <BarChart data={authResultData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                <Bar dataKey="pass" stackId="a" fill="var(--color-pass)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="fail" stackId="a" fill="var(--color-fail)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Domain Policies</CardTitle>
                <CardDescription>Current DMARC policies</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/directory/domains" className="gap-1">
                  Manage
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {domainPolicies.map((item) => (
                <div key={item.domain} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-sm font-medium">{item.domain}</span>
                      <div className="text-xs text-muted-foreground">{item.subdomain}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-normal ${getStatusColor(item.policy === "reject" ? "passed" : item.policy === "quarantine" ? "quarantine" : "failed")}`}>
                      {item.policy}
                    </Badge>
                    <span className="text-sm font-medium">{item.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Authentication Checks</CardTitle>
              <CardDescription>Run authentication diagnostics</CardDescription>
            </div>
            <Button>
              <ShieldCheck className="h-4 w-4 mr-2" />
              Run Checks
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm text-left">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="h-10 px-4 font-medium text-muted-foreground">Check</th>
                  <th className="h-10 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="h-10 px-4 font-medium text-muted-foreground">Description</th>
                  <th className="h-10 px-4 font-medium text-muted-foreground">Details</th>
                  <th className="h-10 px-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {authenticationChecks.map((check) => {
                  const AuthIcon = getAuthIcon(check.status);
                  return (
                    <tr key={check.id} className="hover:bg-muted/50">
                      <td className="p-4 font-medium">
                        <div className="flex items-center gap-2">
                          <Key className="h-4 w-4" />
                          {check.check}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-normal ${getStatusColor(check.status)}`}>
                          {check.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-muted-foreground">{check.description}</td>
                      <td className="p-4 text-muted-foreground">{check.details}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
          <Link href="/dashboard/troubleshoot/delivery">
            <Activity className="h-5 w-5" />
            <span className="text-sm">Delivery</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
          <Link href="/dashboard/reports/dmarc">
            <FileText className="h-5 w-5" />
            <span className="text-sm">Reports</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
          <Link href="/dashboard/directory/domains">
            <Globe className="h-5 w-5" />
            <span className="text-sm">Domains</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
          <Link href="/dashboard/settings">
            <Settings className="h-5 w-5" />
            <span className="text-sm">Settings</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}