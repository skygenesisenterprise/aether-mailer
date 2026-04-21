"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Calendar,
  ArrowUpRight,
  Mail,
  Activity,
  FileText,
  Server,
  Database,
  Users,
  Scan,
  Brain,
  Zap,
  TrendingUp,
  TrendingDown,
  TestTube,
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

const spamTestTrafficData = [
  { time: "00:00", spam: 120, ham: 340, scanned: 460 },
  { time: "04:00", spam: 80, ham: 210, scanned: 290 },
  { time: "08:00", spam: 450, ham: 890, scanned: 1340 },
  { time: "10:00", spam: 680, ham: 1240, scanned: 1920 },
  { time: "12:00", spam: 520, ham: 980, scanned: 1500 },
  { time: "14:00", spam: 750, ham: 1450, scanned: 2200 },
  { time: "16:00", spam: 890, ham: 1680, scanned: 2570 },
  { time: "18:00", spam: 620, ham: 1120, scanned: 1740 },
  { time: "20:00", spam: 380, ham: 720, scanned: 1100 },
  { time: "22:00", spam: 180, ham: 420, scanned: 600 },
];

const detectionRateData = [
  { day: "Mon", detected: 98.2, missed: 1.8 },
  { day: "Tue", detected: 97.8, missed: 2.2 },
  { day: "Wed", detected: 99.1, missed: 0.9 },
  { day: "Thu", detected: 98.5, missed: 1.5 },
  { day: "Fri", detected: 97.2, missed: 2.8 },
  { day: "Sat", detected: 99.4, missed: 0.6 },
  { day: "Sun", detected: 98.9, missed: 1.1 },
];

const recentTests = [
  {
    id: 1,
    type: "phishing",
    status: "detected",
    message: "Phishing attempt detected in test email",
    time: "5 min ago",
    score: 98,
  },
  {
    id: 2,
    type: "malware",
    status: "detected",
    message: "Malware signature matched: Trojan.Generic",
    time: "12 min ago",
    score: 95,
  },
  {
    id: 3,
    type: "legitimate",
    status: "clean",
    message: "Clean email verified - no threats",
    time: "15 min ago",
    score: 2,
  },
  {
    id: 4,
    type: "spam",
    status: "detected",
    message: "Spam content detected: promotional",
    time: "22 min ago",
    score: 89,
  },
  {
    id: 5,
    type: "spoof",
    status: "detected",
    message: "Email spoofing attempt blocked",
    time: "35 min ago",
    score: 92,
  },
];

const spamCategorySummary = [
  { category: "Phishing", count: 342, trend: "up" },
  { category: "Malware", count: 128, trend: "down" },
  { category: "Scam", count: 256, trend: "up" },
  { category: "Bulk", count: 892, trend: "stable" },
];

const modelPerformance = [
  { model: "Neural Network", accuracy: 98.2, speed: "fast" },
  { model: "Bayesian", accuracy: 94.5, speed: "fast" },
  { model: "Heuristic", accuracy: 89.2, speed: "medium" },
  { model: "Signature", accuracy: 85.7, speed: "fast" },
];

const chartConfig = {
  spam: { label: "Spam", color: "oklch(0.6 0.2 20)" },
  ham: { label: "Ham", color: "oklch(0.5 0.2 150)" },
  scanned: { label: "Scanned", color: "oklch(0.6 0.2 250)" },
};

const detectionConfig = {
  detected: { label: "Detected", color: "oklch(0.5 0.2 150)" },
  missed: { label: "Missed", color: "oklch(0.6 0.2 20)" },
};

function getStatusColor(status: string) {
  switch (status) {
    case "detected":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    case "clean":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case "pending":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    default:
      return "bg-slate-500/20 text-slate-400 border-slate-500/30";
  }
}

function getTestIcon(type: string) {
  switch (type) {
    case "phishing":
      return Shield;
    case "malware":
      return AlertTriangle;
    case "legitimate":
      return CheckCircle;
    case "spam":
      return Mail;
    case "spoof":
      return Server;
    default:
      return TestTube;
  }
}

function getModelStatusColor(speed: string) {
  switch (speed) {
    case "fast":
      return "text-green-500";
    case "medium":
      return "text-yellow-500";
    case "slow":
      return "text-red-500";
    default:
      return "text-slate-500";
  }
}

function getTrendIcon(trend: string) {
  switch (trend) {
    case "up":
      return TrendingUp;
    case "down":
      return TrendingDown;
    default:
      return Activity;
  }
}

