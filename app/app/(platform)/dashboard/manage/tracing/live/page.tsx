"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Activity,
  Play,
  Pause,
  Square,
  RefreshCw,
  Calendar,
  ArrowUpRight,
  Bell,
  Lock,
  Mail,
  Send,
  Clock,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Filter,
  Zap,
  Radio,
  Signal,
  Timer,
  Gauge,
  Footprints,
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
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const traceVolumeData = [
  { time: "00:00", requests: 120, latency: 45, errors: 5 },
  { time: "04:00", requests: 80, latency: 38, errors: 2 },
  { time: "08:00", requests: 450, latency: 52, errors: 12 },
  { time: "10:00", requests: 680, latency: 48, errors: 8 },
  { time: "12:00", requests: 520, latency: 42, errors: 6 },
  { time: "14:00", requests: 750, latency: 55, errors: 15 },
  { time: "16:00", requests: 890, latency: 62, errors: 11 },
  { time: "18:00", requests: 620, latency: 45, errors: 7 },
  { time: "20:00", requests: 380, latency: 38, errors: 4 },
  { time: "22:00", requests: 180, latency: 35, errors: 3 },
];

const latencyDistribution = [
  { percentile: "p50", latency: 45 },
  { percentile: "p75", latency: 78 },
  { percentile: "p90", latency: 125 },
  { percentile: "p95", latency: 180 },
  { percentile: "p99", latency: 320 },
];

const activeTraces = [
  {
    id: "trace-001",
    service: "SMTP",
    status: "running",
    duration: "2.34s",
    spans: 12,
    started: "10:45:32",
  },
  {
    id: "trace-002",
    service: "Auth",
    status: "completed",
    duration: "0.85s",
    spans: 8,
    started: "10:45:30",
  },
  {
    id: "trace-003",
    service: "Delivery",
    status: "running",
    duration: "5.21s",
    spans: 24,
    started: "10:45:28",
  },
  {
    id: "trace-004",
    service: "SpamFilter",
    status: "completed",
    duration: "0.42s",
    spans: 5,
    started: "10:45:25",
  },
  {
    id: "trace-005",
    service: "API",
    status: "error",
    duration: "1.23s",
    spans: 15,
    started: "10:45:20",
  },
];

const serviceMap = [
  { service: "SMTP", traces: 4523, errors: 12, latency: "45ms" },
  { service: "Auth", traces: 2341, errors: 5, latency: "82ms" },
  { service: "Delivery", traces: 8924, errors: 28, latency: "120ms" },
  { service: "SpamFilter", traces: 1234, errors: 2, latency: "35ms" },
  { service: "API", traces: 5678, errors: 15, latency: "65ms" },
];

const traceDetails = [
  {
    id: 1,
    operation: "connect",
    service: "SMTP",
    duration: "125ms",
    status: "ok",
  },
  {
    id: 2,
    operation: "authenticate",
    service: "Auth",
    duration: "45ms",
    status: "ok",
  },
  {
    id: 3,
    operation: "validate",
    service: "SpamFilter",
    duration: "32ms",
    status: "ok",
  },
  {
    id: 4,
    operation: "route",
    service: "Delivery",
    duration: "18ms",
    status: "ok",
  },
  {
    id: 5,
    operation: "queue",
    service: "Queue",
    duration: "8ms",
    status: "ok",
  },
];

const chartConfig = {
  requests: { label: "Requests", color: "oklch(0.5 0.2 150)" },
  latency: { label: "Latency", color: "oklch(0.6 0.2 250)" },
  errors: { label: "Errors", color: "oklch(0.6 0.2 20)" },
};

function getTraceStatusColor(status: string) {
  switch (status) {
    case "running":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "completed":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case "error":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    default:
      return "bg-slate-500/20 text-slate-400 border-slate-500/30";
  }
}

function getTraceIcon(status: string) {
  switch (status) {
    case "running":
      return Activity;
    case "completed":
      return CheckCircle;
    case "error":
      return XCircle;
    default:
      return Filter;
  }
}

function getServiceStatusColor(status: string) {
  switch (status) {
    case "ok":
      return "text-green-500";
    case "warning":
      return "text-yellow-500";
    case "error":
      return "text-red-500";
    default:
      return "text-slate-500";
  }
}

