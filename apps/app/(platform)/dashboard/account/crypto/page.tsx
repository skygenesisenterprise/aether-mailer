"use client";

import { useState } from "react";
import Link from "next/link";
import {
  KeyRound,
  Shield,
  Lock,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  User,
  Mail,
  Plus,
  Trash2,
  Download,
  Upload,
  Fingerprint,
  Terminal,
  Key,
  RefreshCcw,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const pgpKeys = [
  {
    id: 1,
    name: "Primary Key",
    keyId: "0xA1B2C3D4E5F6",
    fingerprint: "A1B2 C3D4 E5F6 7890 ABCD 1234 5678 90EF",
    type: "RSA",
    bits: 4096,
    createdAt: "2024-01-15",
    expiresAt: "2026-01-15",
    status: "active",
  },
  {
    id: 2,
    name: "Backup Key",
    keyId: "0x9876543210FE",
    fingerprint: "9876 5432 10FE DCBA 4321 0FED CBA9 8765",
    type: "RSA",
    bits: 4096,
    createdAt: "2023-11-05",
    expiresAt: "2025-11-05",
    status: "active",
  },
  {
    id: 3,
    name: "Old Key",
    keyId: "0xABCD1234EF56",
    fingerprint: "ABCD 1234 EF56 7890 ABCD 1234 EF56 7890",
    type: "RSA",
    bits: 2048,
    createdAt: "2022-06-01",
    expiresAt: "2024-06-01",
    status: "expired",
  },
];

const recentActivity = [
  { id: 1, action: "Key generated", key: "Primary Key", time: "5 min ago" },
  { id: 2, action: "Key signed", key: "Backup Key", time: "1h ago" },
  { id: 3, action: "Key uploaded", key: "Primary Key", time: "2h ago" },
  { id: 4, action: "Key expired", key: "Old Key", time: "3 days ago" },
  { id: 5, action: "Key revoked", key: "Legacy Key", time: "1 week ago" },
];

function getStatusColor(status: string) {
  switch (status) {
    case "active":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case "expired":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    case "revoked":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    default:
      return "bg-slate-500/20 text-slate-400 border-slate-500/30";
  }
}

export default function AccountCryptoPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showFingerprint, setShowFingerprint] = useState(false);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1500);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cryptographic Keys</h1>
          <p className="text-sm text-muted-foreground">
            Manage PGP keys and encryption settings for your account
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Generate Key
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
                <p className="text-2xl font-bold">{pgpKeys.length}</p>
                <p className="text-sm text-muted-foreground">Total keys</p>
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
                <p className="text-2xl font-bold">{pgpKeys.filter((k) => k.status === "active").length}</p>
                <p className="text-sm text-muted-foreground">Active keys</p>
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
                <p className="text-2xl font-bold">{pgpKeys.filter((k) => k.status === "expired").length}</p>
                <p className="text-sm text-muted-foreground">Expiring soon</p>
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
                <p className="text-2xl font-bold">AES-256</p>
                <p className="text-sm text-muted-foreground">Encryption</p>
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
                  <KeyRound className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">PGP Keys</CardTitle>
                  <CardDescription>Your OpenPGP key pair</CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {pgpKeys.map((key) => (
              <div key={key.id} className="p-4 rounded-lg border border-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <Key className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{key.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{key.keyId}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={getStatusColor(key.status)}>
                    {key.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground mb-3">
                  <div>
                    <p className="font-medium">Type</p>
                    <p>{key.type} {key.bits}-bit</p>
                  </div>
                  <div>
                    <p className="font-medium">Created</p>
                    <p>{key.createdAt}</p>
                  </div>
                  <div>
                    <p className="font-medium">Expires</p>
                    <p>{key.expiresAt}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  {key.status === "active" && (
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Encryption Settings</CardTitle>
                <CardDescription>Configure default encryption</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg border border-border">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Default Encryption</span>
                </div>
                <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                  Enabled
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Automatically encrypt outgoing emails when recipients have public keys
              </p>
            </div>

            <div className="p-4 rounded-lg border border-border">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Fingerprint className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Sign by Default</span>
                </div>
                <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                  Enabled
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Digitally sign all outgoing emails with your primary key
              </p>
            </div>

            <div className="p-4 rounded-lg border border-border">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Primary Key</span>
                </div>
                <span className="text-xs text-muted-foreground">0xA1B2C3D4E5F6</span>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <Button variant="outline" size="sm" className="flex-1">
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Rotate
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Revoke
                </Button>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <h4 className="text-sm font-medium mb-3">Key Server</h4>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload to Server
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Import Key
                </Button>
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
                <CardDescription>Key management history</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 px-6 py-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    {activity.action.includes("generated") ? (
                      <Plus className="h-4 w-4 text-green-500" />
                    ) : activity.action.includes("expired") ? (
                      <Clock className="h-4 w-4 text-yellow-500" />
                    ) : activity.action.includes("revoked") ? (
                      <XCircle className="h-4 w-4 text-red-500" />
                    ) : activity.action.includes("signed") ? (
                      <CheckCircle className="h-4 w-4 text-blue-500" />
                    ) : (
                      <Download className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{activity.action}</span>
                      <span className="text-muted-foreground"> - </span>
                      <span className="font-medium">{activity.key}</span>
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
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
                Generate new key pair
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Upload className="h-4 w-4 mr-2" />
                Import public key
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Download className="h-4 w-4 mr-2" />
                Export private key
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Terminal className="h-4 w-4 mr-2" />
                Generate key from passphrase
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