export default function SpamTestPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("24h");
  const [spamStats, setSpamStats] = useState({
    emailsScanned: 4823,
    spamDetected: 12847,
    falsePositives: 89,
    accuracy: 98.2,
    hamCleared: 234,
    modelsActive: 4,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setSpamStats((prev) => ({
        ...prev,
        emailsScanned: prev.emailsScanned + Math.floor(Math.random() * 3),
        spamDetected: prev.spamDetected + Math.floor(Math.random() * 5),
        hamCleared: Math.max(0, prev.hamCleared + Math.floor(Math.random() * 3) - 1),
      }));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1500);
  };

  const handleRunTest = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Spam Test</h1>
          <p className="text-sm text-muted-foreground">
            Test and validate spam detection models
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Emails scanned"
          value={spamStats.emailsScanned.toLocaleString()}
          change="+12%"
          changeType="positive"
          description="vs yesterday"
          icon={Scan}
        />
        <StatsCard
          title="Spam detected"
          value={spamStats.spamDetected.toLocaleString()}
          change="+8%"
          changeType="positive"
          description="vs yesterday"
          icon={Shield}
        />
        <StatsCard
          title="Accuracy"
          value={`${spamStats.accuracy}%`}
          change="+0.3%"
          changeType="positive"
          description="vs yesterday"
          icon={CheckCircle}
        />
        <StatsCard
          title="False positives"
          value={spamStats.falsePositives.toString()}
          change="-15%"
          changeType="positive"
          description="vs yesterday"
          icon={XCircle}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Test traffic</CardTitle>
                <CardDescription>Spam vs ham detected</CardDescription>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[oklch(0.6 0.2 20)]" />
                  <span className="text-muted-foreground">Spam</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[oklch(0.5 0.2 150)]" />
                  <span className="text-muted-foreground">Ham</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-72 w-full min-h-70">
              <AreaChart data={spamTestTrafficData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillSpam" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-spam)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-spam)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fillHam" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-ham)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-ham)" stopOpacity={0} />
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
                  dataKey="ham"
                  stroke="var(--color-ham)"
                  strokeWidth={2}
                  fill="url(#fillHam)"
                />
                <Area
                  type="monotone"
                  dataKey="spam"
                  stroke="var(--color-spam)"
                  strokeWidth={2}
                  fill="url(#fillSpam)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Recent tests</CardTitle>
                <CardDescription>Latest detection results</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/spam/results" className="gap-1">
                  View all
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {recentTests.map((test) => {
                const TestIcon = getTestIcon(test.type);
                return (
                  <div key={test.id} className="flex items-center gap-3 px-6 py-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      <TestIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{test.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-normal ${getStatusColor(test.status)}`}>
                          {test.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{test.score}%</span>
                        <span className="text-xs text-muted-foreground">{test.time}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Detection rate</CardTitle>
                <CardDescription>Percentage by day</CardDescription>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[oklch(0.5 0.2 150)]" />
                  <span className="text-muted-foreground">Detected</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[oklch(0.6 0.2 20)]" />
                  <span className="text-muted-foreground">Missed</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={detectionConfig} className="h-64 w-full min-h-60">
              <BarChart data={detectionRateData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                  tickFormatter={(value) => `${value}%`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="detected" stackId="a" fill="var(--color-detected)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="missed" stackId="a" fill="var(--color-missed)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Model Performance</CardTitle>
                <CardDescription>Detection accuracy</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/spam/models" className="gap-1">
                  Details
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {modelPerformance.map((item) => (
                <div key={item.model} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Brain className={`h-4 w-4 ${getModelStatusColor(item.speed)}`} />
                    <span className="text-sm font-medium">{item.model}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${getModelStatusColor(item.speed)} bg-current`}
                        style={{ width: `${item.accuracy}%` }}
                      />
                    </div>
                    <span className="text-sm w-10 text-right">{item.accuracy}%</span>
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
                <CardTitle className="text-base">Spam Categories</CardTitle>
                <CardDescription>Detection by category</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/spam/categories" className="gap-1">
                  View all
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {spamCategorySummary.map((item) => {
                const TrendIcon = getTrendIcon(item.trend);
                return (
                  <div key={item.category} className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/20">
                        <Shield className="h-4 w-4 text-red-500" />
                      </div>
                      <span className="text-sm font-medium">{item.category}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">{item.count}</span>
                      <TrendIcon className={`h-4 w-4 ${item.trend === "up" ? "text-red-500" : item.trend === "down" ? "text-green-500" : "text-muted-foreground"}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <div>
              <CardTitle className="text-base">Quick stats</CardTitle>
              <CardDescription>Test overview</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <Server className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm">Active models</span>
                </div>
                <span className="text-sm font-medium">{spamStats.modelsActive}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm">Ham cleared</span>
                </div>
                <span className="text-sm font-medium">{spamStats.hamCleared}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm">Avg. scan time</span>
                </div>
                <span className="text-sm font-medium">120ms</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <Database className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm">DB entries</span>
                </div>
                <span className="text-sm font-medium">45,892</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
          <Link href="/dashboard/spam/train">
            <Brain className="h-5 w-5" />
            <span className="text-sm">Train Models</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
          <Link href="/dashboard/spam/quarantine">
            <AlertTriangle className="h-5 w-5" />
            <span className="text-sm">Quarantine</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
          <Link href="/dashboard/spam/settings">
            <Shield className="h-5 w-5" />
            <span className="text-sm">Settings</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
          <Link href="/dashboard/spam/reports">
            <FileText className="h-5 w-5" />
            <span className="text-sm">Reports</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}