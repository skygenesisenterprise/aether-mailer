"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Lock,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Calendar,
  ArrowUpRight,
  FileText,
  Server,
  Key,
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

const tlsTrendData = [
  { time: "00:00", tls13: 72, tls12: 25, tls11: 3, tls10: 0 },
  { time: "04:00", tls13: 75, tls12: 22, tls11: 3, tls10: 0 },
  { time: "08:00", tls13: 68, tls12: 28, tls11: 4, tls10: 0 },
  { time: "10:00", tls13: 70, tls12: 27, tls11: 3, tls10: 0 },
  { time: "12:00", tls13: 74, tls12: 23, tls11: 3, tls10: 0 },
  { time: "14:00", tls13: 71, tls12: 26, tls11: 3, tls10: 0 },
  { time: "16:00", tls13: 73, tls12: 24, tls11: 3, tls10: 0 },
  { time: "18:00", tls13: 76, tls12: 21, tls11: 3, tls10: 0 },
  { time: "20:00", tls13: 72, tls12: 25, tls11: 3, tls10: 0 },
  { time: "22:00", tls13: 74, tls12: 23, tls11: 3, tls10: 0 },
];

const cipherSuitesData = [
  { name: "TLS_AES_256_GCM_SHA384", usage: 45, grade: "A" },
  { name: "TLS_CHACHA20_POLY1305_SHA256", usage: 28, grade: "A" },
  { name: "TLS_AES_128_GCM_SHA256", usage: 15, grade: "B" },
  { name: "ECDHE-RSA-AES256-GCM-SHA384", usage: 8, grade: "B" },
  { name: "ECDHE-RSA-AES128-GCM-SHA256", usage: 4, grade: "C" },
];

const connectionData = [
  { domain: "gmail.com", tlsVersion: "1.3", cipher: "TLS_AES_256_GCM_SHA384", status: "secure" },
  { domain: "outlook.com", tlsVersion: "1.3", cipher: "TLS_CHACHA20_POLY1305_SHA256", status: "secure" },
  { domain: "yahoo.com", tlsVersion: "1.2", cipher: "ECDHE-RSA-AES256-GCM-SHA384", status: "secure" },
  { domain: "protonmail.com", tlsVersion: "1.3", cipher: "TLS_AES_256_GCM_SHA384", status: "secure" },
  { domain: "example.com", tlsVersion: "1.1", cipher: "ECDHE-RSA-AES256-SHA", status: "weak" },
];

const versionDistribution = [
  { name: "TLS 1.3", value: 72, color: "oklch(0.6 0.2 150)" },
  { name: "TLS 1.2", value: 25, color: "oklch(0.6 0.2 250)" },
  { name: "TLS 1.1", value: 3, color: "oklch(0.6 0.2 40)" },
  { name: "TLS 1.0", value: 0, color: "oklch(0.6 0.2 20)" },
];

const chartConfig = {
  tls13: { label: "TLS 1.3", color: "oklch(0.6 0.2 150)" },
  tls12: { label: "TLS 1.2", color: "oklch(0.6 0.2 250)" },
  tls11: { label: "TLS 1.1", color: "oklch(0.6 0.2 40)" },
  tls10: { label: "TLS 1.0", color: "oklch(0.6 0.2 20)" },
};

function getGradeColor(grade: string) {
  switch (grade) {
    case "A":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case "B":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "C":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    case "D":
    case "F":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    default:
      return "bg-slate-500/20 text-slate-400 border-slate-500/30";
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "secure":
      return "text-green-500";
    case "weak":
      return "text-yellow-500";
    case "insecure":
      return "text-red-500";
    default:
      return "text-slate-500";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "secure":
      return CheckCircle;
    case "weak":
      return AlertTriangle;
    case "insecure":
      return XCircle;
    default:
      return Lock;
  }
}

