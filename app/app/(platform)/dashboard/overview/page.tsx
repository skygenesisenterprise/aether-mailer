"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Mail,
  Send,
  Inbox,
  Clock,
  Activity,
  Shield,
  CheckCircle,
  XCircle,
  RefreshCw,
  Calendar,
  ArrowUpRight,
  Lock,
  Database,
  Eye,
  MoreHorizontal,
  Filter,
  Search,
  User,
  MailCheck,
  Download,
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
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const emailTrafficData = [
  { time: "00:00", sent: 120, received: 340, failed: 5 },
  { time: "04:00", sent: 80, received: 210, failed: 2 },
  { time: "08:00", sent: 450, received: 890, failed: 12 },
  { time: "10:00", sent: 680, received: 1240, failed: 8 },
  { time: "12:00", sent: 520, received: 980, failed: 6 },
  { time: "14:00", sent: 750, received: 1450, failed: 15 },
  { time: "16:00", sent: 890, received: 1680, failed: 11 },
  { time: "18:00", sent: 620, received: 1120, failed: 7 },
  { time: "20:00", sent: 380, received: 720, failed: 4 },
  { time: "22:00", sent: 180, received: 420, failed: 3 },
];

const deliveryRateData = [
  { day: "Mon", success: 98.2, failed: 1.8 },
  { day: "Tue", success: 97.8, failed: 2.2 },
  { day: "Wed", success: 99.1, failed: 0.9 },
  { day: "Thu", success: 98.5, failed: 1.5 },
  { day: "Fri", success: 97.2, failed: 2.8 },
  { day: "Sat", success: 99.4, failed: 0.6 },
  { day: "Sun", success: 98.9, failed: 1.1 },
];

const recentEmails = [
  {
    id: 1,
    from: "john.doe@company.com",
    to: "admin@aether-mailer.com",
    subject: "Monthly Report - System Performance",
    status: "delivered",
    time: "2 min ago",
    size: "2.3 MB",
  },
  {
    id: 2,
    from: "newsletter@techblog.com",
    to: "users@aether-mailer.com",
    subject: "Weekly Newsletter - Tech News",
    status: "delivered",
    time: "15 min ago",
    size: "156 KB",
  },
  {
    id: 3,
    from: "support@client.com",
    to: "help@aether-mailer.com",
    subject: "IMAP connection issue",
    status: "failed",
    time: "1h ago",
    size: "45 KB",
  },
  {
    id: 4,
    from: "system@aether-mailer.com",
    to: "admin@aether-mailer.com",
    subject: "Security alert - Intrusion attempt",
    status: "delivered",
    time: "2h ago",
    size: "89 KB",
  },
  {
    id: 5,
    from: "backup@server.com",
    to: "admin@aether-mailer.com",
    subject: "Daily backup completed",
    status: "delivered",
    time: "3h ago",
    size: "1.2 GB",
  },
];

const chartConfig = {
  sent: { label: "Sent", color: "oklch(0.6 0.2 250)" },
  received: { label: "Received", color: "oklch(0.5 0.2 150)" },
  failed: { label: "Failed", color: "oklch(0.6 0.2 20)" },
};

const deliveryConfig = {
  success: { label: "Success", color: "oklch(0.6 0.2 150)" },
  failed: { label: "Failed", color: "oklch(0.6 0.2 20)" },
};

function getStatusIcon(status: string) {
  switch (status) {
    case "delivered":
      return <MailCheck className="h-4 w-4 text-green-400" />;
    case "failed":
      return <XCircle className="h-4 w-4 text-red-400" />;
    case "pending":
      return <Clock className="h-4 w-4 text-yellow-400" />;
    default:
      return <Mail className="h-4 w-4 text-slate-400" />;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "delivered":
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Delivered</Badge>;
    case "failed":
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Failed</Badge>;
    case "pending":
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pending</Badge>;
    default:
      return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">Unknown</Badge>;
  }
}

