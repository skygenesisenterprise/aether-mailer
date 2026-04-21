"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Clock,
  Shield,
  CheckCircle,
  XCircle,
  RefreshCw,
  Calendar,
  ArrowUpRight,
  Users,
  Globe,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  MoreHorizontal,
  Mailbox,
  Dna,
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

const domainActivityData = [
  { time: "00:00", active: 340, new: 12, verified: 5 },
  { time: "04:00", active: 210, new: 8, verified: 2 },
  { time: "08:00", active: 890, new: 45, verified: 12 },
  { time: "10:00", active: 1240, new: 68, verified: 8 },
  { time: "12:00", active: 980, new: 52, verified: 6 },
  { time: "14:00", active: 1450, new: 75, verified: 15 },
  { time: "16:00", active: 1680, new: 89, verified: 11 },
  { time: "18:00", active: 1120, new: 62, verified: 7 },
  { time: "20:00", active: 720, new: 38, verified: 4 },
  { time: "22:00", active: 420, new: 18, verified: 3 },
];

const domainDistribution = [
  { type: "Verified", count: 24 },
  { type: "Pending", count: 8 },
  { type: "Failed", count: 3 },
];

const domains = [
  {
    id: 1,
    domain: "example.com",
    status: "verified",
    mx: "mx1.example.com",
    spf: "pass",
    dkim: "pass",
    dmarc: "pass",
    users: 156,
    lastActivity: "10:45:32",
  },
  {
    id: 2,
    domain: "domain.net",
    status: "verified",
    mx: "mx1.domain.net",
    spf: "pass",
    dkim: "pass",
    dmarc: "quarantine",
    users: 89,
    lastActivity: "10:44:18",
  },
  {
    id: 3,
    domain: "business.org",
    status: "pending",
    mx: "",
    spf: "none",
    dkim: "none",
    dmarc: "none",
    users: 0,
    lastActivity: "2 days ago",
  },
  {
    id: 4,
    domain: "client.net",
    status: "verified",
    mx: "mx1.client.net",
    spf: "pass",
    dkim: "fail",
    dmarc: "fail",
    users: 42,
    lastActivity: "10:42:12",
  },
  {
    id: 5,
    domain: "company.com",
    status: "failed",
    mx: "mx.company.com",
    spf: "fail",
    dkim: "fail",
    dmarc: "failed",
    users: 12,
    lastActivity: "5 days ago",
  },
];

const dnsRecords = [
  { type: "MX", priority: 10, host: "mx1.example.com", status: "active" },
  { type: "MX", priority: 20, host: "mx2.example.com", status: "active" },
  { type: "SPF", value: "v=spf1 include:_spf.example.com ~all", status: "active" },
  { type: "DKIM", selector: "default", value: "v=DKIM1;...", status: "active" },
  { type: "DMARC", value: "v=DMARC1; p=reject", status: "active" },
];

const dnsRecordsKey = (record: typeof dnsRecords[number]) => 
  record.type === "MX" ? `${record.type}-${record.priority}` : record.type;

const chartConfig = {
  active: { label: "Active", color: "oklch(0.5 0.2 150)" },
  new: { label: "New", color: "oklch(0.6 0.2 250)" },
  verified: { label: "Verified", color: "oklch(0.5 0.2 150)" },
};

function getStatusColor(status: string) {
  switch (status) {
    case "verified":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case "pending":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    case "failed":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    default:
      return "bg-slate-500/20 text-slate-400 border-slate-500/30";
  }
}

function getAuthStatusColor(status: string) {
  switch (status) {
    case "pass":
      return "text-green-500";
    case "fail":
      return "text-red-500";
    case "quarantine":
      return "text-yellow-500";
    default:
      return "text-muted-foreground";
  }
}

function getDomainIcon(status: string) {
  switch (status) {
    case "verified":
      return CheckCircle;
    case "pending":
      return Clock;
    case "failed":
      return XCircle;
    default:
      return Globe;
  }
}

