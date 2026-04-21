"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Mail,
  Shield,
  RefreshCw,
  Calendar,
  Users,
  UserPlus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  MoreHorizontal,
  Group,
  UserCheck,
  UserX,
  UserMinus,
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

const groupActivityData = [
  { time: "00:00", active: 340, new: 12, removed: 5 },
  { time: "04:00", active: 210, new: 8, removed: 2 },
  { time: "08:00", active: 890, new: 45, removed: 12 },
  { time: "10:00", active: 1240, new: 68, removed: 8 },
  { time: "12:00", active: 980, new: 52, removed: 6 },
  { time: "14:00", active: 1450, new: 75, removed: 15 },
  { time: "16:00", active: 1680, new: 89, removed: 11 },
  { time: "18:00", active: 1120, new: 62, removed: 7 },
  { time: "20:00", active: 720, new: 38, removed: 4 },
  { time: "22:00", active: 420, new: 18, removed: 3 },
];

const groupDistribution = [
  { type: "Distribution", count: 12 },
  { type: "Security", count: 8 },
  { type: "Dynamic", count: 5 },
  { type: "System", count: 3 },
];

const groups = [
  {
    id: 1,
    name: "Engineering Team",
    type: "distribution",
    members: 45,
    status: "active",
    owner: "john.doe@example.com",
    lastActivity: "10:45:32",
  },
  {
    id: 2,
    name: "Marketing",
    type: "distribution",
    members: 28,
    status: "active",
    owner: "jane.smith@domain.net",
    lastActivity: "10:44:18",
  },
  {
    id: 3,
    name: "IT Security",
    type: "security",
    members: 12,
    status: "active",
    owner: "admin@company.com",
    lastActivity: "1h ago",
  },
  {
    id: 4,
    name: "All Employees",
    type: "dynamic",
    members: 342,
    status: "active",
    owner: "hr@client.net",
    lastActivity: "10:42:12",
  },
  {
    id: 5,
    name: "Temp Contractors",
    type: "dynamic",
    members: 15,
    status: "inactive",
    owner: "admin@company.com",
    lastActivity: "2 days ago",
  },
];

const groupMembers = [
  { user: "John Doe", email: "john.doe@example.com", role: "Owner", status: "active" },
  { user: "Jane Smith", email: "jane.smith@domain.net", role: "Member", status: "active" },
  { user: "Bob Wilson", email: "bob@business.org", role: "Member", status: "pending" },
  { user: "Alice Brown", email: "alice@client.net", role: "Member", status: "active" },
];

const chartConfig = {
  active: { label: "Active", color: "oklch(0.5 0.2 150)" },
  new: { label: "New", color: "oklch(0.6 0.2 250)" },
  removed: { label: "Removed", color: "oklch(0.6 0.2 20)" },
};

function getStatusColor(status: string) {
  switch (status) {
    case "active":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case "inactive":
      return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    case "pending":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    default:
      return "bg-slate-500/20 text-slate-400 border-slate-500/30";
  }
}

function getGroupTypeColor(type: string) {
  switch (type) {
    case "distribution":
      return "text-blue-500";
    case "security":
      return "text-red-500";
    case "dynamic":
      return "text-green-500";
    case "system":
      return "text-purple-500";
    default:
      return "text-muted-foreground";
  }
}

function getGroupIcon(status: string) {
  switch (status) {
    case "active":
      return UserCheck;
    case "inactive":
      return UserX;
    default:
      return Group;
  }
}

export default function DirectoryGroupsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("24h");
  const [searchQuery, setSearchQuery] = useState("");
  const [groupStats, setGroupStats] = useState({
    totalGroups: 28,
    activeGroups: 24,
    members: 442,
    pendingRequests: 12,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setGroupStats((prev) => ({
        ...prev,
        totalGroups: prev.totalGroups + Math.floor(Math.random() * 1),
        activeGroups: prev.activeGroups + (Math.random() > 0.5 ? 1 : 0),
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
          <h1 className="text-2xl font-bold text-foreground">Groups</h1>
          <p className="text-sm text-muted-foreground">
            Manage distribution and security groups
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
            <UserPlus className="h-4 w-4 mr-2" />
            Create Group
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
            placeholder="Search groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select>
          <SelectTrigger className="w-32">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="distribution">Distribution</SelectItem>
            <SelectItem value="security">Security</SelectItem>
            <SelectItem value="dynamic">Dynamic</SelectItem>
          </SelectContent>
        </Select>
        <Select>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total groups"
          value={groupStats.totalGroups.toString()}
          change="+2"
          changeType="positive"
          description="vs yesterday"
          icon={Group}
        />
        <StatsCard
          title="Active groups"
          value={groupStats.activeGroups.toString()}
          change="+1"
          changeType="positive"
          description="vs yesterday"
          icon={UserCheck}
        />
        <StatsCard
          title="Total members"
          value={groupStats.members.toLocaleString()}
          change="+12"
          changeType="positive"
          description="vs yesterday"
          icon={Users}
        />
        <StatsCard
          title="Pending"
          value={groupStats.pendingRequests.toString()}
          change="+3"
          changeType="negative"
          description="vs yesterday"
          icon={UserMinus}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Group activity</CardTitle>
                <CardDescription>Groups over time</CardDescription>
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
              <AreaChart data={groupActivityData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                <CardTitle className="text-base">Group types</CardTitle>
                <CardDescription>Distribution by type</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {groupDistribution.map((item) => (
                <div key={item.type} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <Group className={`h-4 w-4 ${getGroupTypeColor(item.type.toLowerCase())}`} />
                    <span className="text-sm font-medium">{item.type}</span>
                  </div>
                  <span className="text-sm font-medium">{item.count}</span>
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
              <CardTitle className="text-base">Groups</CardTitle>
              <CardDescription>Manage email groups</CardDescription>
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
                  <th className="h-10 px-4 font-medium text-muted-foreground">Group Name</th>
                  <th className="h-10 px-4 font-medium text-muted-foreground">Type</th>
                  <th className="h-10 px-4 font-medium text-muted-foreground">Members</th>
                  <th className="h-10 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="h-10 px-4 font-medium text-muted-foreground">Owner</th>
                  <th className="h-10 px-4 font-medium text-muted-foreground">Last Activity</th>
                  <th className="h-10 px-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {groups.map((group) => {
                  const GroupIcon = getGroupIcon(group.status);
                  return (
                    <tr key={group.id} className="hover:bg-muted/50">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <GroupIcon className="h-4 w-4" />
                          <span className="font-medium">{group.name}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-normal ${getGroupTypeColor(group.type)}`}>
                          {group.type}
                        </Badge>
                      </td>
                      <td className="p-4 text-muted-foreground">{group.members}</td>
                      <td className="p-4">
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-normal ${getStatusColor(group.status)}`}>
                          {group.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-muted-foreground">{group.owner}</td>
                      <td className="p-4 text-muted-foreground">{group.lastActivity}</td>
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
          <Link href="/dashboard/directory/domains">
            <Group className="h-5 w-5" />
            <span className="text-sm">Domains</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
          <Link href="/dashboard/directory/lists">
            <Mail className="h-5 w-5" />
            <span className="text-sm">Contacts</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
          <Link href="/dashboard/directory/roles">
            <Shield className="h-5 w-5" />
            <span className="text-sm">Roles</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}