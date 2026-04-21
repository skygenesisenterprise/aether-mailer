"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Mail,
  Inbox,
  Shield,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Calendar,
  ArrowUpRight,
  FileText,
  Search,
  Filter,
  Download,
  Play,
  AlertOctagon,
  Route,
  HardDrive,
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
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const deliveryIssuesData = [
  { time: "00:00", delays: 12, failed: 5, bounced: 8 },
  { time: "04:00", delays: 8, failed: 2, bounced: 3 },
  { time: "08:00", delays: 45, failed: 12, bounced: 18 },
  { time: "10:00", delays: 68, failed: 8, bounced: 15 },
  { time: "12:00", delays: 52, failed: 6, bounced: 10 },
  { time: "14:00", delays: 75, failed: 15, bounced: 22 },
  { time: "16:00", delays: 89, failed: 11, bounced: 19 },
  { time: "18:00", delays: 62, failed: 7, bounced: 12 },
  { time: "20:00", delays: 38, failed: 4, bounced: 8 },
  { time: "22:00", delays: 18, failed: 3, bounced: 5 },
];

const issueDistribution = [
  { type: "Bounce", count: 342, percentage: 42 },
  { type: "Delay", count: 234, percentage: 28 },
  { type: "Timeout", count: 128, percentage: 15 },
  { type: "DNS", count: 67, percentage: 8 },
  { type: "Auth", count: 52, percentage: 7 },
];

const failedDeliveries = [
  {
    id: 1,
    recipient: "user1@example.com",
    reason: "550 Mail rejected",
    status: "failed",
    timestamp: "10:45:32",
    server: "mx1.example.com",
  },
  {
    id: 2,
    recipient: "user2@domain.net",
    reason: "Connection timeout",
    status: "retrying",
    timestamp: "10:44:18",
    server: "mx2.domain.net",
  },
  {
    id: 3,
    recipient: "user3@business.org",
    reason: "DNS not found",
    status: "failed",
    timestamp: "10:43:55",
    server: "mx3.business.org",
  },
  {
    id: 4,
    recipient: "user4@client.net",
    reason: "TLS handshake failed",
    status: "retrying",
    timestamp: "10:42:12",
    server: "mx1.client.net",
  },
  {
    id: 5,
    recipient: "user5@company.com",
    reason: "Quota exceeded",
    status: "failed",
    timestamp: "10:41:03",
    server: "mx2.company.com",
  },
];

const queueStatus = [
  { queue: "Outbound", count: 1245, status: "active" },
  { queue: "Retry", count: 342, status: "active" },
  { queue: "Hold", count: 89, status: "paused" },
  { queue: "Dead Letter", count: 23, status: "active" },
];

const diagnosticResults = [
  {
    id: 1,
    test: "SMTP Connection",
    status: "passed",
    duration: "125ms",
    details: "Connection successful",
  },
  {
    id: 2,
    test: "DNS Resolution",
    status: "passed",
    duration: "45ms",
    details: "Records resolved",
  },
  {
    id: 3,
    test: "TLS Handshake",
    status: "passed",
    duration: "82ms",
    details: "TLS 1.3 negotiated",
  },
  {
    id: 4,
    test: "Authentication",
    status: "warning",
    duration: "32ms",
    details: "SPF soft fail",
  },
  {
    id: 5,
    test: "DKIM Signing",
    status: "passed",
    duration: "18ms",
    details: "Signed successfully",
  },
];

const chartConfig = {
  delays: { label: "Delays", color: "oklch(0.6 0.2 80)" },
  failed: { label: "Failed", color: "oklch(0.6 0.2 20)" },
  bounced: { label: "Bounced", color: "oklch(0.6 0.2 50)" },
};

const issueConfig = {
  bounce: { label: "Bounce", color: "oklch(0.6 0.2 20)" },
  delay: { label: "Delay", color: "oklch(0.6 0.2 80)" },
  timeout: { label: "Timeout", color: "oklch(0.6 0.2 50)" },
};

function getStatusColor(status: string) {
  switch (status) {
    case "passed":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case "warning":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    case "failed":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    case "retrying":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    default:
      return "bg-slate-500/20 text-slate-400 border-slate-500/30";
  }
}

function getDeliveryIcon(status: string) {
  switch (status) {
    case "failed":
      return XCircle;
    case "retrying":
      return RefreshCw;
    default:
      return Mail;
  }
}

function getQueueStatusColor(status: string) {
  switch (status) {
    case "active":
      return "text-green-500";
    case "paused":
      return "text-yellow-500";
    default:
      return "text-slate-500";
  }
}

