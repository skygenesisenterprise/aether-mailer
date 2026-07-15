"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Brain,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Calendar,
  ArrowUpRight,
  Clock,
  Activity,
  Shield,
  FileText,
  Server,
  Database,
  Zap,
  Play,
  Pause,
  StopCircle,
  Cpu,
  Gauge,
  FlaskConical,
  Target,
  Award,
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

const trainingProgressData = [
  { time: "00:00", accuracy: 85, loss: 0.45, samples: 1200 },
  { time: "04:00", accuracy: 88, loss: 0.38, samples: 2400 },
  { time: "08:00", accuracy: 91, loss: 0.28, samples: 3600 },
  { time: "10:00", accuracy: 93, loss: 0.22, samples: 4800 },
  { time: "12:00", accuracy: 94, loss: 0.18, samples: 6000 },
  { time: "14:00", accuracy: 95, loss: 0.15, samples: 7200 },
  { time: "16:00", accuracy: 96, loss: 0.12, samples: 8400 },
  { time: "18:00", accuracy: 97, loss: 0.09, samples: 9600 },
  { time: "20:00", accuracy: 97.5, loss: 0.08, samples: 10800 },
  { time: "22:00", accuracy: 98, loss: 0.06, samples: 12000 },
];

const modelAccuracyData = [
  { model: "V1", accuracy: 94.2, precision: 92.1 },
  { model: "V2", accuracy: 96.8, precision: 95.2 },
  { model: "V3", accuracy: 98.1, precision: 97.5 },
  { model: "V4", accuracy: 98.9, precision: 98.2 },
];

const recentTrainingJobs = [
  {
    id: 1,
    model: "Neural Network",
    status: "completed",
    accuracy: 98.2,
    duration: "45m",
    samples: "12,500",
    date: "2h ago",
  },
  {
    id: 2,
    model: "Bayesian",
    status: "completed",
    accuracy: 94.5,
    duration: "12m",
    samples: "12,500",
    date: "5h ago",
  },
  {
    id: 3,
    model: "Heuristic",
    status: "running",
    accuracy: 89.2,
    duration: "28m",
    samples: "8,200",
    date: "Now",
  },
  {
    id: 4,
    model: "Signature",
    status: "queued",
    accuracy: 85.7,
    duration: "5m",
    samples: "12,500",
    date: "Pending",
  },
];

const trainingDataset = [
  { category: "Spam", count: 4523, percentage: 42 },
  { category: "Ham", count: 3827, percentage: 35 },
  { category: "Phishing", count: 1245, percentage: 12 },
  { category: "Malware", count: 892, percentage: 8 },
  { category: "Other", count: 303, percentage: 3 },
];

const hyperparameters = [
  { param: "Learning Rate", value: "0.001", recommended: "0.001" },
  { param: "Batch Size", value: "32", recommended: "32" },
  { param: "Epochs", value: "100", recommended: "100" },
  { param: "Dropout", value: "0.3", recommended: "0.2-0.4" },
];

const chartConfig = {
  accuracy: { label: "Accuracy", color: "oklch(0.5 0.2 150)" },
  loss: { label: "Loss", color: "oklch(0.6 0.2 20)" },
};

const modelConfig = {
  accuracy: { label: "Accuracy", color: "oklch(0.5 0.2 150)" },
  precision: { label: "Precision", color: "oklch(0.6 0.2 250)" },
};

function getTrainingStatusColor(status: string) {
  switch (status) {
    case "completed":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case "running":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "queued":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    case "failed":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    default:
      return "bg-slate-500/20 text-slate-400 border-slate-500/30";
  }
}

function getJobIcon(status: string) {
  switch (status) {
    case "completed":
      return CheckCircle;
    case "running":
      return Activity;
    case "queued":
      return Clock;
    case "failed":
      return XCircle;
    default:
      return Server;
  }
}

