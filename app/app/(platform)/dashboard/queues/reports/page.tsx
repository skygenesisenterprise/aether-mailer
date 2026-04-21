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
  HardDrive,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
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
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const queueTrafficData = [
  { time: "00:00", priority: 12, outbound: 45, transactional: 28 },
  { time: "04:00", priority: 8, outbound: 32, transactional: 15 },
  { time: "08:00", priority: 45, outbound: 120, transactional: 85 },
  { time: "10:00", priority: 68, outbound: 180, transactional: 120 },
  { time: "12:00", priority: 52, outbound: 145, transactional: 95 },
  { time: "14:00", priority: 75, outbound: 210, transactional: 140 },
  { time: "16:00", priority: 89, outbound: 245, transactional: 168 },
  { time: "18:00", priority: 62, outbound: 175, transactional: 110 },
  { time: "20:00", priority: 38, outbound: 95, transactional: 65 },
  { time: "22:00", priority: 18, outbound: 55, transactional: 32 },
];

const queuePerformanceData = [
  { day: "Mon", success: 98.5, failed: 1.5, latency: 120 },
  { day: "Tue", success: 97.2, failed: 2.8, latency: 145 },
  { day: "Wed", success: 99.1, failed: 0.9, latency: 98 },
  { day: "Thu", success: 98.8, failed: 1.2, latency: 112 },
  { day: "Fri", success: 96.5, failed: 3.5, latency: 180 },
  { day: "Sat", success: 99.4, failed: 0.6, latency: 85 },
  { day: "Sun", success: 99.2, failed: 0.8, latency: 92 },
];

const queueHealthData = [
  { name: "Priority", status: "healthy", throughput: 450, latency: 45, errorRate: 0.2, capacity: 78 },
  { name: "Outbound", status: "healthy", throughput: 1250, latency: 120, errorRate: 1.2, capacity: 65 },
  { name: "Transactional", status: "warning", throughput: 820, latency: 280, errorRate: 2.8, capacity: 82 },
];

const queueVolumeData = [
  { name: "Priority", volume: 520, color: "bg-red-500" },
  { name: "Outbound", volume: 1240, color: "bg-blue-500" },
  { name: "Transactional", volume: 380, color: "bg-green-500" },
];

const chartConfig = {
  priority: { label: "Priority", color: "oklch(0.6 0.2 20)" },
  outbound: { label: "Outbound", color: "oklch(0.6 0.2 250)" },
  transactional: { label: "Transactional", color: "oklch(0.6 0.2 150)" },
};