export default function TroubleshootDeliveryPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("24h");
  const [searchQuery, setSearchQuery] = useState("");
  const [deliveryStats, setDeliveryStats] = useState({
    failedCount: 482,
    retryCount: 128,
    bouncedCount: 342,
    queuedCount: 1245,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setDeliveryStats((prev) => ({
        ...prev,
        failedCount: prev.failedCount + Math.floor(Math.random() * 2),
        retryCount: prev.retryCount + Math.floor(Math.random() * 3),
      }));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1500);
  };

  const handleRetryAll = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Delivery Troubleshooting</h1>
          <p className="text-sm text-muted-foreground">
            Diagnose and resolve email delivery issues
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
          <Button variant="outline" size="sm" onClick={handleRetryAll}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry All
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
            placeholder="Search by recipient or message ID..."
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
            <SelectItem value="all">All Issues</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="retrying">Retrying</SelectItem>
            <SelectItem value="bounced">Bounced</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Failed deliveries"
          value={deliveryStats.failedCount.toString()}
          change="+12"
          changeType="negative"
          description="vs yesterday"
          icon={XCircle}
        />
        <StatsCard
          title="In retry queue"
          value={deliveryStats.retryCount.toString()}
          change="+8"
          changeType="negative"
          description="vs yesterday"
          icon={RefreshCw}
        />
        <StatsCard
          title="Bounced"
          value={deliveryStats.bouncedCount.toString()}
          change="-15"
          changeType="positive"
          description="vs yesterday"
          icon={AlertTriangle}
        />
        <StatsCard
          title="In queue"
          value={deliveryStats.queuedCount.toLocaleString()}
          change="+120"
          changeType="negative"
          description="vs yesterday"
          icon={Inbox}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Delivery issues</CardTitle>
                <CardDescription>Issues over time</CardDescription>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[oklch(0.6 0.2 80)]" />
                  <span className="text-muted-foreground">Delays</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[oklch(0.6 0.2 20)]" />
                  <span className="text-muted-foreground">Failed</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-72 w-full min-h-70">
              <AreaChart data={deliveryIssuesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillDelays" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-delays)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-delays)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fillFailed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-failed)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-failed)" stopOpacity={0} />
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
                  dataKey="failed"
                  stroke="var(--color-failed)"
                  strokeWidth={2}
                  fill="url(#fillFailed)"
                />
                <Area
                  type="monotone"
                  dataKey="delays"
                  stroke="var(--color-delays)"
                  strokeWidth={2}
                  fill="url(#fillDelays)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Issue types</CardTitle>
                <CardDescription>Distribution</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {issueDistribution.map((item) => (
                <div key={item.type} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <AlertOctagon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{item.type}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-red-500"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{item.count}</span>
                  </div>
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
                <CardTitle className="text-base">Failed deliveries</CardTitle>
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
              {failedDeliveries.map((delivery) => {
                const DeliveryIcon = getDeliveryIcon(delivery.status);
                return (
                  <div key={delivery.id} className="flex items-center gap-3 px-6 py-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      <DeliveryIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{delivery.recipient}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-normal ${getStatusColor(delivery.status)}`}>
                          {delivery.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{delivery.reason}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium">{delivery.server}</span>
                      <span className="text-xs text-muted-foreground ml-2 block">{delivery.timestamp}</span>
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
                <CardTitle className="text-base">Queue Status</CardTitle>
                <CardDescription>Current queues</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/queues" className="gap-1">
                  Manage
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {queueStatus.map((queue) => (
                <div key={queue.queue} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <HardDrive className={`h-4 w-4 ${getQueueStatusColor(queue.status)}`} />
                    <span className="text-sm font-medium">{queue.queue}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">{queue.count.toLocaleString()}</span>
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-normal ${getStatusColor(queue.status)}`}>
                      {queue.status}
                    </Badge>
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
              <CardTitle className="text-base">Diagnostic Tests</CardTitle>
              <CardDescription>Run delivery diagnostics</CardDescription>
            </div>
            <Button>
              <Play className="h-4 w-4 mr-2" />
              Run Tests
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm text-left">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="h-10 px-4 font-medium text-muted-foreground">Test</th>
                  <th className="h-10 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="h-10 px-4 font-medium text-muted-foreground">Duration</th>
                  <th className="h-10 px-4 font-medium text-muted-foreground">Details</th>
                  <th className="h-10 px-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {diagnosticResults.map((result) => (
                  <tr key={result.id} className="hover:bg-muted/50">
                    <td className="p-4 font-medium">{result.test}</td>
                    <td className="p-4">
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-normal ${getStatusColor(result.status)}`}>
                        {result.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-muted-foreground">{result.duration}</td>
                    <td className="p-4 text-muted-foreground">{result.details}</td>
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
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
          <Link href="/dashboard/troubleshoot/dmarc">
            <Shield className="h-5 w-5" />
            <span className="text-sm">DMARC</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
          <Link href="/dashboard/queues">
            <HardDrive className="h-5 w-5" />
            <span className="text-sm">Queues</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
          <Link href="/dashboard/history/delivery">
            <Route className="h-5 w-5" />
            <span className="text-sm">History</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
          <Link href="/dashboard/reports">
            <FileText className="h-5 w-5" />
            <span className="text-sm">Reports</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}