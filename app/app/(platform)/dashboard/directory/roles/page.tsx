"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  RefreshCw,
  Calendar,
  ArrowUpRight,
  Users,
  ShieldPlus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  MoreHorizontal,
  UserCog,
  LockOpen,
  KeyRound,
  Check,
  X,
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

const roleActivityData = [
  { time: "00:00", admin: 12, user: 340, guest: 85 },
  { time: "04:00", admin: 8, user: 210, guest: 45 },
  { time: "08:00", admin: 45, user: 890, guest: 220 },
  { time: "10:00", admin: 68, user: 1240, guest: 310 },
  { time: "12:00", admin: 52, user: 980, guest: 245 },
  { time: "14:00", admin: 75, user: 1450, guest: 380 },
  { time: "16:00", admin: 89, user: 1680, guest: 420 },
  { time: "18:00", admin: 62, user: 1120, guest: 290 },
  { time: "20:00", admin: 38, user: 720, guest: 180 },
  { time: "22:00", admin: 18, user: 420, guest: 95 },
];

const roles = [
  {
    id: 1,
    name: "Super Admin",
    description: "Full system access",
    users: 5,
    permissions: 24,
    status: "active",
    type: "system",
  },
  {
    id: 2,
    name: "Domain Admin",
    description: "Manage domain settings",
    users: 12,
    permissions: 18,
    status: "active",
    type: "custom",
  },
  {
    id: 3,
    name: "User",
    description: "Standard user access",
    users: 1245,
    permissions: 8,
    status: "active",
    type: "system",
  },
  {
    id: 4,
    name: "Guest",
    description: "Limited access",
    users: 89,
    permissions: 3,
    status: "active",
    type: "system",
  },
  {
    id: 5,
    name: "Auditor",
    description: "Read-only access",
    users: 8,
    permissions: 5,
    status: "inactive",
    type: "custom",
  },
];

const permissions = [
  { category: "Users", read: true, write: true, delete: false },
  { category: "Domains", read: true, write: true, delete: true },
  { category: "Groups", read: true, write: true, delete: false },
  { category: "Messages", read: true, write: true, delete: true },
  { category: "Reports", read: true, write: false, delete: false },
  { category: "Settings", read: true, write: true, delete: false },
];

const chartConfig = {
  admin: { label: "Admin", color: "oklch(0.6 0.2 20)" },
  user: { label: "User", color: "oklch(0.5 0.2 150)" },
  guest: { label: "Guest", color: "oklch(0.6 0.2 80)" },
};

function getStatusColor(status: string) {
  switch (status) {
    case "active":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case "inactive":
      return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    default:
      return "bg-slate-500/20 text-slate-400 border-slate-500/30";
  }
}

function getRoleTypeColor(type: string) {
  switch (type) {
    case "system":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "custom":
      return "bg-purple-500/20 text-purple-400 border-purple-500/30";
    default:
      return "bg-slate-500/20 text-slate-400 border-slate-500/30";
  }
}

function getRoleIcon(type: string) {
  switch (type) {
    case "system":
      return Shield;
    case "custom":
      return UserCog;
    default:
      return KeyRound;
  }
}

function PermissionIcon({ enabled }: { enabled: boolean }) {
  return enabled ? (
    <Check className="h-4 w-4 text-green-500" />
  ) : (
    <X className="h-4 w-4 text-red-500" />
  );
}