const performanceConfig = {
  success: { label: "Success", color: "oklch(0.6 0.2 150)" },
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

function getTrendIcon(trend: string) {
  switch (trend) {
    case "up":
      return TrendingUp;
    case "down":
      return TrendingDown;
    default:
      return Minus;
  }
}

export default function QueuesReportsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("24h");
  const [queueStats, setQueueStats] = useState({
    totalProcessed: 48234,
    successRate: 98.2,
    avgLatency: 142,
    errorRate: 1.8,
    activeQueues: 3,
    pendingMessages: 42,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setQueueStats((prev) => ({
        ...prev,
        totalProcessed: prev.totalProcessed + Math.floor(Math.random() * 5),
        avgLatency: Math.max(50, prev.avgLatency + Math.floor(Math.random() * 10) - 5),
        pendingMessages: Math.max(0, prev.pendingMessages + Math.floor(Math.random() * 3) - 1),
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
          <h1 className="text-2xl font-bold text-foreground">Queue Reports</h1>
          <p className="text-sm text-muted-foreground">
            Performance metrics and analytics for email queues
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
          title="Total processed"
          value={queueStats.totalProcessed.toLocaleString()}
          change="+12%"
          changeType="positive"
          description="vs yesterday"
          icon={Mail}
        />
        <StatsCard
          title="Success rate"
          value={`${queueStats.successRate}%`}
          change="+0.3%"
          changeType="positive"
          description="vs yesterday"
          icon={CheckCircle}
        />
        <StatsCard
          title="Avg latency"
          value={`${queueStats.avgLatency}ms`}
          change="-15ms"
          changeType="positive"
          description="vs yesterday"
          icon={Clock}
        />
        <StatsCard
          title="Error rate"
          value={`${queueStats.errorRate}%`}
          change="-0.2%"
          changeType="positive"
          description="vs yesterday"
          icon={AlertTriangle}
        />
        <StatsCard
          title="Pending"
          value={queueStats.pendingMessages.toString()}
          change="+5"
          changeType="negative"
          description="in queue"
          icon={Activity}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Queue traffic</CardTitle>
                <CardDescription>Messages processed per hour</CardDescription>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[oklch(0.6 0.2 20)]" />
                  <span className="text-muted-foreground">Priority</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[oklch(0.6 0.2 250)]" />
                  <span className="text-muted-foreground">Outbound</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[oklch(0.6 0.2 150)]" />
                  <span className="text-muted-foreground">Transactional</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-72 w-full min-h-70">
              <AreaChart data={queueTrafficData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillPriority" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-priority)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-priority)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fillOutbound" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-outbound)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-outbound)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fillTransactional" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-transactional)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-transactional)" stopOpacity={0} />
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
                  dataKey="priority"
                  stroke="var(--color-priority)"
                  strokeWidth={2}
                  fill="url(#fillPriority)"
                />
                <Area
                  type="monotone"
                  dataKey="outbound"
                  stroke="var(--color-outbound)"
                  strokeWidth={2}
                  fill="url(#fillOutbound)"
                />
                <Area
                  type="monotone"
                  dataKey="transactional"
                  stroke="var(--color-transactional)"
                  strokeWidth={2}
                  fill="url(#fillTransactional)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Queue health</CardTitle>
                <CardDescription>Current status by queue</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/queues/messages" className="gap-1">
                  View messages
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {queueHealthData.map((queue) => {
                const StatusIcon = getStatusIcon(queue.status);
                return (
                  <div key={queue.name} className="p-3 rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <StatusIcon
                          className={`h-4 w-4 ${
                            queue.status === "healthy"
                              ? "text-green-500"
                              : queue.status === "warning"
                              ? "text-yellow-500"
                              : "text-red-500"
                          }`}
                        />
                        <span className="text-sm font-medium">{queue.name}</span>
                      </div>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-normal ${getStatusColor(queue.status)}`}>
                        {queue.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-lg font-semibold">{queue.throughput}</p>
                        <p className="text-[10px] text-muted-foreground">msg/min</p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold">{queue.latency}ms</p>
                        <p className="text-[10px] text-muted-foreground">latency</p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold">{queue.errorRate}%</p>
                        <p className="text-[10px] text-muted-foreground">errors</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Capacity</span>
                        <span>{queue.capacity}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            queue.capacity > 80 ? "bg-red-500" : queue.capacity > 60 ? "bg-yellow-500" : "bg-green-500"
                          }`}
                          style={{ width: `${queue.capacity}%` }}
                        />
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
                <CardTitle className="text-base">Delivery performance</CardTitle>
                <CardDescription>Success rate by day</CardDescription>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[oklch(0.6 0.2 150)]" />
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
            <ChartContainer config={performanceConfig} className="h-64 w-full min-h-60">
              <BarChart data={queuePerformanceData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                <CardTitle className="text-base">Queue volume</CardTitle>
                <CardDescription>Distribution by queue type</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {queueVolumeData.map((queue) => (
                <div key={queue.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-3 w-3 rounded-full ${queue.color}`} />
                    <span className="text-sm">{queue.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${queue.color}`}
                        style={{ width: `${(queue.volume / 2000) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-12 text-right">
                      {queue.volume}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total volume</span>
                <span className="font-semibold">2,140 messages</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Latency trends</CardTitle>
                <CardDescription>Average latency over time (ms)</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ latency: { label: "Latency", color: "oklch(0.6 0.2 280)" } }} className="h-64 w-full min-h-60">
              <LineChart data={queuePerformanceData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                <Line
                  type="monotone"
                  dataKey="latency"
                  stroke="oklch(0.6 0.2 280)"
                  strokeWidth={2}
                  dot={{ fill: "oklch(0.6 0.2 280)", strokeWidth: 2 }}
                />
              </LineChart>
            </ChartContainer>
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
                    <Server className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm">Active queues</span>
                </div>
                <span className="text-sm font-medium">{queueStats.activeQueues}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <HardDrive className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm">Queue capacity</span>
                </div>
                <span className="text-sm font-medium">75%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm">Throughput</span>
                </div>
                <span className="text-sm font-medium">4,823/min</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm">Pending messages</span>
                </div>
                <span className="text-sm font-medium">{queueStats.pendingMessages}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
          <Link href="/dashboard/queues/messages">
            <Mail className="h-5 w-5" />
            <span className="text-sm">Queue Messages</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
          <Link href="/dashboard/delivery">
            <Activity className="h-5 w-5" />
            <span className="text-sm">Delivery Status</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
