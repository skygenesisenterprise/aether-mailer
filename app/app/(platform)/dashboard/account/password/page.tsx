"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  Shield,
  CheckCircle,
  AlertTriangle,
  Clock,
  RefreshCw,
  Settings,
  User,
  Mail,
  Smartphone,
  Save,
  Plus,
  Trash2,
  Edit,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const passwordHistory = [
  { id: 1, changedAt: "2024-03-15", method: "Manual", ipAddress: "192.168.1.100", status: "active" },
  { id: 2, changedAt: "2024-01-10", method: "Forgot password", ipAddress: "192.168.1.100", status: "expired" },
  { id: 3, changedAt: "2023-10-05", method: "Manual", ipAddress: "10.0.0.50", status: "expired" },
  { id: 4, changedAt: "2023-06-20", method: "Admin reset", ipAddress: "10.0.0.1", status: "expired" },
];

const activeSessions = [
  { id: 1, device: "Chrome on MacOS", location: "Paris, France", ipAddress: "192.168.1.100", lastActive: "2 min ago", current: true },
  { id: 2, device: "Safari on iPhone", location: "Paris, France", ipAddress: "192.168.1.101", lastActive: "1h ago", current: false },
  { id: 3, device: "Firefox on Windows", location: "Lyon, France", ipAddress: "10.0.0.50", lastActive: "3 days ago", current: false },
];

const securityQuestions = [
  { id: 1, question: "What is your mother's maiden name?", answered: true },
  { id: 2, question: "What was the name of your first pet?", answered: true },
  { id: 3, question: "What city were you born in?", answered: false },
];

function getStatusColor(status: string) {
  switch (status) {
    case "active":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case "expired":
      return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    default:
      return "bg-slate-500/20 text-slate-400 border-slate-500/30";
  }
}

function getStrengthColor(strength: string) {
  switch (strength) {
    case "strong":
      return "bg-green-500";
    case "medium":
      return "bg-yellow-500";
    case "weak":
      return "bg-red-500";
    default:
      return "bg-slate-500";
  }
}

export default function AccountPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState("medium");
  const [mfaEnabled, setMfaEnabled] = useState(true);

  const handleSave = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1500);
  };

  const calculateStrength = (password: string) => {
    if (password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) {
      return "strong";
    } else if (password.length >= 8) {
      return "medium";
    }
    return "weak";
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Account Password</h1>
          <p className="text-sm text-muted-foreground">
            Manage your account security and authentication settings
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Lock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Change Password</CardTitle>
                <CardDescription>Update your account password</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current">Current Password</Label>
              <div className="relative">
                <Input
                  id="current"
                  type={showCurrentPassword ? "text" : "password"}
                  placeholder="Enter current password"
                  className="pr-10"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new">New Password</Label>
              <div className="relative">
                <Input
                  id="new"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  className="pr-10"
                  onChange={(e) => setPasswordStrength(calculateStrength(e.target.value))}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <div className="space-y-2">
                <div className="flex gap-1">
                  <div className="h-1 flex-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full ${getStrengthColor(passwordStrength)}`}
                      style={{ width: passwordStrength === "weak" ? "33%" : passwordStrength === "medium" ? "66%" : "100%" }}
                    />
                  </div>
                  <div className="h-1 flex-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full ${passwordStrength !== "weak" ? getStrengthColor(passwordStrength) : "bg-muted"}`}
                      style={{ width: passwordStrength === "strong" ? "100%" : "0%" }}
                    />
                  </div>
                  <div className="h-1 flex-1 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-muted" style={{ width: "0%" }} />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {passwordStrength === "strong"
                    ? "Strong password"
                    : passwordStrength === "medium"
                    ? "Medium strength - consider adding special characters"
                    : "Weak password - use at least 8 characters with letters and numbers"}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirm"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  className="pr-10"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <Button className="w-full" onClick={handleSave} disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              Update Password
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Two-Factor Authentication</CardTitle>
                <CardDescription>Secure your account with 2FA</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border border-border">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20">
                  <Smartphone className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">Authenticator App</p>
                  <p className="text-xs text-muted-foreground">Use an app like Google Authenticator</p>
                </div>
              </div>
              <Badge variant="outline" className={mfaEnabled ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-slate-500/20 text-slate-400 border-slate-500/30"}>
                {mfaEnabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border border-border">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20">
                  <Mail className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">Email Verification</p>
                  <p className="text-xs text-muted-foreground">Receive codes via email</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                Enabled
              </Badge>
            </div>

            <div className="pt-4 border-t border-border">
              <h4 className="text-sm font-medium mb-3">Recovery Codes</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="font-mono text-xs">A1B2-C3D4</Badge>
                <Badge variant="outline" className="font-mono text-xs">E5F6-G7H8</Badge>
                <Badge variant="outline" className="font-mono text-xs">I9J0-K1L2</Badge>
                <Badge variant="outline" className="font-mono text-xs">M3N4-O5P6</Badge>
              </div>
              <Button variant="outline" size="sm" className="mt-3">
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate Codes
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
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Password History</CardTitle>
                  <CardDescription>Recent password changes</CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {passwordHistory.map((item) => (
                <div key={item.id} className="flex items-center justify-between px-6 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{item.method}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.ipAddress} - {item.changedAt}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-xs ${getStatusColor(item.status)}`}>
                    {item.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Active Sessions</CardTitle>
                  <CardDescription>Devices currently logged in</CardDescription>
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
              {activeSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between px-6 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      {session.current ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Smartphone className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {session.device}
                        {session.current && (
                          <Badge variant="outline" className="ml-2 text-[10px] px-1.5 py-0 bg-green-500/20 text-green-400 border-green-500/30">
                            Current
                          </Badge>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {session.location} - {session.ipAddress}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{session.lastActive}</span>
                    {!session.current && (
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
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
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Security Questions</CardTitle>
                <CardDescription>Configure recovery questions</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {securityQuestions.map((sq) => (
                <div key={sq.id} className="flex items-center justify-between px-6 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      {sq.answered ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                    <p className="text-sm">{sq.question}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {sq.answered ? (
                      <Badge variant="outline" className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
                        Configured
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                        Missing
                      </Badge>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      {sq.answered ? <Edit className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                    </Button>
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
              <CardDescription>Common security operations</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <KeyRound className="h-4 w-4 mr-2" />
                Generate strong password
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Mail className="h-4 w-4 mr-2" />
                Send password reset link
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Shield className="h-4 w-4 mr-2" />
                View security audit
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-2" />
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
          <Link href="/account/security">
            <Shield className="h-5 w-5" />
            <span className="text-sm">Security</span>
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