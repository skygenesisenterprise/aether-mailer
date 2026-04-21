"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Settings as SettingsIcon,
  Mail,
  Send,
  Bell,
  Shield,
  Lock,
  Globe,
  Clock,
  Palette,
  Monitor,
  RefreshCw,
  Save,
  User,
  Database,
  HardDrive,
  Cpu,
  Network,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const settingCategories = [
  { id: "general", name: "General", icon: SettingsIcon, count: 8 },
  { id: "security", name: "Security", icon: Shield, count: 5 },
  { id: "email", name: "Email", icon: Mail, count: 12 },
  { id: "notifications", name: "Notifications", icon: Bell, count: 6 },
  { id: "appearance", name: "Appearance", icon: Palette, count: 4 },
  { id: "api", name: "API", icon: Cpu, count: 3 },
];

const systemInfo = [
  { label: "Version", value: "2.4.1" },
  { label: "Build", value: "2024.03.15" },
  { label: "Region", value: "EU-West" },
  { label: "Uptime", value: "99.98%" },
];

const recentChanges = [
  { id: 1, setting: "SPF Record", action: "Updated", time: "2h ago", user: "admin@system.com" },
  { id: 2, setting: "DKIM Key Length", action: "Changed to 2048", time: "1d ago", user: "admin@system.com" },
  { id: 3, setting: "DMARC Policy", action: "Enabled", time: "3d ago", user: "admin@system.com" },
  { id: 4, setting: "TLS Version", action: "Min TLS 1.2", time: "1w ago", user: "admin@system.com" },
  { id: 5, setting: "Rate Limit", action: "1000/hour", time: "2w ago", user: "admin@system.com" },
];

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState("general");

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1500);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Configure your email platform settings
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={handleRefresh}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Categories</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-1 px-3 pb-3">
              {settingCategories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeCategory === category.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span>{category.name}</span>
                    </div>
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${
                      activeCategory === category.id ? "bg-primary-foreground/20 border-transparent" : ""
                    }`}>
                      {category.count}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-3 space-y-6">
          {activeCategory === "general" && (
            <>
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Globe className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">General Settings</CardTitle>
                      <CardDescription>Basic platform configuration</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="orgName">Organization Name</Label>
                      <Input id="orgName" defaultValue="Aether Mailer" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Input id="timezone" defaultValue="Europe/Paris" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Maintenance Mode</p>
                        <p className="text-xs text-muted-foreground">Temporarily disable access</p>
                      </div>
                    </div>
                    <Switch id="maintenance" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Debug Mode</p>
                        <p className="text-xs text-muted-foreground">Enable detailed logging</p>
                      </div>
                    </div>
                    <Switch id="debug" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <HardDrive className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Storage Settings</CardTitle>
                      <CardDescription>Configure storage limits</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="maxQuota">Max Quota (GB)</Label>
                      <Input id="maxQuota" type="number" defaultValue="50" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="retention">Retention (days)</Label>
                      <Input id="retention" type="number" defaultValue="365" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Auto-archive</p>
                        <p className="text-xs text-muted-foreground">Archive old emails automatically</p>
                      </div>
                    </div>
                    <Switch id="autoArchive" defaultChecked />
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {activeCategory === "security" && (
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Security Settings</CardTitle>
                    <CardDescription>Configure security policies</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Two-Factor Authentication</p>
                      <p className="text-xs text-muted-foreground">Require 2FA for all users</p>
                    </div>
                  </div>
                  <Switch id="force2fa" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">IP Allowlist</p>
                      <p className="text-xs text-muted-foreground">Restrict access by IP</p>
                    </div>
                  </div>
                  <Switch id="ipAllowlist" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Password Expiry</p>
                      <p className="text-xs text-muted-foreground">Force password changes</p>
                    </div>
                  </div>
                  <Switch id="passwordExpiry" defaultChecked />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="minLength">Minimum Password Length</Label>
                    <Input id="minLength" type="number" defaultValue="12" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">Session Timeout (min)</Label>
                    <Input id="sessionTimeout" type="number" defaultValue="30" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeCategory === "email" && (
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Email Settings</CardTitle>
                    <CardDescription>Configure email handling</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="maxSize">Max Message Size (MB)</Label>
                    <Input id="maxSize" type="number" defaultValue="25" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rateLimit">Rate Limit (per hour)</Label>
                    <Input id="rateLimit" type="number" defaultValue="1000" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Send className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">SPF Verification</p>
                      <p className="text-xs text-muted-foreground">Verify sending domains</p>
                    </div>
                  </div>
                  <Switch id="spfVerify" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">DKIM Signing</p>
                      <p className="text-xs text-muted-foreground">Sign outgoing emails</p>
                    </div>
                  </div>
                  <Switch id="dkimSigning" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">DMARC Policy</p>
                      <p className="text-xs text-muted-foreground">Enforce domain policy</p>
                    </div>
                  </div>
                  <Switch id="dmarcPolicy" defaultChecked />
                </div>
              </CardContent>
            </Card>
          )}

          {activeCategory === "appearance" && (
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Palette className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Appearance Settings</CardTitle>
                    <CardDescription>Customize platform look</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Compact Mode</p>
                      <p className="text-xs text-muted-foreground">Reduce spacing</p>
                    </div>
                  </div>
                  <Switch id="compactMode" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">24-hour Clock</p>
                      <p className="text-xs text-muted-foreground">Use 24-hour format</p>
                    </div>
                  </div>
                  <Switch id="24hourClock" defaultChecked />
                </div>
              </CardContent>
            </Card>
          )}

          {activeCategory !== "general" &&
            activeCategory !== "security" &&
            activeCategory !== "email" &&
            activeCategory !== "appearance" && (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <SettingsIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">Settings Coming Soon</p>
                    <p className="text-sm text-muted-foreground">
                      This category is under development
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Cpu className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">System Information</CardTitle>
                <CardDescription>Current platform status</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {systemInfo.map((info) => (
                <div key={info.label} className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">{info.label}</p>
                  <p className="text-sm font-medium">{info.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Recent Changes</CardTitle>
                <CardDescription>Last configuration updates</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {recentChanges.map((change) => (
                <div key={change.id} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <p className="text-sm">
                      <span className="font-medium">{change.setting}</span>
                      <span className="text-muted-foreground"> - </span>
                      {change.action}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      by {change.user}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">{change.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
          <Link href="/dashboard/account">
            <User className="h-5 w-5" />
            <span className="text-sm">Account</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
          <Link href="/dashboard/security">
            <Shield className="h-5 w-5" />
            <span className="text-sm">Security</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
          <Link href="/dashboard/network">
            <Network className="h-5 w-5" />
            <span className="text-sm">Network</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
          <Link href="/dashboard">
            <SettingsIcon className="h-5 w-5" />
            <span className="text-sm">Dashboard</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}