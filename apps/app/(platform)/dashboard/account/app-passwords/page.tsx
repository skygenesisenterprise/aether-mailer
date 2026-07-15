"use client";

import { useState } from "react";
import Link from "next/link";
import {
  KeyRound,
  Plus,
  Filter,
  MoreHorizontal,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Shield,
  Settings,
  User,
  Mail,
  Smartphone,
  Trash2,
  Globe,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const appPasswords = [
  {
    id: 1,
    name: "Thunderbird Mail",
    service: "Email Client",
    lastUsed: "2 min ago",
    createdAt: "2024-01-15",
    lastAccessedIp: "192.168.1.100",
    status: "active",
  },
  {
    id: 2,
    name: "iPhone Mail App",
    service: "Mobile",
    lastUsed: "1h ago",
    createdAt: "2024-02-20",
    lastAccessedIp: "192.168.1.101",
    status: "active",
  },
  {
    id: 3,
    name: "Python Script",
    service: "Automation",
    lastUsed: "3 days ago",
    createdAt: "2023-11-05",
    lastAccessedIp: "10.0.0.50",
    status: "active",
  },
  {
    id: 4,
    name: "Old Laptop",
    service: "Email Client",
    lastUsed: "2 weeks ago",
    createdAt: "2023-09-12",
    lastAccessedIp: "10.0.0.25",
    status: "revoked",
  },
  {
    id: 5,
    name: "Marketing Tool",
    service: "Third Party",
    lastUsed: "1 month ago",
    createdAt: "2023-08-01",
    lastAccessedIp: "172.16.0.100",
    status: "expired",
  },
];

const recentActivity = [
  { id: 1, action: "Password created", app: "Marketing Tool", time: "5 min ago", ip: "192.168.1.100" },
  { id: 2, action: "Password revoked", app: "Old Laptop", time: "1h ago", ip: "192.168.1.100" },
  { id: 3, action: "Password used", app: "Thunderbird Mail", time: "2h ago", ip: "192.168.1.100" },
  { id: 4, action: "Password used", app: "iPhone Mail App", time: "3h ago", ip: "192.168.1.101" },
  { id: 5, action: "Password expired", app: "Marketing Tool", time: "5h ago", ip: "system" },
];

function getStatusColor(status: string) {
  switch (status) {
    case "active":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case "revoked":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    case "expired":
      return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    default:
      return "bg-slate-500/20 text-slate-400 border-slate-500/30";
  }
}

function getServiceIcon(service: string) {
  switch (service) {
    case "Email Client":
      return Mail;
    case "Mobile":
      return Smartphone;
    case "Automation":
      return Settings;
    case "Third Party":
      return Globe;
    default:
      return KeyRound;
  }
}

export default function AccountApppasswordsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1500);
  };

  const handleGeneratePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 24; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedPassword(password);
    setShowPassword(true);
  };

  const filteredPasswords = appPasswords.filter((p) => {
    if (selectedStatus === "all") return true;
    return p.status === selectedStatus;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Application Passwords</h1>
          <p className="text-sm text-muted-foreground">
            Manage passwords for third-party apps and services
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={handleGeneratePassword}>
            <Plus className="h-4 w-4 mr-2" />
            Generate Password
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/20">
                <KeyRound className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{appPasswords.length}</p>
                <p className="text-sm text-muted-foreground">Total passwords</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{appPasswords.filter((p) => p.status === "active").length}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20">
                <XCircle className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{appPasswords.filter((p) => p.status === "revoked").length}</p>
                <p className="text-sm text-muted-foreground">Revoked</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/20">
                <Clock className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{appPasswords.filter((p) => p.status === "expired").length}</p>
                <p className="text-sm text-muted-foreground">Expired</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {generatedPassword && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/20">
                  <KeyRound className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <CardTitle className="text-base">New Password Generated</CardTitle>
                  <CardDescription>Copy this password now - it won't be shown again</CardDescription>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setGeneratedPassword("")}>
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Input
                value={generatedPassword}
                readOnly
                className="font-mono bg-muted"
                type={showPassword ? "text" : "password"}
              />
              <Button variant="outline" size="icon" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="icon" onClick={() => navigator.clipboard.writeText(generatedPassword)}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-yellow-500 mt-2">
              <AlertTriangle className="inline h-3 w-3 mr-1" />
              Make sure to copy and save this password. It will not be visible after you leave this page.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base">All Application Passwords</CardTitle>
                <CardDescription>Manage your generated passwords</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-32">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
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
                  <TableHead>Service</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPasswords.map((app) => {
                  const ServiceIcon = getServiceIcon(app.service);
                  return (
                    <TableRow key={app.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                            <KeyRound className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{app.name}</p>
                            <p className="text-xs text-muted-foreground">IP: {app.lastAccessedIp}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <ServiceIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{app.service}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">{app.lastUsed}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">{app.createdAt}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${getStatusColor(app.status)}`}>
                          {app.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Security Tips</CardTitle>
                <CardDescription>Best practices</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Use unique passwords</p>
                  <p className="text-xs text-muted-foreground">Generate a separate password for each app</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Revoke unused passwords</p>
                  <p className="text-xs text-muted-foreground">Remove passwords you no longer need</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Store securely</p>
                  <p className="text-xs text-muted-foreground">Use a password manager to save passwords</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Passwords don't expire</p>
                  <p className="text-xs text-muted-foreground">Manually revoke if needed</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Recent Activity</CardTitle>
                <CardDescription>Password usage history</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 px-6 py-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    {activity.action.includes("created") ? (
                      <Plus className="h-4 w-4 text-green-500" />
                    ) : activity.action.includes("revoked") ? (
                      <XCircle className="h-4 w-4 text-red-500" />
                    ) : activity.action.includes("used") ? (
                      <CheckCircle className="h-4 w-4 text-blue-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{activity.action}</span>
                      <span className="text-muted-foreground"> - </span>
                      <span className="font-medium">{activity.app}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.ip} - {activity.time}
                    </p>
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
              <Button variant="outline" className="w-full justify-start" onClick={handleGeneratePassword}>
                <Plus className="h-4 w-4 mr-2" />
                Generate new password
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <KeyRound className="h-4 w-4 mr-2" />
                View password requirements
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Trash2 className="h-4 w-4 mr-2" />
                Revoke all unused
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Shield className="h-4 w-4 mr-2" />
                Security settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
          <Link href="/account/profile">
            <User className="h-5 w-5" />
            <span className="text-sm">Profile</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
          <Link href="/account/password">
            <KeyRound className="h-5 w-5" />
            <span className="text-sm">Password</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
          <Link href="/account/mfa">
            <Shield className="h-5 w-5" />
            <span className="text-sm">MFA</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
          <Link href="/account/notifications">
            <Mail className="h-5 w-5" />
            <span className="text-sm">Notifications</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}