export default function OverviewPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("7j");
  const [emailStats, setEmailStats] = useState({
    sent: 1247,
    received: 3842,
    failed: 23,
    pending: 156,
    spamBlocked: 89,
    virusDetected: 2,
    delivered: 98.2,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setEmailStats((prev) => ({
        ...prev,
        sent: prev.sent + Math.floor(Math.random() * 3),
        received: prev.received + Math.floor(Math.random() * 5),
        pending: Math.max(0, prev.pending + Math.floor(Math.random() * 3) - 1),
      }));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1500);
  };

  const handleExport = () => {
    console.log("Exporting data...");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Overview</h1>
          <p className="text-sm text-muted-foreground">
            Complete analysis of your mail server performance and activities
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-36">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">24 hours</SelectItem>
              <SelectItem value="7j">7 days</SelectItem>
              <SelectItem value="30j">30 days</SelectItem>
              <SelectItem value="90j">90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Emails sent"
          value={emailStats.sent.toLocaleString()}
          change="+15%"
          changeType="positive"
          description="vs previous period"
          icon={Send}
        />
        <StatsCard
          title="Emails received"
          value={emailStats.received.toLocaleString()}
          change="+8%"
          changeType="positive"
          description="vs previous period"
          icon={Inbox}
        />
        <StatsCard
          title="Delivery rate"
          value={`${emailStats.delivered}%`}
          change="+0.3%"
          changeType="positive"
          description="vs previous period"
          icon={CheckCircle}
        />
        <StatsCard
          title="Failed emails"
          value={emailStats.failed.toString()}
          change="-5%"
          changeType="positive"
          description="vs previous period"
          icon={XCircle}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Email traffic</CardTitle>
                <CardDescription>Sent and received emails per hour</CardDescription>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[oklch(0.6 0.2 250)]" />
                  <span className="text-muted-foreground">Sent</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[oklch(0.5 0.2 150)]" />
                  <span className="text-muted-foreground">Received</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-72 w-full min-h-70">
              <AreaChart data={emailTrafficData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillSentOverview" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-sent)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-sent)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fillReceivedOverview" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-received)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-received)" stopOpacity={0} />
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
                  dataKey="received"
                  stroke="var(--color-received)"
                  strokeWidth={2}
                  fill="url(#fillReceivedOverview)"
                />
                <Area
                  type="monotone"
                  dataKey="sent"
                  stroke="var(--color-sent)"
                  strokeWidth={2}
                  fill="url(#fillSentOverview)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Security</CardTitle>
                <CardDescription>Protection status</CardDescription>
              </div>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Spam blocked</span>
              <span className="text-sm font-medium text-purple-400">{emailStats.spamBlocked}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Viruses detected</span>
              <span className="text-sm font-medium text-red-400">{emailStats.virusDetected}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Threats blocked</span>
              <span className="text-sm font-medium text-green-400">91</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: "99.8%" }} />
            </div>
            <div className="text-xs text-green-400">Protection: 99.8%</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Performance</CardTitle>
                <CardDescription>System metrics</CardDescription>
              </div>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Optimal</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Response time</span>
              <span className="text-sm font-medium text-green-400">45ms</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Current throughput</span>
              <span className="text-sm font-medium text-blue-400">1.2 Gbps</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Connections</span>
              <span className="text-sm font-medium">1,247</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-orange-500 h-2 rounded-full" style={{ width: "87%" }} />
            </div>
            <div className="text-xs text-orange-400">Efficiency: 87%</div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Storage</CardTitle>
                <CardDescription>Disk space</CardDescription>
              </div>
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Warning</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Space used</span>
              <span className="text-sm font-medium text-yellow-400">67%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total available</span>
              <span className="text-sm font-medium">180 GB</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Emails stored</span>
              <span className="text-sm font-medium text-cyan-400">2.4M</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-yellow-500 h-2 rounded-full" style={{ width: "67%" }} />
            </div>
            <div className="text-xs text-yellow-400">Cleanup recommended</div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div>
              <CardTitle className="text-base">Pending emails</CardTitle>
              <CardDescription>Queue</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Pending</span>
              <span className="text-2xl font-bold">{emailStats.pending}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Avg delay</span>
              <span className="text-sm font-medium">2.3 min</span>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-4" asChild>
              <Link href="/dashboard/queues/messages">
                View queue <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="lg:col-span-3">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Delivery rate</CardTitle>
              <CardDescription>Percentage by day</CardDescription>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-[oklch(0.5 0.2 150)]" />
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
          <ChartContainer config={deliveryConfig} className="h-64 w-full min-h-60">
            <BarChart data={deliveryRateData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent Email Activity</CardTitle>
              <CardDescription>Latest emails processed by the system</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button variant="ghost" size="sm">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {recentEmails.map((email) => (
              <div
                key={email.id}
                className="flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-muted rounded-lg">{getStatusIcon(email.status)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium truncate">{email.subject}</p>
                      {getStatusBadge(email.status)}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {email.from}
                      </span>
                      <span className="flex items-center gap-1">
                        <ArrowUpRight className="h-3 w-3" />
                        {email.to}
                      </span>
                      <span className="flex items-center gap-1">
                        <Database className="h-3 w-3" />
                        {email.size}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">{email.time}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-8 w-8">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
          <Link href="/dashboard">
            <Activity className="h-5 w-5" />
            <span className="text-sm">Dashboard</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
          <Link href="/dashboard/delivery">
            <Mail className="h-5 w-5" />
            <span className="text-sm">Delivery</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
          <Link href="/dashboard/reports/dmarc">
            <Shield className="h-5 w-5" />
            <span className="text-sm">DMARC Report</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
          <Link href="/dashboard/reports/tls">
            <Lock className="h-5 w-5" />
            <span className="text-sm">TLS Report</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
