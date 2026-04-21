"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Save,
  RefreshCw,
  Calendar,
  ArrowUpRight,
  Bell,
  Lock,
  Mail,
  Send,
  Clock,
  Activity,
  Shield,
  AlertTriangle,
  XCircle,
  Search,
  Filter,
  Download,
  Eye,
  Info,
  Terminal,
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

const logVolumeData = [
  { time: "00:00", system: 120, mail: 340, security: 85 },
  { time: "04:00", system: 80, mail: 210, security: 45 },
  { time: "08:00", system: 450, mail: 890, security: 220 },
  { time: "10:00", system: 680, mail: 1240, security: 310 },
  { time: "12:00", system: 520, mail: 980, security: 245 },
  { time: "14:00", system: 750, mail: 1450, security: 380 },
  { time: "16:00", system: 890, mail: 1680, security: 420 },
  { time: "18:00", system: 620, mail: 1120, security: 290 },
  { time: "20:00", system: 380, mail: 720, security: 180 },
  { time: "22:00", system: 180, mail: 420, security: 95 },
];

const logLevelData = [
  { day: "Mon", error: 12, warning: 45, info: 234 },
  { day: "Tue", error: 8, warning: 52, info: 198 },
  { day: "Wed", error: 15, warning: 38, info: 312 },
  { day: "Thu", error: 5, warning: 48, info: 267 },
  { day: "Fri", error: 22, warning: 55, info: 289 },
  { day: "Sat", error: 2, warning: 12, info: 89 },
  { day: "Sun", error: 1, warning: 8, info: 67 },
];

const recentLogs = [
  {
    id: 1,
    level: "error",
    source: "SMTP",
    message: "Connection timeout to relay server",
    timestamp: "10:45:32",
    date: "2024-03-15",
  },
  {
    id: 2,
    level: "warning",
    source: "Auth",
    message: "Failed login attempt for user@domain.com",
    timestamp: "10:44:18",
    date: "2024-03-15",
  },
  {
    id: 3,
    level: "info",
    source: "Delivery",
    message: "Email queued for delivery",
    timestamp: "10:43:55",
    date: "2024-03-15",
  },
  {
    id: 4,
    level: "warning",
    source: "SpamFilter",
    message: "High spam score detected",
    timestamp: "10:42:12",
    date: "2024-03-15",
  },
  {
    id: 5,
    level: "error",
    source: "Database",
    message: "Connection pool exhausted",
    timestamp: "10:41:03",
    date: "2024-03-15",
  },
  {
    id: 6,
    level: "info",
    source: "API",
    message: "Request processed successfully",
    timestamp: "10:40:45",
    date: "2024-03-15",
  },
];

const logSources = [
  { source: "SMTP", count: 4523, status: "active" },
  { source: "Auth", count: 2341, status: "active" },
  { source: "Delivery", count: 8924, status: "active" },
  { source: "SpamFilter", count: 1234, status: "active" },
  { source: "API", count: 5678, status: "active" },
  { source: "System", count: 890, status: "active" },
];

const retentionPolicy = [
  { policy: "Error logs", retention: "90 days", size: "2.4 GB" },
  { policy: "Warning logs", retention: "30 days", size: "8.7 GB" },
  { policy: "Info logs", retention: "7 days", size: "15.2 GB" },
  { policy: "Debug logs", retention: "1 day", size: "3.1 GB" },
];

const chartConfig = {
  system: { label: "System", color: "oklch(0.6 0.2 250)" },
  mail: { label: "Mail", color: "oklch(0.5 0.2 150)" },
  security: { label: "Security", color: "oklch(0.6 0.2 50)" },
};

const levelConfig = {
  error: { label: "Error", color: "oklch(0.6 0.2 20)" },
  warning: { label: "Warning", color: "oklch(0.6 0.2 80)" },
  info: { label: "Info", color: "oklch(0.5 0.2 150)" },
};

function getLogLevelColor(level: string) {
  switch (level) {
    case "error":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    case "warning":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    case "info":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    default:
      return "bg-slate-500/20 text-slate-400 border-slate-500/30";
  }
}

function getLogLevelIcon(level: string) {
  switch (level) {
    case "error":
      return XCircle;
    case "warning":
      return AlertTriangle;
    case "info":
      return Info;
    default:
      return FileText;
  }
}

function getSourceIcon(source: string) {
  switch (source) {
    case "SMTP":
      return Mail;
    case "Auth":
      return Lock;
    case "Delivery":
      return Send;
    case "SpamFilter":
      return Shield;
    case "API":
      return Activity;
    default:
      return FileText;
  }
}