export default function ReportsTlsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("24h");
  const [tlsStats, setTlsStats] = useState({
    totalConnections: 48234,
    secureConnections: 99.7,
    tls13Usage: 72,
    weakConnections: 0.3,
    certificates: 15,
    expiringSoon: 2,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setTlsStats((prev) => ({
        ...prev,
        totalConnections: prev.totalConnections + Math.floor(Math.random() * 10),
        tls13Usage: Math.min(100, Math.max(0, prev.tls13Usage + (Math.random() * 2 - 1))),
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
          <h1 className="text-2xl font-bold text-foreground">TLS Reports</h1>
          <p className="text-sm text-muted-foreground">
            Transport Layer Security configuration and usage analytics
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatsCard
          title="Total connections"
          value={tlsStats.totalConnections.toLocaleString()}
          change="+15%"
          changeType="positive"
          description="vs last period"
          icon={Server}
        />
        <StatsCard
          title="Secure connections"
          value={`${tlsStats.secureConnections}%`}
          change="+0.1%"
          changeType="positive"
          description="vs last period"
          icon={CheckCircle}
        />
        <StatsCard
          title="TLS 1.3 usage"
          value={`${tlsStats.tls13Usage.toFixed(0)}%`}
          change="+2%"
          changeType="positive"
          description="vs last period"
          icon={Lock}
        />
        <StatsCard
          title="Weak connections"
          value={`${tlsStats.weakConnections}%`}
          change="-0.1%"
          changeType="positive"
          description="vs last period"
          icon={AlertTriangle}
        />
        <StatsCard
          title="Certificates"
          value={tlsStats.certificates.toString()}
          change="+1"
          changeType="positive"
          description="new this period"
          icon={Key}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">TLS version usage</CardTitle>
                <CardDescription>Connection encryption by TLS version</CardDescription>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[oklch(0.6 0.2 150)]" />
                  <span className="text-muted-foreground">TLS 1.3</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[oklch(0.6 0.2 250)]" />
                  <span className="text-muted-foreground">TLS 1.2</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[oklch(0.6 0.2 40)]" />
                  <span className="text-muted-foreground">TLS 1.1</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-72 w-full min-h-70">
              <AreaChart data={tlsTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillTls13" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-tls13)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-tls13)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fillTls12" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-tls12)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-tls12)" stopOpacity={0} />
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
                  tickFormatter={(value) => `${value}%`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="tls13"
                  stroke="var(--color-tls13)"
                  strokeWidth={2}
                  fill="url(#fillTls13)"
                />
                <Area
                  type="monotone"
                  dataKey="tls12"
                  stroke="var(--color-tls12)"
                  strokeWidth={2}
                  fill="url(#fillTls12)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Version distribution</CardTitle>
                <CardDescription>Current TLS version usage</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <ChartContainer config={{}} className="h-48 w-full">
                <PieChart>
                  <Pie
                    data={versionDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {versionDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            </div>
            <div className="mt-4 space-y-2">
              {versionDistribution.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span>{item.name}</span>
                  </div>
                  <span className="font-medium">{item.value}%</span>
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
                <CardTitle className="text-base">Cipher suites</CardTitle>
                <CardDescription>Most used cipher configurations</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {cipherSuitesData.map((cipher) => (
                <div key={cipher.name} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <span className="text-sm font-medium font-mono">{cipher.name}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-green-500"
                        style={{ width: `${cipher.usage}%` }}
                      />
                    </div>
                    <Badge variant="outline" className={`text-xs ${getGradeColor(cipher.grade)}`}>
                      Grade {cipher.grade}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Top connections</CardTitle>
                <CardDescription>Recent secure connections</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {connectionData.map((conn) => {
                const StatusIcon = getStatusIcon(conn.status);
                return (
                  <div key={conn.domain} className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div className="flex items-center gap-3">
                      <StatusIcon className={`h-4 w-4 ${getStatusColor(conn.status)}`} />
                      <div>
                        <span className="text-sm font-medium">{conn.domain}</span>
                        <p className="text-xs text-muted-foreground">{conn.tlsVersion}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono text-muted-foreground">{conn.cipher.substring(0, 20)}...</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-7">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Certificate status</CardTitle>
                <CardDescription>SSL/TLS certificate overview</CardDescription>
              </div>
              <Button variant="ghost" size="sm">
                Manage certificates
                <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 rounded-lg border border-border">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="font-medium">Valid certificates</span>
                </div>
                <p className="text-2xl font-bold">{tlsStats.certificates - tlsStats.expiringSoon}</p>
                <p className="text-xs text-muted-foreground">No issues detected</p>
              </div>
              <div className="p-4 rounded-lg border border-border">
                <div className="flex items-center gap-3 mb-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <span className="font-medium">Expiring soon</span>
                </div>
                <p className="text-2xl font-bold">{tlsStats.expiringSoon}</p>
                <p className="text-xs text-muted-foreground">Within 30 days</p>
              </div>
              <div className="p-4 rounded-lg border border-border">
                <div className="flex items-center gap-3 mb-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span className="font-medium">Expired</span>
                </div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-muted-foreground">No expired certificates</p>
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
