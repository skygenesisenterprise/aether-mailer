"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  Mail,
  Shield,
  Settings,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  RefreshCw,
  ArrowUpRight,
  Eye,
  Edit,
  Trash2,
  Power,
  PowerOff,
  Globe,
  Lock,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
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
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const tenants = [
  {
    id: 1,
    name: "Acme Corp",
    domain: "acme.com",
    status: "active",
    users: 245,
    domains: 3,
    storage: 67,
    plan: "enterprise",
    createdAt: "2024-01-15",
    lastActive: "5 min ago",
  },
  {
    id: 2,
    name: "TechStart Inc",
    domain: "techstart.io",
    status: "active",
    users: 89,
    domains: 1,
    storage: 34,
    plan: "business",
    createdAt: "2024-02-20",
    lastActive: "1h ago",
  },
  {
    id: 3,
    name: "GlobalMedia",
    domain: "globalmedia.com",
    status: "active",
    users: 512,
    domains: 5,
    storage: 89,
    plan: "enterprise",
    createdAt: "2023-11-05",
    lastActive: "2 min ago",
  },
  {
    id: 4,
    name: "SmallBiz Co",
    domain: "smallbiz.co",
    status: "suspended",
    users: 12,
    domains: 1,
    storage: 8,
    plan: "starter",
    createdAt: "2024-03-01",
    lastActive: "3 days ago",
  },
  {
    id: 5,
    name: "EduLearn",
    domain: "edulearn.edu",
    status: "active",
    users: 1234,
    domains: 2,
    storage: 45,
    plan: "enterprise",
    createdAt: "2023-09-12",
    lastActive: "10 min ago",
  },
];

const recentActivity = [
  { id: 1, action: "Tenant created", tenant: "SmallBiz Co", user: "admin@system.com", time: "5 min ago" },
  { id: 2, action: "Plan upgraded", tenant: "Acme Corp", user: "admin@acme.com", time: "1h ago" },
  { id: 3, action: "Domain added", tenant: "GlobalMedia", user: "admin@globalmedia.com", time: "2h ago" },
  { id: 4, action: "User imported", tenant: "TechStart Inc", user: "admin@techstart.io", time: "3h ago" },
  { id: 5, action: "Tenant suspended", tenant: "SmallBiz Co", user: "admin@system.com", time: "5h ago" },
];

const plans = [
  { id: "starter", name: "Starter", color: "bg-slate-500" },
  { id: "business", name: "Business", color: "bg-blue-500" },
  { id: "enterprise", name: "Enterprise", color: "bg-purple-500" },
];

function getStatusColor(status: string) {
  switch (status) {
    case "active":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case "suspended":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    case "pending":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    default:
      return "bg-slate-500/20 text-slate-400 border-slate-500/30";
  }
}

function getPlanColor(plan: string) {
  switch (plan) {
    case "enterprise":
      return "bg-purple-500/20 text-purple-400 border-purple-500/30";
    case "business":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "starter":
      return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    default:
      return "bg-slate-500/20 text-slate-400 border-slate-500/30";
  }
}

export default function DirectoryTenantsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [tenantStats, setTenantStats] = useState({
    totalTenants: 5,
    activeTenants: 4,
    totalUsers: 2092,
    suspended: 1,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setTenantStats((prev) => ({
        ...prev,
        totalUsers: prev.totalUsers + Math.floor(Math.random() * 3) - 1,
      }));
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1500);
  };

  const filteredTenants = tenants.filter((tenant) => {
    const matchesStatus = selectedStatus === "all" || tenant.status === selectedStatus;
    const matchesSearch =
      tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.domain.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Directory Tenants</h1>
          <p className="text-sm text-muted-foreground">
            Manage multi-tenant organizations and their configurations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Create Tenant
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Tenants"
          value={tenantStats.totalTenants.toString()}
          change="+1"
          changeType="positive"
          description="organizations"
          icon={Building2}
        />
        <StatsCard
          title="Active Tenants"
          value={tenantStats.activeTenants.toString()}
          change="0"
          changeType="neutral"
          description="operational"
          icon={CheckCircle}
        />
        <StatsCard
          title="Total Users"
          value={tenantStats.totalUsers.toLocaleString()}
          change="+156"
          changeType="positive"
          description="across tenants"
          icon={Users}
        />
        <StatsCard
          title="Suspended"
          value={tenantStats.suspended.toString()}
          change="0"
          changeType="negative"
          description="disabled"
          icon={XCircle}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base">All Tenants</CardTitle>
                <CardDescription>Manage your tenant organizations</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tenants..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-48"
                  />
                </div>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-32">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Storage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                          <Building2 className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{tenant.name}</p>
                          <p className="text-xs text-muted-foreground">{tenant.domain}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${getPlanColor(tenant.plan)}`}>
                        {tenant.plan}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm">{tenant.users.toLocaleString()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${tenant.storage}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{tenant.storage}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${getStatusColor(tenant.status)}`}>
                        {tenant.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">{tenant.lastActive}</span>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Plans Distribution</CardTitle>
                <CardDescription>Tenants by plan type</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {plans.map((plan) => {
                const count = tenants.filter((t) => t.plan === plan.id).length;
                const percentage = (count / tenants.length) * 100;
                return (
                  <div key={plan.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-3 w-3 rounded-full ${plan.color}`} />
                      <span className="text-sm font-medium">{plan.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${plan.color}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm w-6 text-right">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <h4 className="text-sm font-medium mb-4">Quick Settings</h4>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Globe className="h-4 w-4 mr-2" />
                  Global domain settings
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="h-4 w-4 mr-2" />
                  Security policies
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  Default configurations
                </Button>
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
                <CardTitle className="text-base">Recent Activity</CardTitle>
                <CardDescription>Latest tenant modifications</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/directory/tenants/activity" className="gap-1">
                  View all
                  <Eye className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 px-6 py-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    {activity.action.includes("created") ? (
                      <Plus className="h-4 w-4 text-blue-500" />
                    ) : activity.action.includes("suspended") ? (
                      <PowerOff className="h-4 w-4 text-red-500" />
                    ) : activity.action.includes("upgraded") ? (
                      <BarChart3 className="h-4 w-4 text-green-500" />
                    ) : activity.action.includes("added") ? (
                      <Globe className="h-4 w-4 text-purple-500" />
                    ) : (
                      <Users className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{activity.action}</span>
                      <span className="text-muted-foreground"> - </span>
                      <span className="font-medium">{activity.tenant}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">by {activity.user}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {activity.time}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <div>
              <CardTitle className="text-base">Quick Actions</CardTitle>
              <CardDescription>Common tenant operations</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="h-4 w-4 mr-2" />
                Create new tenant
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Bulk user import
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Shield className="h-4 w-4 mr-2" />
                Apply security policy
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Lock className="h-4 w-4 mr-2" />
                Reset tenant passwords
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
          <Link href="/directory/accounts">
            <Users className="h-5 w-5" />
            <span className="text-sm">Accounts</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
          <Link href="/directory/domains">
            <Globe className="h-5 w-5" />
            <span className="text-sm">Domains</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
          <Link href="/directory/groups">
            <Users className="h-5 w-5" />
            <span className="text-sm">Groups</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
          <Link href="/directory/roles">
            <Settings className="h-5 w-5" />
            <span className="text-sm">Roles</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}