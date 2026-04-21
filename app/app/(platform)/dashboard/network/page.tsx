"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Network,
  Wifi,
  WifiOff,
  Globe,
  Server,
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
  Database,
  Users,
  Signal,
  Antenna,
  Router,
  HardDrive,
  Cpu,
  TrendingUp,
  TrendingDown,
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

const networkTrafficData = [
  { time: "00:00", inbound: 120, outbound: 340, internal: 85 },
  { time: "04:00", inbound: 80, outbound: 210, internal: 45 },
  { time: "08:00", inbound: 450, outbound: 890, internal: 220 },
  { time: "10:00", inbound: 680, outbound: 1240, internal: 310 },
  { time: "12:00", inbound: 520, outbound: 980, internal: 245 },
  { time: "14:00", inbound: 750, outbound: 1450, internal: 380 },
  { time: "16:00", inbound: 890, outbound: 1680, internal: 420 },
  { time: "18:00", inbound: 620, outbound: 1120, internal: 290 },
  { time: "20:00", inbound: 380, outbound: 720, internal: 180 },
  { time: "22:00", inbound: 180, outbound: 420, internal: 95 },
];

const latencyData = [
  { day: "Mon", latency: 45, jitter: 12 },
  { day: "Tue", latency: 52, jitter: 15 },
  { day: "Wed", latency: 38, jitter: 8 },
  { day: "Thu", latency: 48, jitter: 11 },
  { day: "Fri", latency: 55, jitter: 18 },
  { day: "Sat", latency: 32, jitter: 5 },
  { day: "Sun", latency: 35, jitter: 6 },
];

const serverStatus = [
  { id: 1, name: "MX-1", status: "online", load: 45, uptime: "99.9%", ip: "10.0.1.10" },
  { id: 2, name: "MX-2", status: "online", load: 62, uptime: "99.8%", ip: "10.0.1.11" },
  { id: 3, name: "MX-3", status: "online", load: 38, uptime: "99.9%", ip: "10.0.1.12" },
  { id: 4, name: "MX-4", status: "warning", load: 78, uptime: "98.5%", ip: "10.0.1.13" },
];

const networkAlerts = [
  {
    id: 1,
    type: "connection",
    severity: "high",
    message: "High latency on MX-4",
    time: "5 min ago",
    server: "MX-4",
  },
  {
    id: 2,
    type: "bandwidth",
    severity: "medium",
    message: "Bandwidth usage at 85%",
    time: "15 min ago",
    server: "Gateway",
  },
  {
    id: 3,
    type: "dns",
    severity: "low",
    message: "DNS cache refreshed",
    time: "1h ago",
    server: "DNS Server",
  },
  {
    id: 4,
    type: "firewall",
    severity: "medium",
    message: "Blocked suspicious IP range",
    time: "2h ago",
    server: "Firewall",
  },
];

const connectionSummary = [
  { type: "SMTP", connections: 1245, status: "active" },
  { type: "IMAP", connections: 892, status: "active" },
  { type: "POP3", connections: 234, status: "active" },
  { type: "HTTP", connections: 567, status: "active" },
];

const protocolUsage = [
  { protocol: "IPv4", usage: 72, status: "good" },
  { protocol: "IPv6", usage: 28, status: "ok" },
];

const chartConfig = {
  inbound: { label: "Inbound", color: "oklch(0.5 0.2 150)" },
  outbound: { label: "Outbound", color: "oklch(0.6 0.2 250)" },
  internal: { label: "Internal", color: "oklch(0.6 0.2 50)" },
};

const latencyConfig = {
  latency: { label: "Latency", color: "oklch(0.5 0.2 150)" },
  jitter: { label: "Jitter", color: "oklch(0.6 0.2 20)" },
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
    case "connection":
      return Wifi;
    case "bandwidth":
      return Signal;
    case "dns":
      return Globe;
    case "firewall":
      return Shield;
    default:
      return Bell;
  }
}

function getServerStatusColor(status: string) {
  switch (status) {
    case "online":
      return "text-green-500";
    case "warning":
      return "text-yellow-500";
    case "offline":
      return "text-red-500";
    default:
      return "text-slate-500";
  }
}

