"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Mail,
  Inbox,
  Clock,
  Activity,
  CheckCircle,
  RefreshCw,
  Calendar,
  User,
  MailCheck,
  Eye,
  MoreHorizontal,
  Filter,
  Search,
  Archive,
  Trash2,
  FolderOpen,
  Star,
  Flag,
  Tag,
  AlertTriangle,
  Package,
  ArrowDown,
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

const receivedTimelineData = [
  { time: "00:00", received: 340, read: 280, unread: 60 },
  { time: "04:00", received: 210, read: 180, unread: 30 },
  { time: "08:00", received: 890, read: 720, unread: 170 },
  { time: "10:00", received: 1240, read: 980, unread: 260 },
  { time: "12:00", received: 980, read: 820, unread: 160 },
  { time: "14:00", received: 1450, read: 1100, unread: 350 },
  { time: "16:00", received: 1680, read: 1350, unread: 330 },
  { time: "18:00", received: 1120, read: 890, unread: 230 },
  { time: "20:00", received: 720, read: 580, unread: 140 },
  { time: "22:00", received: 420, read: 350, unread: 70 },
];

const folderStats = [
  { name: "Inbox", count: 12847, icon: Inbox },
  { name: "Sent", count: 4823, icon: Mail },
  { name: "Archive", count: 45230, icon: Archive },
  { name: "Junk", count: 234, icon: Trash2 },
  { name: "Drafts", count: 12, icon: FolderOpen },
];

const recentReceivedEmails = [
  {
    id: 1,
    from: "john.doe@company.com",
    to: "admin@aether-mailer.com",
    subject: "Monthly Report - Q4 Performance",
    status: "read",
    folder: "Inbox",
    size: "2.3 MB",
    time: "2 min ago",
    priority: "normal",
  },
  {
    id: 2,
    from: "newsletter@techblog.com",
    to: "users@aether-mailer.com",
    subject: "Weekly Newsletter - Tech News",
    status: "read",
    folder: "Inbox",
    size: "156 KB",
    time: "15 min ago",
    priority: "normal",
  },
  {
    id: 3,
    from: "support@client.com",
    to: "help@aether-mailer.com",
    subject: "Support Ticket #12345 - Resolved",
    status: "unread",
    folder: "Inbox",
    size: "45 KB",
    time: "1h ago",
    priority: "high",
  },
  {
    id: 4,
    from: "system@aether-mailer.com",
    to: "admin@aether-mailer.com",
    subject: "Security Alert - Update Required",
    status: "read",
    folder: "Inbox",
    size: "89 KB",
    time: "2h ago",
    priority: "urgent",
  },
  {
    id: 5,
    from: "billing@company.com",
    to: "customers@domain.com",
    subject: "Invoice #F2024-001 - Due 30 days",
    status: "unread",
    folder: "Archive",
    size: "234 KB",
    time: "3h ago",
    priority: "normal",
  },
  {
    id: 6,
    from: "newsletter@marketing.com",
    to: "all@company.com",
    subject: "Special Offer - 50% Off",
    status: "read",
    folder: "Junk",
    size: "1.2 MB",
    time: "1d ago",
    priority: "low",
  },
];

const chartConfig = {
  received: { label: "Received", color: "oklch(0.6 0.2 250)" },
  read: { label: "Read", color: "oklch(0.5 0.2 150)" },
  unread: { label: "Unread", color: "oklch(0.6 0.2 20)" },
};

function getStatusIcon(status: string) {
  switch (status) {
    case "read":
      return <MailCheck className="h-4 w-4 text-green-400" />;
    case "unread":
      return <Mail className="h-4 w-4 text-blue-400" />;
    default:
      return <Mail className="h-4 w-4 text-slate-400" />;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "read":
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Read</Badge>;
    case "unread":
      return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Unread</Badge>;
    default:
      return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">Unknown</Badge>;
  }
}

function getPriorityBadge(priority: string) {
  switch (priority) {
    case "urgent":
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Urgent</Badge>;
    case "high":
      return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">High</Badge>;
    case "low":
      return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">Low</Badge>;
    default:
      return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Normal</Badge>;
  }
}

function getPriorityIcon(priority: string) {
  switch (priority) {
    case "urgent":
      return <AlertTriangle className="h-3 w-3 text-red-500" />;
    case "high":
      return <Flag className="h-3 w-3 text-orange-500" />;
    case "low":
      return <Star className="h-3 w-3 text-slate-400" />;
    default:
      return <Tag className="h-3 w-3 text-blue-400" />;
  }
}

export default function ReceivedPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("24h");
  const [receivedStats, setReceivedStats] = useState({
    totalReceived: 12847,
    read: 10247,
    unread: 2600,
    archived: 45230,
    junk: 234,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setReceivedStats((prev) => ({
        ...prev,
        totalReceived: prev.totalReceived + Math.floor(Math.random() * 3),
        read: prev.read + Math.floor(Math.random() * 2),
        unread: Math.max(0, prev.unread + Math.floor(Math.random() * 2) - 1),
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
          <h1 className="text-2xl font-bold text-foreground">Received Emails</h1>
          <p className="text-sm text-muted-foreground">
            View and manage received emails history
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
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total received"
          value={receivedStats.totalReceived.toLocaleString()}
          change="+12%"
          changeType="positive"
          description="vs yesterday"
          icon={Inbox}
        />
        <StatsCard
          title="Read emails"
          value={receivedStats.read.toLocaleString()}
          change="+8%"
          changeType="positive"
          description="vs yesterday"
          icon={MailCheck}
        />
        <StatsCard
          title="Unread emails"
          value={receivedStats.unread.toLocaleString()}
          change="+15%"
          changeType="positive"
          description="vs yesterday"
          icon={Mail}
        />
        <StatsCard
          title="Archived"
          value={receivedStats.archived.toLocaleString()}
          change="+3%"
          changeType="positive"
          description="vs yesterday"
          icon={Archive}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Incoming emails</CardTitle>
                <CardDescription>Received emails over time</CardDescription>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[oklch(0.6 0.2 250)]" />
                  <span className="text-muted-foreground">Received</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[oklch(0.5 0.2 150)]" />
                  <span className="text-muted-foreground">Read</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-72 w-full min-h-70">
              <AreaChart data={receivedTimelineData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillReceived" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-received)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-received)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fillRead" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-read)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-read)" stopOpacity={0} />
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
                  fill="url(#fillReceived)"
                />
                <Area
                  type="monotone"
                  dataKey="read"
                  stroke="var(--color-read)"
                  strokeWidth={2}
                  fill="url(#fillRead)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Folders</CardTitle>
                <CardDescription>Email distribution</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {folderStats.map((folder) => (
              <div key={folder.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <folder.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{folder.name}</span>
                </div>
                <span className="text-sm font-medium">{folder.count.toLocaleString()}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent received emails</CardTitle>
              <CardDescription>Latest emails received</CardDescription>
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
            {recentReceivedEmails.map((email) => (
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
                      {getPriorityBadge(email.priority)}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {email.from}
                      </span>
                      <span className="flex items-center gap-1">
                        <ArrowDown className="h-3 w-3" />
                        {email.to}
                      </span>
                      <span className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        {email.size}
                      </span>
                      <span className="flex items-center gap-1">
                        <FolderOpen className="h-3 w-3" />
                        {email.folder}
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
                      <Archive className="h-4 w-4" />
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
          <Link href="/dashboard/history/delivery">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm">Sent Emails</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
          <Link href="/dashboard/overview">
            <Clock className="h-5 w-5" />
            <span className="text-sm">Overview</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}