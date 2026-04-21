"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Mail,
  Clock,
  Activity,
  RefreshCw,
  Calendar,
  ArrowUpRight,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Server,
  Zap,
  TrendingUp,
  TrendingDown,
  HardDrive,
  Cpu,
  Gauge,
  BarChart3,
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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const performanceTrendData = [
  { time: "00:00", latency: 120, throughput: 450, errors: 2 },
  { time: "04:00", latency: 145, throughput: 320, errors: 1 },
  { time: "08:00", latency: 180, throughput: 890, errors: 5 },
  { time: "10:00", latency: 165, throughput: 1240, errors: 3 },
  { time: "12:00", latency: 195, throughput: 980, errors: 4 },
  { time: "14:00", latency: 210, throughput: 1450, errors: 6 },
  { time: "16:00", latency: 185, throughput: 1680, errors: 4 },
  { time: "18:00", latency: 175, throughput: 1120, errors: 3 },
  { time: "20:00", latency: 155, throughput: 720, errors: 2 },
  { time: "22:00", latency: 140, throughput: 420, errors: 1 },
];

const deliveryPerformanceData = [
  { day: "Mon", success: 98.2, delayed: 1.2, failed: 0.6 },
  { day: "Tue", success: 97.8, delayed: 1.5, failed: 0.7 },
  { day: "Wed", success: 99.1, delayed: 0.5, failed: 0.4 },
  { day: "Thu", success: 98.5, delayed: 1.0, failed: 0.5 },
  { day: "Fri", success: 97.2, delayed: 2.0, failed: 0.8 },
  { day: "Sat", success: 99.4, delayed: 0.3, failed: 0.3 },
  { day: "Sun", success: 98.9, delayed: 0.8, failed: 0.3 },
];

const componentHealthData = [
  { name: "SMTP Server", status: "healthy", uptime: 99.9, latency: 45, requests: 12500 },
  { name: "Queue Manager", status: "healthy", uptime: 99.8, latency: 28, requests: 8200 },
  { name: "Filter Engine", status: "warning", uptime: 98.5, latency: 120, requests: 4500 },
  { name: "Storage", status: "healthy", uptime: 99.9, latency: 15, requests: 2800 },
  { name: "Auth Service", status: "healthy", uptime: 99.7, latency: 35, requests: 9800 },
];

const queuePerformanceData = [
  { name: "Priority", messages: 520, avgLatency: 45, successRate: 99.8, color: "oklch(0.6 0.2 20)" },
  { name: "Outbound", messages: 1240, avgLatency: 120, successRate: 98.2, color: "oklch(0.6 0.2 250)" },
  { name: "Transactional", messages: 380, avgLatency: 85, successRate: 99.5, color: "oklch(0.6 0.2 150)" },
  { name: "Bulk", messages: 210, avgLatency: 280, successRate: 96.5, color: "oklch(0.6 0.2 40)" },
];

const resourceUsage = [
  { name: "CPU", value: 65, color: "oklch(0.6 0.2 150)" },
  { name: "Memory", value: 72, color: "oklch(0.6 0.2 250)" },
  { name: "Disk I/O", value: 45, color: "oklch(0.6 0.2 40)" },
  { name: "Network", value: 58, color: "oklch(0.6 0.2 280)" },
];

const chartConfig = {
  latency: { label: "Latency (ms)", color: "oklch(0.6 0.2 150)" },
  throughput: { label: "Throughput", color: "oklch(0.6 0.2 250)" },
  errors: { label: "Errors", color: "oklch(0.6 0.2 20)" },
};

const deliveryConfig = {
  success: { label: "Success", color: "oklch(0.6 0.2 150)" },
  delayed: { label: "Delayed", color: "oklch(0.6 0.2 40)" },
  failed: { label: "Failed", color: "oklch(0.6 0.2 20)" },
};

function getStatusColor(status: string) {
  switch (status) {
    case "healthy":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case "warning":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    case "critical":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    default:
      return "bg-slate-500/20 text-slate-400 border-slate-500/30";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "healthy":
      return CheckCircle;
    case "warning":
      return AlertTriangle;
    case "critical":
      return XCircle;
    default:
      return Server;
  }
}