export default function ManageLogsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("24h");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [logStats, setLogStats] = useState({
    totalLogs: 48234,
    errorCount: 89,
    warningCount: 342,
    infoCount: 12847,
    storageUsed: 29.4,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setLogStats((prev) => ({
        ...prev,
        totalLogs: prev.totalLogs + Math.floor(Math.random() * 10),
        infoCount: prev.infoCount + Math.floor(Math.random() * 5),
      }));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1500);
  };

  const handleExport = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Logs</h1>
          <p className="text-sm text-muted-foreground">
            System and application log viewer
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
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
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
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={selectedLevel} onValueChange={setSelectedLevel}>
          <SelectTrigger className="w-32">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="info">Info</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total logs"
          value={logStats.totalLogs.toLocaleString()}
          change="+1.2K"
          changeType="positive"
          description="vs yesterday"
          icon={FileText}
        />
        <StatsCard
          title="Errors"
          value={logStats.errorCount.toString()}
          change="-15"
          changeType="positive"
          description="vs yesterday"
          icon={XCircle}
        />
        <StatsCard
          title="Warnings"
          value={logStats.warningCount.toString()}
          change="+42"
          changeType="negative"
          description="vs yesterday"
          icon={AlertTriangle}
        />
        <StatsCard
          title="Storage used"
          value={`${logStats.storageUsed} GB`}
          change="+2.4 GB"
          changeType="negative"
          description="vs yesterday"
          icon={Save}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Log volume</CardTitle>
                <CardDescription>Logs by source</CardDescription>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[oklch(0.6 0.2 250)]" />
                  <span className="text-muted-foreground">System</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[oklch(0.5 0.2 150)]" />
                  <span className="text-muted-foreground">Mail</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-72 w-full min-h-70">
              <AreaChart data={logVolumeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillSystem" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-system)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-system)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fillMail" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-mail)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-mail)" stopOpacity={0} />
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
                  dataKey="mail"
                  stroke="var(--color-mail)"
                  strokeWidth={2}
                  fill="url(#fillMail)"
                />
                <Area
                  type="monotone"
                  dataKey="system"
                  stroke="var(--color-system)"
                  strokeWidth={2}
                  fill="url(#fillSystem)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Log sources</CardTitle>
                <CardDescription>Logs by source</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/manage/sources" className="gap-1">
                  View all
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {logSources.map((item) => {
                const SourceIcon = getSourceIcon(item.source);
                return (
                  <div key={item.source} className="flex items-center gap-3 px-6 py-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      <SourceIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.source}</p>
                      <p className="text-xs text-muted-foreground">{item.status}</p>
                    </div>
                    <span className="text-sm font-medium">{item.count.toLocaleString()}</span>
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
                <CardTitle className="text-base">Log levels</CardTitle>
                <CardDescription>By severity</CardDescription>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[oklch(0.6 0.2 20)]" />
                  <span className="text-muted-foreground">Error</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[oklch(0.6 0.2 80)]" />
                  <span className="text-muted-foreground">Warning</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[oklch(0.5 0.2 150)]" />
                  <span className="text-muted-foreground">Info</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={levelConfig} className="h-64 w-full min-h-60">
              <BarChart data={logLevelData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                <Bar dataKey="info" stackId="a" fill="var(--color-info)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="warning" stackId="a" fill="var(--color-warning)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="error" stackId="a" fill="var(--color-error)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Retention Policy</CardTitle>
                <CardDescription>Log retention settings</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/manage/retention" className="gap-1">
                  Edit
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {retentionPolicy.map((item) => (
                <div key={item.policy} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{item.policy}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">{item.retention}</span>
                    <span className="text-xs text-muted-foreground">{item.size}</span>
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
              <CardTitle className="text-base">Recent Logs</CardTitle>
              <CardDescription>Latest log entries</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/manage/logs/all" className="gap-1">
                View all
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm text-left">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="h-10 px-4 font-medium text-muted-foreground">Level</th>
                  <th className="h-10 px-4 font-medium text-muted-foreground">Source</th>
                  <th className="h-10 px-4 font-medium text-muted-foreground">Message</th>
                  <th className="h-10 px-4 font-medium text-muted-foreground">Timestamp</th>
                  <th className="h-10 px-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentLogs.map((log) => {
                  const LogIcon = getLogLevelIcon(log.level);
                  return (
                    <tr key={log.id} className="hover:bg-muted/50">
                      <td className="p-4">
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-normal ${getLogLevelColor(log.level)}`}>
                          <LogIcon className="h-3 w-3 mr-1" />
                          {log.level}
                        </Badge>
                      </td>
                      <td className="p-4 text-muted-foreground">{log.source}</td>
                      <td className="p-4 truncate max-w-md">{log.message}</td>
                      <td className="p-4 text-muted-foreground">
                        <div>{log.timestamp}</div>
                        <div className="text-xs">{log.date}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <RefreshCw className="h-4 w-4" />
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
          <Link href="/dashboard/manage/tracing">
            <Activity className="h-5 w-5" />
            <span className="text-sm">Tracing</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
          <Link href="/dashboard/manage/metrics">
            <Shield className="h-5 w-5" />
            <span className="text-sm">Metrics</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
          <Link href="/dashboard/manage/alerts">
            <Bell className="h-5 w-5" />
            <span className="text-sm">Alerts</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
          <Link href="/dashboard/manage/settings">
            <Terminal className="h-5 w-5" />
            <span className="text-sm">Settings</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}