export default function SpamTrainPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("24h");
  const [trainingStats, setTrainingStats] = useState({
    activeModels: 4,
    accuracy: 98.2,
    samplesTrained: 12500,
    trainingTime: "45m",
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setTrainingStats((prev) => ({
        ...prev,
        samplesTrained: Math.min(12500, prev.samplesTrained + 100),
        accuracy: Math.min(99, prev.accuracy + 0.1),
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1500);
  };

  const handleStartTraining = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  const handleStopTraining = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Spam Train</h1>
          <p className="text-sm text-muted-foreground">
            Train and improve spam detection models
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
          title="Active models"
          value={trainingStats.activeModels.toString()}
          change="+1"
          changeType="positive"
          description="new this week"
          icon={Brain}
        />
        <StatsCard
          title="Best accuracy"
          value={`${trainingStats.accuracy}%`}
          change="+2.1%"
          changeType="positive"
          description="vs last week"
          icon={Gauge}
        />
        <StatsCard
          title="Samples trained"
          value={trainingStats.samplesTrained.toLocaleString()}
          change="+1.2K"
          changeType="positive"
          description="vs yesterday"
          icon={Database}
        />
        <StatsCard
          title="Avg. time"
          value={trainingStats.trainingTime}
          change="-5m"
          changeType="positive"
          description="vs last training"
          icon={Clock}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Training progress</CardTitle>
                <CardDescription>Accuracy and loss over time</CardDescription>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[oklch(0.5 0.2 150)]" />
                  <span className="text-muted-foreground">Accuracy</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[oklch(0.6 0.2 20)]" />
                  <span className="text-muted-foreground">Loss</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-72 w-full min-h-70">
              <AreaChart data={trainingProgressData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillAccuracy" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-accuracy)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-accuracy)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fillLoss" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-loss)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-loss)" stopOpacity={0} />
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
                  dataKey="accuracy"
                  stroke="var(--color-accuracy)"
                  strokeWidth={2}
                  fill="url(#fillAccuracy)"
                />
                <Area
                  type="monotone"
                  dataKey="loss"
                  stroke="var(--color-loss)"
                  strokeWidth={2}
                  fill="url(#fillLoss)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Training jobs</CardTitle>
                <CardDescription>Recent model training</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/spam/jobs" className="gap-1">
                  View all
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {recentTrainingJobs.map((job) => {
                const JobIcon = getJobIcon(job.status);
                return (
                  <div key={job.id} className="flex items-center gap-3 px-6 py-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      <JobIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{job.model}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-normal ${getTrainingStatusColor(job.status)}`}>
                          {job.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{job.duration}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium">{job.accuracy}%</span>
                      <span className="text-xs text-muted-foreground ml-2">{job.date}</span>
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
                <CardTitle className="text-base">Model accuracy</CardTitle>
                <CardDescription>Performance by model version</CardDescription>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[oklch(0.5 0.2 150)]" />
                  <span className="text-muted-foreground">Accuracy</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[oklch(0.6 0.2 250)]" />
                  <span className="text-muted-foreground">Precision</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={modelConfig} className="h-64 w-full min-h-60">
              <BarChart data={modelAccuracyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="model"
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
                <Bar dataKey="accuracy" stackId="a" fill="var(--color-accuracy)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="precision" stackId="a" fill="var(--color-precision)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Hyperparameters</CardTitle>
                <CardDescription>Current training config</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/spam/config" className="gap-1">
                  Edit
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {hyperparameters.map((item) => (
                <div key={item.param} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Cpu className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{item.param}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm">{item.value}</span>
                    <span className="text-xs text-muted-foreground">/ {item.recommended}</span>
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
                <CardTitle className="text-base">Training Dataset</CardTitle>
                <CardDescription>Sample distribution</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/spam/dataset" className="gap-1">
                  Manage
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {trainingDataset.map((item) => (
                <div key={item.category} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/20">
                      <FlaskConical className="h-4 w-4 text-red-500" />
                    </div>
                    <span className="text-sm font-medium">{item.category}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-red-500"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-16 text-right">{item.count.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground w-10">{item.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <div>
              <CardTitle className="text-base">Training Controls</CardTitle>
              <CardDescription>Start and manage training</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm">Best Model</span>
                </div>
                <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                  Neural Net V4
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <Award className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm">Best Accuracy</span>
                </div>
                <span className="text-sm font-medium">98.9%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm">Avg. Epoch Time</span>
                </div>
                <span className="text-sm font-medium">28s</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm">GPU Usage</span>
                </div>
                <span className="text-sm font-medium">78%</span>
              </div>
              <div className="pt-4 space-y-2">
                <Button className="w-full" onClick={handleStartTraining}>
                  <Play className="h-4 w-4 mr-2" />
                  Start Training
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={handleStopTraining}>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </Button>
                  <Button variant="outline">
                    <StopCircle className="h-4 w-4 mr-2" />
                    Stop
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" asChild>
          <Link href="/dashboard/spam/test">
            <FlaskConical className="h-5 w-5" />
            <span className="text-sm">Test Models</span>
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