function getProtocolStatusColor(status: string) {
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

export default function NetworkPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("24h");
  const [networkStats, setNetworkStats] = useState({
    totalConnections: 4823,
    activeServers: 128,
    bandwidth: 89,
    latency: 45,
    throughput: 98.2,
    errors: 12,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setNetworkStats((prev) => ({
        ...prev,
        totalConnections: prev.totalConnections + Math.floor(Math.random() * 3),
        activeServers: Math.max(1, prev.activeServers + (Math.random() > 0.5 ? 1 : -1)),
        bandwidth: Math.min(100, prev.bandwidth + Math.floor(Math.random() * 2)),
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
          <h1 className="text-2xl font-bold text-foreground">Network</h1>
          <p className="text-sm text-muted-foreground">
            Network infrastructure monitoring
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
          title="Connections"
          value={networkStats.totalConnections.toLocaleString()}
          change="+12%"
          changeType="positive"
          description="vs yesterday"
          icon={Network}
        />
        <StatsCard
          title="Active servers"
          value={networkStats.activeServers.toString()}
          change="+2"
          changeType="positive"
          description="online now"
          icon={Server}
        />
        <StatsCard
          title="Bandwidth"
          value={`${networkStats.bandwidth}%`}
          change="+5%"
          changeType="negative"
          description="vs yesterday"
          icon={Signal}
        />
        <StatsCard
          title="Latency"
          value={`${networkStats.latency}ms`}
          change="-8ms"
          changeType="positive"
          description="vs yesterday"
          icon={Clock}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Network traffic</CardTitle>
                <CardDescription>Traffic by direction</CardDescription>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[oklch(0.5 0.2 150)]" />
                  <span className="text-muted-foreground">Inbound</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[oklch(0.6 0.2 250)]" />
                  <span className="text-muted-foreground">Outbound</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-72 w-full min-h-70">
              <AreaChart data={networkTrafficData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillInbound" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-inbound)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-inbound)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fillOutbound" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-outbound)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-outbound)" stopOpacity={0} />
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
                  dataKey="outbound"
                  stroke="var(--color-outbound)"
                  strokeWidth={2}
                  fill="url(#fillOutbound)"
                />
                <Area
                  type="monotone"
                  dataKey="inbound"
                  stroke="var(--color-inbound)"
                  strokeWidth={2}
                  fill="url(#fillInbound)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Network alerts</CardTitle>
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
              {networkAlerts.map((alert) => {
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
                <CardTitle className="text-base">Latency</CardTitle>
                <CardDescription>Average latency and jitter</CardDescription>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[oklch(0.5 0.2 150)]" />
                  <span className="text-muted-foreground">Latency</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[oklch(0.6 0.2 20)]" />
                  <span className="text-muted-foreground">Jitter</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={latencyConfig} className="h-64 w-full min-h-60">
              <BarChart data={latencyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                  tickFormatter={(value) => `${value}ms`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="latency" stackId="a" fill="var(--color-latency)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="jitter" stackId="a" fill="var(--color-jitter)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Protocol Usage</CardTitle>
                <CardDescription>IP version distribution</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/network/protocols" className="gap-1">
                  Details
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {protocolUsage.map((item) => (
                <div key={item.protocol} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Globe className={`h-4 w-4 ${getProtocolStatusColor(item.status)}`} />
                    <span className="text-sm font-medium">{item.protocol}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${getProtocolStatusColor(item.status)} bg-current`}
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
                <CardTitle className="text-base">Server Status</CardTitle>
                <CardDescription>Mail server health</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/network/servers" className="gap-1">
                  View all
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {serverStatus.map((server) => (
                <div key={server.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${server.status === "online" ? "bg-green-500/20" : server.status === "warning" ? "bg-yellow-500/20" : "bg-red-500/20"}`}>
                      <Server className={`h-4 w-4 ${getServerStatusColor(server.status)}`} />
                    </div>
                    <div>
                      <span className="text-sm font-medium">{server.name}</span>
                      <span className="text-xs text-muted-foreground block">{server.ip}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{server.load}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className={`h-3.5 w-3.5 ${getServerStatusColor(server.status)}`} />
                      <span className={getServerStatusColor(server.status)}>{server.uptime}</span>
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
              <CardDescription>Network overview</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <Router className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm">Active routers</span>
                </div>
                <span className="text-sm font-medium">4</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <HardDrive className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm">Storage used</span>
                </div>
                <span className="text-sm font-medium">67%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <Antenna className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm">Throughput</span>
                </div>
                <span className="text-sm font-medium">{networkStats.throughput}%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm">Errors</span>
                </div>
                <span className="text-sm font-medium">{networkStats.errors}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
          <Link href="/dashboard/network/servers">
            <Server className="h-5 w-5" />
            <span className="text-sm">Servers</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
          <Link href="/dashboard/network/firewall">
            <Shield className="h-5 w-5" />
            <span className="text-sm">Firewall</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
          <Link href="/dashboard/network/dns">
            <Globe className="h-5 w-5" />
            <span className="text-sm">DNS</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
          <Link href="/dashboard/network/monitoring">
            <Activity className="h-5 w-5" />
            <span className="text-sm">Monitoring</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}