export default function PerformancePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("24h");
  const [perfStats, setPerfStats] = useState({
    totalEmails: 48234,
    avgLatency: 165,
    throughput: 4250,
    successRate: 98.2,
    errorRate: 0.8,
    uptime: 99.8,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setPerfStats((prev) => ({
        ...prev,
        totalEmails: prev.totalEmails + Math.floor(Math.random() * 10),
        avgLatency: Math.max(50, prev.avgLatency + Math.floor(Math.random() * 20) - 10),
        throughput: prev.throughput + Math.floor(Math.random() * 50) - 25,
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
          <h1 className="text-2xl font-bold text-foreground">Performance</h1>
          <p className="text-sm text-muted-foreground">
            System performance metrics and resource utilization
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
          title="Total emails"
          value={perfStats.totalEmails.toLocaleString()}
          change="+15%"
          changeType="positive"
          description="vs last period"
          icon={Mail}
        />
        <StatsCard
          title="Avg latency"
          value={`${perfStats.avgLatency}ms`}
          change="-12ms"
          changeType="positive"
          description="vs last period"
          icon={Clock}
        />
        <StatsCard
          title="Throughput"
          value={perfStats.throughput.toLocaleString()}
          change="+8%"
          changeType="positive"
          description="vs last period"
          icon={Zap}
        />
        <StatsCard
          title="Success rate"
          value={`${perfStats.successRate}%`}
          change="+0.3%"
          changeType="positive"
          description="vs last period"
          icon={CheckCircle}
        />
        <StatsCard
          title="Uptime"
          value={`${perfStats.uptime}%`}
          change="+0.1%"
          changeType="positive"
          description="vs last period"
          icon={Server}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Performance trend</CardTitle>
                <CardDescription>Latency and throughput over time</CardDescription>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[oklch(0.6 0.2 150)]" />
                  <span className="text-muted-foreground">Latency</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[oklch(0.6 0.2 250)]" />
                  <span className="text-muted-foreground">Throughput</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-72 w-full min-h-70">
              <AreaChart data={performanceTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillLatency" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-latency)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-latency)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fillThroughput" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-throughput)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-throughput)" stopOpacity={0} />
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
                  yAxisId="left"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="latency"
                  stroke="var(--color-latency)"
                  strokeWidth={2}
                  fill="url(#fillLatency)"
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="throughput"
                  stroke="var(--color-throughput)"
                  strokeWidth={2}
                  fill="url(#fillThroughput)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Resource usage</CardTitle>
                <CardDescription>Current system resources</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <ChartContainer config={{}} className="h-48 w-full">
                <PieChart>
                  <Pie
                    data={resourceUsage}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {resourceUsage.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            </div>
            <div className="mt-4 space-y-2">
              {resourceUsage.map((item) => (
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
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Delivery performance</CardTitle>
                <CardDescription>Success rate by day</CardDescription>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[oklch(0.6 0.2 150)]" />
                  <span className="text-muted-foreground">Success</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[oklch(0.6 0.2 40)]" />
                  <span className="text-muted-foreground">Delayed</span>
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
              <BarChart data={deliveryPerformanceData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                <Bar dataKey="delayed" stackId="a" fill="var(--color-delayed)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="failed" stackId="a" fill="var(--color-failed)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Component health</CardTitle>
                <CardDescription>System components status</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {componentHealthData.map((component) => {
                const StatusIcon = getStatusIcon(component.status);
                return (
                  <div key={component.name} className="p-3 rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <StatusIcon
                          className={`h-4 w-4 ${
                            component.status === "healthy"
                              ? "text-green-500"
                              : component.status === "warning"
                              ? "text-yellow-500"
                              : "text-red-500"
                          }`}
                        />
                        <span className="text-sm font-medium">{component.name}</span>
                      </div>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-normal ${getStatusColor(component.status)}`}>
                        {component.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-lg font-semibold">{component.uptime}%</p>
                        <p className="text-[10px] text-muted-foreground">uptime</p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold">{component.latency}ms</p>
                        <p className="text-[10px] text-muted-foreground">latency</p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold">{component.requests.toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground">req/min</p>
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
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Queue performance</CardTitle>
                <CardDescription>Performance by queue type</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {queuePerformanceData.map((queue) => (
                <div key={queue.name} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <div className={`h-3 w-3 rounded-full ${queue.color}`} />
                    <span className="text-sm font-medium">{queue.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${queue.color}`}
                        style={{ width: `${queue.successRate}%` }}
                      />
                    </div>
                    <span className="font-medium w-12 text-right">{queue.avgLatency}ms</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick stats</CardTitle>
            <CardDescription>System overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <Cpu className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm">CPU usage</span>
                </div>
                <span className="text-sm font-medium">65%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <HardDrive className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm">Memory usage</span>
                </div>
                <span className="text-sm font-medium">72%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <Gauge className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm">Disk usage</span>
                </div>
                <span className="text-sm font-medium">45%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm">Active workers</span>
                </div>
                <span className="text-sm font-medium">12</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
          <Link href="/dashboard">
            <Activity className="h-5 w-5" />
            <span className="text-sm">Back to Dashboard</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
          <Link href="/dashboard/reports">
            <BarChart3 className="h-5 w-5" />
            <span className="text-sm">Reports</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}