export default function DirectoryDomainsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("24h");
  const [searchQuery, setSearchQuery] = useState("");
  const [domainStats, setDomainStats] = useState({
    totalDomains: 35,
    activeDomains: 28,
    pendingDomains: 5,
    failedDomains: 2,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setDomainStats((prev) => ({
        ...prev,
        totalDomains: prev.totalDomains + Math.floor(Math.random() * 1),
        activeDomains: prev.activeDomains + (Math.random() > 0.5 ? 1 : 0),
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
          <h1 className="text-2xl font-bold text-foreground">Domains</h1>
          <p className="text-sm text-muted-foreground">
            Manage email domains and DNS records
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
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Domain
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
            placeholder="Search domains..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select>
          <SelectTrigger className="w-32">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total domains"
          value={domainStats.totalDomains.toString()}
          change="+2"
          changeType="positive"
          description="vs yesterday"
          icon={Globe}
        />
        <StatsCard
          title="Verified"
          value={domainStats.activeDomains.toString()}
          change="+1"
          changeType="positive"
          description="vs yesterday"
          icon={CheckCircle}
        />
        <StatsCard
          title="Pending"
          value={domainStats.pendingDomains.toString()}
          change="+1"
          changeType="negative"
          description="vs yesterday"
          icon={Clock}
        />
        <StatsCard
          title="Failed"
          value={domainStats.failedDomains.toString()}
          change="-1"
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
                <CardTitle className="text-base">Domain activity</CardTitle>
                <CardDescription>Domains over time</CardDescription>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[oklch(0.5 0.2 150)]" />
                  <span className="text-muted-foreground">Active</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[oklch(0.6 0.2 250)]" />
                  <span className="text-muted-foreground">New</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-72 w-full min-h-70">
              <AreaChart data={domainActivityData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillActive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-active)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-active)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fillNew" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-new)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-new)" stopOpacity={0} />
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
                  dataKey="active"
                  stroke="var(--color-active)"
                  strokeWidth={2}
                  fill="url(#fillActive)"
                />
                <Area
                  type="monotone"
                  dataKey="new"
                  stroke="var(--color-new)"
                  strokeWidth={2}
                  fill="url(#fillNew)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">DNS Records</CardTitle>
                <CardDescription>Example.com records</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/directory/dns" className="gap-1">
                  View all
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dnsRecords.map((record) => (
                <div key={dnsRecordsKey(record)} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <Dna className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-sm font-medium">{record.type}</span>
                      {record.priority && (
                        <span className="text-xs text-muted-foreground block">Priority: {record.priority}</span>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-normal ${getStatusColor(record.status)}`}>
                    {record.status}
                  </Badge>
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
              <CardTitle className="text-base">Domains</CardTitle>
              <CardDescription>Manage email domains</CardDescription>
            </div>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm text-left">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="h-10 px-4 font-medium text-muted-foreground">Domain</th>
                  <th className="h-10 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="h-10 px-4 font-medium text-muted-foreground">MX Record</th>
                  <th className="h-10 px-4 font-medium text-muted-foreground">SPF</th>
                  <th className="h-10 px-4 font-medium text-muted-foreground">DKIM</th>
                  <th className="h-10 px-4 font-medium text-muted-foreground">DMARC</th>
                  <th className="h-10 px-4 font-medium text-muted-foreground">Users</th>
                  <th className="h-10 px-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {domains.map((domain) => {
                  const DomainIcon = getDomainIcon(domain.status);
                  return (
                    <tr key={domain.id} className="hover:bg-muted/50">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <DomainIcon className="h-4 w-4" />
                          <span className="font-medium">{domain.domain}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-normal ${getStatusColor(domain.status)}`}>
                          {domain.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-muted-foreground">{domain.mx || "-"}</td>
                      <td className="p-4">
                        <span className={getAuthStatusColor(domain.spf)}>{domain.spf}</span>
                      </td>
                      <td className="p-4">
                        <span className={getAuthStatusColor(domain.dkim)}>{domain.dkim}</span>
                      </td>
                      <td className="p-4">
                        <span className={getAuthStatusColor(domain.dmarc)}>{domain.dmarc}</span>
                      </td>
                      <td className="p-4 text-muted-foreground">{domain.users}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
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
          <Link href="/dashboard/directory/accounts">
            <Users className="h-5 w-5" />
            <span className="text-sm">Accounts</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
          <Link href="/dashboard/directory/groups">
            <Users className="h-5 w-5" />
            <span className="text-sm">Groups</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
          <Link href="/dashboard/directory/lists">
            <Mailbox className="h-5 w-5" />
            <span className="text-sm">Contacts</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
          <Link href="/dashboard/troubleshoot/dmarc">
            <Shield className="h-5 w-5" />
            <span className="text-sm">DMARC</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}