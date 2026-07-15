"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  List,
  ListOrdered,
  Mail,
  Users,
  UserPlus,
  Download,
  Upload,
  Search,
  Filter,
  MoreHorizontal,
  Plus,
  Trash2,
  Edit,
  Eye,
  Settings,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const listTypes = [
  { id: "distribution", label: "Distribution List", count: 156, icon: Users },
  { id: "suppression", label: "Suppression List", count: 234, icon: XCircle },
  { id: "allowlist", label: "Allowlist", count: 89, icon: CheckCircle },
  { id: "quarantine", label: "Quarantine List", count: 12, icon: AlertTriangle },
];

const distributionLists = [
  {
    id: 1,
    name: "engineering-team",
    displayName: "Engineering Team",
    members: 45,
    type: "distribution",
    status: "active",
    createdAt: "2024-01-15",
    description: "All engineering department members",
  },
  {
    id: 2,
    name: "marketing-group",
    displayName: "Marketing Group",
    members: 23,
    type: "distribution",
    status: "active",
    createdAt: "2024-02-20",
    description: "Marketing department communications",
  },
  {
    id: 3,
    name: "all-staff",
    displayName: "All Staff",
    members: 312,
    type: "distribution",
    status: "active",
    createdAt: "2023-11-05",
    description: "Complete company-wide distribution",
  },
  {
    id: 4,
    name: "executives",
    displayName: "Executives",
    members: 8,
    type: "distribution",
    status: "active",
    createdAt: "2023-09-12",
    description: "Executive leadership communications",
  },
  {
    id: 5,
    name: "bounced-emails",
    displayName: "Bounced Emails",
    members: 156,
    type: "suppression",
    status: "suppressed",
    createdAt: "2024-03-01",
    description: "Emails that bounced - auto-suppressed",
  },
  {
    id: 6,
    name: "unsubscribed",
    displayName: "Unsubscribed",
    members: 78,
    type: "suppression",
    status: "suppressed",
    createdAt: "2024-02-15",
    description: "Users who opted out",
  },
];

const recentActivity = [
  { id: 1, action: "Member added", list: "engineering-team", user: "john@company.com", time: "5 min ago" },
  { id: 2, action: "List created", list: "marketing-group", user: "admin@company.com", time: "1h ago" },
  { id: 3, action: "Member removed", list: "all-staff", user: "sarah@company.com", time: "2h ago" },
  { id: 4, action: "Export completed", list: "bounced-emails", user: "system", time: "3h ago" },
  { id: 5, action: "Members imported", list: "executives", user: "admin@company.com", time: "5h ago" },
];

function getStatusColor(status: string) {
  switch (status) {
    case "active":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case "suppressed":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    case "pending":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    default:
      return "bg-slate-500/20 text-slate-400 border-slate-500/30";
  }
}

export default function DirectoryListsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedType, setSelectedType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [listStats, setListStats] = useState({
    totalLists: 491,
    totalMembers: 4823,
    active: 156,
    suppressed: 234,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setListStats((prev) => ({
        ...prev,
        totalMembers: prev.totalMembers + Math.floor(Math.random() * 3) - 1,
      }));
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1500);
  };

  const filteredLists = distributionLists.filter((list) => {
    const matchesType = selectedType === "all" || list.type === selectedType;
    const matchesSearch =
      list.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      list.displayName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Directory Lists</h1>
          <p className="text-sm text-muted-foreground">
            Manage distribution lists, suppression lists, and allowlists
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Members</DialogTitle>
                <DialogDescription>
                  Upload a CSV file to add members to a list
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <p className="text-sm text-muted-foreground">
                  Import functionality coming soon...
                </p>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Create List
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Lists"
          value={listStats.totalLists.toString()}
          change="+12"
          changeType="positive"
          description="all types"
          icon={List}
        />
        <StatsCard
          title="Total Members"
          value={listStats.totalMembers.toLocaleString()}
          change="+156"
          changeType="positive"
          description="across all lists"
          icon={Users}
        />
        <StatsCard
          title="Distribution Lists"
          value={listStats.active.toString()}
          change="+3"
          changeType="positive"
          description="active"
          icon={ListOrdered}
        />
        <StatsCard
          title="Suppressed"
          value={listStats.suppressed.toString()}
          change="+24"
          changeType="negative"
          description="blocked emails"
          icon={XCircle}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base">All Lists</CardTitle>
                <CardDescription>Manage your mailing lists</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search lists..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-48"
                  />
                </div>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-40">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="distribution">Distribution</SelectItem>
                    <SelectItem value="suppression">Suppression</SelectItem>
                    <SelectItem value="allowlist">Allowlist</SelectItem>
                    <SelectItem value="quarantine">Quarantine</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLists.map((list) => (
                  <TableRow key={list.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                          <List className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{list.displayName}</p>
                          <p className="text-xs text-muted-foreground">{list.name}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {list.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{list.members.toLocaleString()}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${getStatusColor(list.status)}`}>
                        {list.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{list.createdAt}</span>
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
                <CardTitle className="text-base">List Types</CardTitle>
                <CardDescription>Categories overview</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/directory/lists/types" className="gap-1">
                  Manage
                  <Eye className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {listTypes.map((type) => (
                <div key={type.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      <type.icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <span className="text-sm font-medium">{type.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{type.count}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Settings className="h-3.5 w-3.5" />
                    </Button>
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
                <CardTitle className="text-base">Recent Activity</CardTitle>
                <CardDescription>Latest list modifications</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/directory/lists/activity" className="gap-1">
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
                    {activity.action.includes("added") ? (
                      <UserPlus className="h-4 w-4 text-green-500" />
                    ) : activity.action.includes("removed") ? (
                      <Trash2 className="h-4 w-4 text-red-500" />
                    ) : activity.action.includes("created") ? (
                      <Plus className="h-4 w-4 text-blue-500" />
                    ) : activity.action.includes("import") ? (
                      <Download className="h-4 w-4 text-yellow-500" />
                    ) : (
                      <Edit className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{activity.action}</span>
                      <span className="text-muted-foreground"> on </span>
                      <span className="font-medium">{activity.list}</span>
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
              <CardDescription>Common operations</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="h-4 w-4 mr-2" />
                Create new distribution list
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Download className="h-4 w-4 mr-2" />
                Export all lists
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Upload className="h-4 w-4 mr-2" />
                Import members from CSV
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Mail className="h-4 w-4 mr-2" />
                Send test email
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
            <List className="h-5 w-5" />
            <span className="text-sm">Domains</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
          <Link href="/directory/groups">
            <ListOrdered className="h-5 w-5" />
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