"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Shield,
  Smartphone,
  Mail,
  KeyRound,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  RefreshCw,
  Settings,
  User,
  Lock,
  QrCode,
  Copy,
  Trash2,
  Monitor,
  Tablet,
  Globe,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const mfaMethods = [
  {
    id: 1,
    name: "Authenticator App",
    description: "Use Google Authenticator, Authy, or similar apps",
    icon: Smartphone,
    enabled: true,
    method: "totp",
    lastUsed: "2 min ago",
    createdAt: "2024-01-15",
  },
  {
    id: 2,
    name: "Email Verification",
    description: "Receive verification codes via email",
    icon: Mail,
    enabled: true,
    method: "email",
    lastUsed: "1h ago",
    createdAt: "2023-11-05",
  },
  {
    id: 3,
    name: "SMS Verification",
    description: "Receive verification codes via SMS",
    icon: Globe,
    enabled: false,
    method: "sms",
    lastUsed: null,
    createdAt: null,
  },
  {
    id: 4,
    name: "Hardware Key",
    description: "Use a physical security key (YubiKey, etc.)",
    icon: KeyRound,
    enabled: false,
    method: "webauthn",
    lastUsed: null,
    createdAt: null,
  },
];

const trustedDevices = [
  { id: 1, device: "Chrome on MacOS", location: "Paris, France", browser: "Chrome 122", lastSeen: "2 min ago", trusted: true },
  { id: 2, device: "Safari on iPhone", location: "Paris, France", browser: "Safari 17", lastSeen: "1h ago", trusted: true },
  { id: 3, device: "Firefox on Windows", location: "Lyon, France", browser: "Firefox 123", lastSeen: "3 days ago", trusted: false },
  { id: 4, device: "Edge on Windows", location: "Berlin, Germany", browser: "Edge 122", lastSeen: "1 week ago", trusted: false },
];

const backupCodes = [
  "A1B2-C3D4", "E5F6-G7H8", "I9J0-K1L2", "M3N4-O5P6",
  "Q7R8-S9T0", "U1V2-W3X4", "Y5Z6-A7B8", "C9D0-E1F2",
];

const recentActivity = [
  { id: 1, action: "2FA enabled", method: "Authenticator App", time: "2 days ago", ip: "192.168.1.100" },
  { id: 2, action: "Backup codes regenerated", method: "System", time: "2 days ago", ip: "192.168.1.100" },
  { id: 3, action: "Login from new device", method: "Safari on iPhone", time: "5 days ago", ip: "192.168.1.101" },
  { id: 4, action: "2FA disabled", method: "SMS Verification", time: "2 weeks ago", ip: "10.0.0.50" },
];

function getStatusColor(enabled: boolean) {
  return enabled
    ? "bg-green-500/20 text-green-400 border-green-500/30"
    : "bg-slate-500/20 text-slate-400 border-slate-500/30";
}

export default function AccountMfaPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");

  const handleSave = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1500);
  };

  const handleToggleMethod = (methodId: number) => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Multi-Factor Authentication</h1>
          <p className="text-sm text-muted-foreground">
            Manage your account's security and authentication methods
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">2</p>
                <p className="text-sm text-muted-foreground">Methods enabled</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/20">
                <Smartphone className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">4</p>
                <p className="text-sm text-muted-foreground">Trusted devices</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/20">
                <KeyRound className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">8</p>
                <p className="text-sm text-muted-foreground">Backup codes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/20">
                <Shield className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">High</p>
                <p className="text-sm text-muted-foreground">Security level</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Authentication Methods</CardTitle>
                  <CardDescription>Manage your 2FA methods</CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {mfaMethods.map((method) => {
              const Icon = method.icon;
              return (
                <div
                  key={method.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border"
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${method.enabled ? "bg-green-500/20" : "bg-muted"}`}>
                      <Icon className={`h-5 w-5 ${method.enabled ? "text-green-500" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{method.name}</p>
                      <p className="text-xs text-muted-foreground">{method.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getStatusColor(method.enabled)}>
                      {method.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                    <Button
                      variant={method.enabled ? "outline" : "default"}
                      size="sm"
                      onClick={() => handleToggleMethod(method.id)}
                    >
                      {method.enabled ? "Disable" : "Enable"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <KeyRound className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Backup Codes</CardTitle>
                  <CardDescription>Use when you cannot access 2FA</CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Save these codes safely</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Each code can only be used once. Store them in a secure location.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((code, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 rounded border border-border bg-muted/50"
                >
                  <span className="text-xs font-mono">{code}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1">
                <Copy className="h-4 w-4 mr-2" />
                Copy all codes
              </Button>
              <Button variant="outline" className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Monitor className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Trusted Devices</CardTitle>
                  <CardDescription>Devices that remember your 2FA</CardDescription>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Revoke All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {trustedDevices.map((device) => (
                <div key={device.id} className="flex items-center justify-between px-6 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      {device.device.includes("iPhone") || device.device.includes("iPad") ? (
                        <Smartphone className="h-4 w-4 text-muted-foreground" />
                      ) : device.device.includes("Mac") ? (
                        <Monitor className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Tablet className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {device.device}
                        {device.trusted && (
                          <Badge variant="outline" className="ml-2 text-[10px] px-1.5 py-0 bg-green-500/20 text-green-400 border-green-500/30">
                            Trusted
                          </Badge>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {device.location} - {device.browser}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{device.lastSeen}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
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
                <CardTitle className="text-base">Recent Activity</CardTitle>
                <CardDescription>2FA-related events</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 px-6 py-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    {activity.action.includes("enabled") ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : activity.action.includes("disabled") ? (
                      <XCircle className="h-4 w-4 text-red-500" />
                    ) : activity.action.includes("codes") ? (
                      <RefreshCw className="h-4 w-4 text-yellow-500" />
                    ) : (
                      <Smartphone className="h-4 w-4 text-blue-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{activity.action}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.method} - {activity.ip}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <QrCode className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Setup Authenticator App</CardTitle>
                <CardDescription>Scan QR code to add account</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center p-6">
              <div className="w-48 h-48 bg-white rounded-lg border-2 border-dashed border-muted-foreground flex items-center justify-center mb-4">
                <div className="text-center">
                  <QrCode className="h-16 w-16 mx-auto text-muted-foreground mb-2" />
                  <p className="text-xs text-muted-foreground">QR Code</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
              </p>
              <div className="flex gap-2 w-full">
                <Button variant="outline" className="flex-1">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy secret key
                </Button>
                <Button className="flex-1">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Verify & Enable
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <div>
              <CardTitle className="text-base">Quick Actions</CardTitle>
              <CardDescription>Common MFA operations</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Smartphone className="h-4 w-4 mr-2" />
                Add authenticator app
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <KeyRound className="h-4 w-4 mr-2" />
                Register hardware key
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate backup codes
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Shield className="h-4 w-4 mr-2" />
                View security audit
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
            <Lock className="h-5 w-5" />
            <span className="text-sm">Password</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
          <Link href="/account/notifications">
            <Mail className="h-5 w-5" />
            <span className="text-sm">Notifications</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
          <Link href="/account/preferences">
            <Settings className="h-5 w-5" />
            <span className="text-sm">Preferences</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}