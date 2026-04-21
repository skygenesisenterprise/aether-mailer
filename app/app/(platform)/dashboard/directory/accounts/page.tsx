"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  RefreshCw,
  Calendar,
  ArrowUpRight,
  Users,
  UserPlus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  MoreHorizontal,
  UserCog,
  UserCheck,
  UserX,
  Building,
  Contact,
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

const accountActivityData = [
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

const accountDistribution = [
  { type: "Admin", count: 45 },
  { type: "User", count: 1245 },
  { type: "Guest", count: 89 },
  { type: "Service", count: 32 },
];

const accounts = [
  {
    id: 1,
    name: "John Doe",
    email: "john.doe@example.com",
    role: "admin",
    status: "active",
    domain: "example.com",
    lastLogin: "10:45:32",
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane.smith@domain.net",
    role: "user",
    status: "active",
    domain: "domain.net",
    lastLogin: "10:44:18",
  },
  {
    id: 3,
    name: "Bob Wilson",
    email: "bob@business.org",
    role: "user",
    status: "inactive",
    domain: "business.org",
    lastLogin: "2 days ago",
  },
  {
    id: 4,
    name: "Alice Brown",
    email: "alice@client.net",
    role: "admin",
    status: "active",
    domain: "client.net",
    lastLogin: "10:42:12",
  },
  {
    id: 5,
    name: "Charlie Davis",
    email: "charlie@company.com",
    role: "guest",
    status: "suspended",
    domain: "company.com",
    lastLogin: "5 days ago",
  },
];

const roles = [
  { role: "Admin", permissions: "Full access", count: 45 },
  { role: "User", permissions: "Standard access", count: 1245 },
  { role: "Guest", permissions: "Limited access", count: 89 },
  { role: "Service", permissions: "API access", count: 32 },
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
    case "suspended":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    case "pending":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    default:
      return "bg-slate-500/20 text-slate-400 border-slate-500/30";
  }
}

function getRoleColor(role: string) {
  switch (role) {
    case "admin":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "user":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case "guest":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    case "service":
      return "bg-purple-500/20 text-purple-400 border-purple-500/30";
    default:
      return "bg-slate-500/20 text-slate-400 border-slate-500/30";
  }
}

function getAccountIcon(status: string) {
  switch (status) {
    case "active":
      return UserCheck;
    case "inactive":
      return UserCog;
    case "suspended":
      return UserX;
    default:
      return Users;
  }
}

export default function DirectoryAccountsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("24h");
  const [searchQuery, setSearchQuery] = useState("");
  const [accountStats, setAccountStats] = useState({
    totalAccounts: 1411,
    activeAccounts: 1289,
    newAccounts: 42,
    suspendedAccounts: 18,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setAccountStats((prev) => ({
        ...prev,
        totalAccounts: prev.totalAccounts + Math.floor(Math.random() * 2),
        activeAccounts: prev.activeAccounts + Math.floor(Math.random() * 2),
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
          <h1 className="text-2xl font-bold text-foreground">Accounts</h1>
          <p className="text-sm text-muted-foreground">
            Manage user accounts and permissions
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
            Add Account
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
            placeholder="Search accounts..."
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
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
        <Select>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="guest">Guest</SelectItem>
            <SelectItem value="service">Service</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total accounts"
          value={accountStats.totalAccounts.toLocaleString()}
          change="+12"
          changeType="positive"
          description="vs yesterday"
          icon={Users}
        />
        <StatsCard
          title="Active accounts"
          value={accountStats.activeAccounts.toLocaleString()}
          change="+8"
          changeType="positive"
          description="vs yesterday"
          icon={UserCheck}
        />
        <StatsCard
          title="New accounts"
          value={accountStats.newAccounts.toString()}
          change="+3"
          changeType="positive"
          description="vs yesterday"
          icon={UserPlus}
        />
        <StatsCard
          title="Suspended"
          value={accountStats.suspendedAccounts.toString()}
          change="-2"
          changeType="positive"
          description="vs yesterday"
          icon={UserX}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Account activity</CardTitle>
                <CardDescription>Accounts over time</CardDescription>
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
              <AreaChart data={accountActivityData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                <CardTitle className="text-base">Role distribution</CardTitle>
                <CardDescription>Accounts by role</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/directory/roles" className="gap-1">
                  View all
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {roles.map((item) => (
                <div key={item.role} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <UserCog className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-sm font-medium">{item.role}</span>
                      <span className="text-xs text-muted-foreground block">{item.permissions}</span>
                    </div>
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
              <CardTitle className="text-base">Accounts</CardTitle>
              <CardDescription>Manage user accounts</CardDescription>
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
                  <th className="h-10 px-4 font-medium text-muted-foreground">Name</th>
                  <th className="h-10 px-4 font-medium text-muted-foreground">Email</th>
                  <th className="h-10 px-4 font-medium text-muted-foreground">Role</th>
                  <th className="h-10 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="h-10 px-4 font-medium text-muted-foreground">Domain</th>
                  <th className="h-10 px-4 font-medium text-muted-foreground">Last Login</th>
                  <th className="h-10 px-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {accounts.map((account) => {
                  const AccountIcon = getAccountIcon(account.status);
                  return (
                    <tr key={account.id} className="hover:bg-muted/50">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <AccountIcon className="h-4 w-4" />
                          <span className="font-medium">{account.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">{account.email}</td>
                      <td className="p-4">
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-normal ${getRoleColor(account.role)}`}>
                          {account.role}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-normal ${getStatusColor(account.status)}`}>
                          {account.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-muted-foreground">{account.domain}</td>
                      <td className="p-4 text-muted-foreground">{account.lastLogin}</td>
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
          <Link href="/dashboard/directory/domains">
            <Building className="h-5 w-5" />
            <span className="text-sm">Domains</span>
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
            <Contact className="h-5 w-5" />
            <span className="text-sm">Contacts</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
          <Link href="/dashboard/directory/roles">
            <UserCog className="h-5 w-5" />
            <span className="text-sm">Roles</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}