export default function ManageTracingLivePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isTracing, setIsTracing] = useState(true);
  const [selectedService, setSelectedService] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [traceStats, setTraceStats] = useState({
    totalTraces: 48234,
    activeTraces: 89,
    avgLatency: 45,
    errorRate: 0.3,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setTraceStats((prev) => ({
        ...prev,
        totalTraces: prev.totalTraces + Math.floor(Math.random() * 5),
        activeTraces: Math.floor(Math.random() * 10) + 5,
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1500);
  };

  const handleStartTracing = () => {
    setIsTracing(true);
  };

  const handleStopTracing = () => {
    setIsTracing(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Live Tracing</h1>
          <p className="text-sm text-muted-foreground">
            Real-time distributed tracing
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant={isTracing ? "destructive" : "default"}
              size="sm"
              onClick={isTracing ? handleStopTracing : handleStartTracing}
            >
              {isTracing ? (
                <>
                  <Square className="h-4 w-4 mr-2" />
                  Stop
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start
                </>
              )}
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
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Input
            placeholder="Search traces..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={selectedService} onValueChange={setSelectedService}>
          <SelectTrigger className="w-40">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Services</SelectItem>
            <SelectItem value="smtp">SMTP</SelectItem>
            <SelectItem value="auth">Auth</SelectItem>
            <SelectItem value="delivery">Delivery</SelectItem>
            <SelectItem value="spamfilter">SpamFilter</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total traces"
          value={traceStats.totalTraces.toLocaleString()}
          change="+1.2K"
          changeType="positive"
          description="vs yesterday"
          icon={Activity}
        />
        <StatsCard
          title="Active traces"
          value={traceStats.activeTraces.toString()}
          change="+3"
          changeType="positive"
          description="running now"
          icon={Radio}
        />
        <StatsCard
          title="Avg latency"
          value={`${traceStats.avgLatency}ms`}
          change="-8ms"
          changeType="positive"
          description="vs yesterday"
          icon={Timer}
        />
        <StatsCard
          title="Error rate"
          value={`${traceStats.errorRate}%`}
          change="-0.1%"
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
                <CardTitle className="text-base">Trace volume</CardTitle>
                <CardDescription>Requests over time</CardDescription>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[oklch(0.5 0.2 150)]" />
                  <span className="text-muted-foreground">Requests</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[oklch(0.6 0.2 250)]" />
                  <span className="text-muted-foreground">Latency</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-72 w-full min-h-70">
              <AreaChart data={traceVolumeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillRequests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-requests)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-requests)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fillLatency" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-latency)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-latency)" stopOpacity={0} />
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
                  dataKey="requests"
                  stroke="var(--color-requests)"
                  strokeWidth={2}
                  fill="url(#fillRequests)"
                />
                <Area
                  type="monotone"
                  dataKey="latency"
                  stroke="var(--color-latency)"
                  strokeWidth={2}
                  fill="url(#fillLatency)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Active traces</CardTitle>
                <CardDescription>Running now</CardDescription>
              </div>
              <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                <Radio className="h-3 w-3 mr-1 animate-pulse" />
                Live
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border max-h-80 overflow-y-auto">
              {activeTraces.map((trace) => {
                const TraceIcon = getTraceIcon(trace.status);
                return (
                  <div key={trace.id} className="flex items-center gap-3 px-6 py-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      <TraceIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{trace.id}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-normal ${getTraceStatusColor(trace.status)}`}>
                          {trace.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{trace.service}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium">{trace.duration}</span>
                      <span className="text-xs text-muted-foreground ml-2 block">{trace.started}</span>
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
                <CardTitle className="text-base">Latency distribution</CardTitle>
                <CardDescription>Percentiles</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-64 w-full min-h-60">
              <BarChart data={latencyDistribution} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="percentile"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                  tickFormatter={(value) => `${value}ms`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="latency" fill="var(--color-latency)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Service Map</CardTitle>
                <CardDescription>Traces by service</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/manage/tracing/services" className="gap-1">
                  View all
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {serviceMap.map((item) => (
                <div key={item.service} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{item.service}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">{item.traces.toLocaleString()}</span>
                    <span className={item.errors > 10 ? "text-red-500" : "text-muted-foreground"}>
                      {item.errors} err
                    </span>
                    <span className="text-muted-foreground">{item.latency}</span>
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
              <CardTitle className="text-base">Trace Details</CardTitle>
              <CardDescription>Latest trace spans</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/manage/tracing/details" className="gap-1">
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
                  <th className="h-10 px-4 font-medium text-muted-foreground">Operation</th>
                  <th className="h-10 px-4 font-medium text-muted-foreground">Service</th>
                  <th className="h-10 px-4 font-medium text-muted-foreground">Duration</th>
                  <th className="h-10 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="h-10 px-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {traceDetails.map((detail) => (
                  <tr key={detail.id} className="hover:bg-muted/50">
                    <td className="p-4 font-medium">{detail.operation}</td>
                    <td className="p-4 text-muted-foreground">{detail.service}</td>
                    <td className="p-4 text-muted-foreground">{detail.duration}</td>
                    <td className="p-4">
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-normal ${getTraceStatusColor(detail.status)}`}>
                        {detail.status}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Footprints className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
          <Link href="/dashboard/manage/logs">
            <Activity className="h-5 w-5" />
            <span className="text-sm">Logs</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
          <Link href="/dashboard/manage/metrics">
            <Gauge className="h-5 w-5" />
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
            <Shield className="h-5 w-5" />
            <span className="text-sm">Settings</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}