export default function DirectoryRolesPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("24h");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleStats, setRoleStats] = useState({
    totalRoles: 12,
    systemRoles: 5,
    customRoles: 7,
    totalPermissions: 58,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setRoleStats((prev) => ({
        ...prev,
        totalRoles: prev.totalRoles + Math.floor(Math.random() * 1),
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
          <h1 className="text-2xl font-bold text-foreground">Roles</h1>
          <p className="text-sm text-muted-foreground">
            Manage roles and permissions
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
            <ShieldPlus className="h-4 w-4 mr-2" />
            Create Role
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
            placeholder="Search roles..."
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
            <SelectItem value="system">System</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
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
          title="Total roles"
          value={roleStats.totalRoles.toString()}
          change="+1"
          changeType="positive"
          description="vs yesterday"
          icon={KeyRound}
        />
        <StatsCard
          title="System roles"
          value={roleStats.systemRoles.toString()}
          change="0"
          changeType="positive"
          description="built-in"
          icon={Shield}
        />
        <StatsCard
          title="Custom roles"
          value={roleStats.customRoles.toString()}
          change="+1"
          changeType="positive"
          description="vs yesterday"
          icon={UserCog}
        />
        <StatsCard
          title="Permissions"
          value={roleStats.totalPermissions.toString()}
          change="+2"
          changeType="positive"
          description="total available"
          icon={LockOpen}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Role usage</CardTitle>
                <CardDescription>Active sessions by role</CardDescription>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[oklch(0.6 0.2 20)]" />
                  <span className="text-muted-foreground">Admin</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[oklch(0.5 0.2 150)]" />
                  <span className="text-muted-foreground">User</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-72 w-full min-h-70">
              <AreaChart data={roleActivityData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillAdmin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-admin)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-admin)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fillUser" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-user)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-user)" stopOpacity={0} />
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
                  dataKey="user"
                  stroke="var(--color-user)"
                  strokeWidth={2}
                  fill="url(#fillUser)"
                />
                <Area
                  type="monotone"
                  dataKey="admin"
                  stroke="var(--color-admin)"
                  strokeWidth={2}
                  fill="url(#fillAdmin)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Permission Matrix</CardTitle>
                <CardDescription>Sample role permissions</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/directory/permissions" className="gap-1">
                  View all
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground px-2">
                <span className="flex-1">Category</span>
                <span className="w-12 text-center">Read</span>
                <span className="w-12 text-center">Write</span>
                <span className="w-12 text-center">Delete</span>
              </div>
              {permissions.map((perm) => (
                <div key={perm.category} className="flex items-center justify-between p-2 rounded border border-border">
                  <span className="text-sm flex-1">{perm.category}</span>
                  <div className="w-12 flex justify-center">
                    <PermissionIcon enabled={perm.read} />
                  </div>
                  <div className="w-12 flex justify-center">
                    <PermissionIcon enabled={perm.write} />
                  </div>
                  <div className="w-12 flex justify-center">
                    <PermissionIcon enabled={perm.delete} />
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
              <CardTitle className="text-base">Roles</CardTitle>
              <CardDescription>Manage user roles</CardDescription>
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
                  <th className="h-10 px-4 font-medium text-muted-foreground">Role Name</th>
                  <th className="h-10 px-4 font-medium text-muted-foreground">Description</th>
                  <th className="h-10 px-4 font-medium text-muted-foreground">Type</th>
                  <th className="h-10 px-4 font-medium text-muted-foreground">Users</th>
                  <th className="h-10 px-4 font-medium text-muted-foreground">Permissions</th>
                  <th className="h-10 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="h-10 px-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {roles.map((role) => {
                  const RoleIcon = getRoleIcon(role.type);
                  return (
                    <tr key={role.id} className="hover:bg-muted/50">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <RoleIcon className="h-4 w-4" />
                          <span className="font-medium">{role.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">{role.description}</td>
                      <td className="p-4">
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-normal ${getRoleTypeColor(role.type)}`}>
                          {role.type}
                        </Badge>
                      </td>
                      <td className="p-4 text-muted-foreground">{role.users}</td>
                      <td className="p-4 text-muted-foreground">{role.permissions}</td>
                      <td className="p-4">
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-normal ${getStatusColor(role.status)}`}>
                          {role.status}
                        </Badge>
                      </td>
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
            <Shield className="h-5 w-5" />
            <span className="text-sm">Domains</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
          <Link href="/dashboard/directory/groups">
            <UserCog className="h-5 w-5" />
            <span className="text-sm">Groups</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
          <Link href="/dashboard/directory/api_keys">
            <KeyRound className="h-5 w-5" />
            <span className="text-sm">API Keys</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}