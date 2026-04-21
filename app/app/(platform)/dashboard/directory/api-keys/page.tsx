"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Key,
  KeyRound,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  RefreshCw,
  Eye,
  Edit,
  Copy,
  EyeOff,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Shield,
  Globe,
  Terminal,
  Settings,
  Users,
  Zap,
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

const apiKeys = [
  {
    id: 1,
    name: "Production API Key",
    keyId: "aether_prod_001",
    prefix: "aether_prod_",
    type: "api_key",
    scopes: ["mail.read", "mail.send", "contacts.read"],
    status: "active",
    createdAt: "2024-01-15",
    lastUsed: "2 min ago",
    expiresAt: "2025-01-15",
  },
  {
    id: 2,
    name: "Development Key",
    keyId: "aether_dev_002",
    prefix: "aether_dev_",
    type: "api_key",
    scopes: ["mail.read"],
    status: "active",
    createdAt: "2024-02-20",
    lastUsed: "1h ago",
    expiresAt: null,
  },
  {
    id: 3,
    name: "Analytics Key",
    keyId: "aether_analytics_003",
    prefix: "aether_analytics_",
    type: "api_key",
    scopes: ["stats.read", "reports.read"],
    status: "active",
    createdAt: "2023-11-05",
    lastUsed: "5 min ago",
    expiresAt: null,
  },
  {
    id: 4,
    name: "Legacy Key",
    keyId: "aether_legacy_004",
    prefix: "aether_legacy_",
    type: "api_key",
    scopes: ["mail.read"],
    status: "revoked",
    createdAt: "2023-09-12",
    lastUsed: "30 days ago",
    expiresAt: "2024-09-12",
  },
  {
    id: 5,
    name: "Admin Key",
    keyId: "aether_admin_005",
    prefix: "aether_admin_",
    type: "api_key",
    scopes: ["admin.read", "admin.write", "users.read", "users.write"],
    status: "active",
    createdAt: "2024-03-01",
    lastUsed: "10 min ago",
    expiresAt: "2025-03-01",
  },
];

const scopes = [
  { id: "mail.read", name: "Read emails", count: 4 },
  { id: "mail.send", name: "Send emails", count: 1 },
  { id: "contacts.read", name: "Read contacts", count: 1 },
  { id: "admin.read", name: "Admin read", count: 1 },
  { id: "admin.write", name: "Admin write", count: 1 },
  { id: "users.read", name: "Read users", count: 1 },
  { id: "users.write", name: "Write users", count: 1 },
  { id: "stats.read", name: "Read statistics", count: 1 },
];

const recentActivity = [
  { id: 1, action: "Key created", key: "Admin Key", user: "admin@system.com", time: "5 min ago" },
  { id: 2, action: "Key rotated", key: "Production API Key", user: "admin@system.com", time: "1h ago" },
  { id: 3, action: "Key revoked", key: "Legacy Key", user: "admin@system.com", time: "2h ago" },
  { id: 4, action: "Key accessed", key: "Analytics Key", user: "analytics@system.com", time: "3h ago" },
  { id: 5, action: "Key updated", key: "Development Key", user: "developer@system.com", time: "5h ago" },
];

function getStatusColor(status: string) {
  switch (status) {
    case "active":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case "revoked":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    case "pending":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    case "expired":
      return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    default:
      return "bg-slate-500/20 text-slate-400 border-slate-500/30";
  }
}

function getScopeColor(scope: string) {
  if (scope.includes("admin") || scope.includes("write")) {
    return "bg-red-500/20 text-red-400 border-red-500/30";
  }
  if (scope.includes("read")) {
    return "bg-blue-500/20 text-blue-400 border-blue-500/30";
  }
  return "bg-slate-500/20 text-slate-400 border-slate-500/30";
}

export default function DirectoryApikeysPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [keyStats, setKeyStats] = useState({
    totalKeys: 5,
    activeKeys: 4,
    expiringSoon: 1,
    revoked: 1,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setKeyStats((prev) => ({
        ...prev,
        activeKeys: prev.activeKeys + Math.floor(Math.random() * 2) - 1,
      }));
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1500);
  };

  const filteredKeys = apiKeys.filter((key) => {
    const matchesStatus = selectedStatus === "all" || key.status === selectedStatus;
    const matchesSearch =
      key.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      key.keyId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">API Keys</h1>
          <p className="text-sm text-muted-foreground">
            Manage API keys for programmatic access
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Create Key
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Keys"
          value={keyStats.totalKeys.toString()}
          change="+1"
          changeType="positive"
          description="registered keys"
          icon={Key}
        />
        <StatsCard
          title="Active Keys"
          value={keyStats.activeKeys.toString()}
          change="0"
          changeType="positive"
          description="operational"
          icon={CheckCircle}
        />
        <StatsCard
          title="Expiring Soon"
          value={keyStats.expiringSoon.toString()}
          change="0"
          changeType="negative"
          description="within 30 days"
          icon={AlertTriangle}
        />
        <StatsCard
          title="Revoked"
          value={keyStats.revoked.toString()}
          change="0"
          changeType="neutral"
          description="disabled"
          icon={XCircle}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base">All API Keys</CardTitle>
                <CardDescription>Manage your API keys</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search keys..."
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
                    <SelectItem value="revoked">Revoked</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Key ID</TableHead>
                  <TableHead>Scopes</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredKeys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                          <KeyRound className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{key.name}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-mono text-muted-foreground">{key.keyId}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-48">
                        {key.scopes.slice(0, 2).map((scope) => (
                          <Badge key={scope} variant="outline" className={`text-[10px] px-1.5 py-0 ${getScopeColor(scope)}`}>
                            {scope}
                          </Badge>
                        ))}
                        {key.scopes.length > 2 && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            +{key.scopes.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${getStatusColor(key.status)}`}>
                        {key.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">{key.lastUsed}</span>
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
                <CardTitle className="text-base">Available Scopes</CardTitle>
                <CardDescription>API permission scopes</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/directory/api-keys/scopes" className="gap-1">
                  Manage
                  <Eye className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {scopes.map((scope) => (
                <div key={scope.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-mono">{scope.id}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{scope.count} keys</span>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <h4 className="text-sm font-medium mb-4">Quick Settings</h4>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Zap className="h-4 w-4 mr-2" />
                  Rate limiting
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="h-4 w-4 mr-2" />
                  Security policies
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  Default scopes
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
                <CardDescription>Latest API key modifications</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/directory/api-keys/activity" className="gap-1">
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
                    ) : activity.action.includes("revoked") ? (
                      <XCircle className="h-4 w-4 text-red-500" />
                    ) : activity.action.includes("rotated") ? (
                      <RefreshCw className="h-4 w-4 text-yellow-500" />
                    ) : activity.action.includes("accessed") ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Edit className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{activity.action}</span>
                      <span className="text-muted-foreground"> - </span>
                      <span className="font-medium">{activity.key}</span>
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
              <CardDescription>Common API key operations</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="h-4 w-4 mr-2" />
                Create new API key
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Copy className="h-4 w-4 mr-2" />
                Copy key values
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <RefreshCw className="h-4 w-4 mr-2" />
                Rotate keys
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <EyeOff className="h-4 w-4 mr-2" />
                Hide sensitive data
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
          <Link href="/directory/oauth-clients">
            <KeyRound className="h-5 w-5" />
            <span className="text-sm">OAuth Clients</span>
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