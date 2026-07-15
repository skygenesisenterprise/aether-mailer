"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Mail,
  Clock,
  RefreshCw,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Search,
  Filter,
  ArrowRight,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/admin/stats-card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface QueueMessage {
  id: string;
  from: string;
  to: string;
  subject: string;
  queue: string;
  status: "pending" | "processing" | "delivered" | "failed" | "bounced";
  createdAt: string;
  updatedAt: string;
  size: number;
  retryCount: number;
}

const mockMessages: QueueMessage[] = [
  {
    id: "msg-001",
    from: "newsletter@company.com",
    to: "user1@example.com",
    subject: "Weekly Newsletter - Issue #42",
    queue: "outbound",
    status: "delivered",
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-15T10:32:15Z",
    size: 24580,
    retryCount: 0,
  },
  {
    id: "msg-002",
    from: "support@shop.net",
    to: "customer@client.org",
    subject: "Order Confirmation #12345",
    queue: "priority",
    status: "processing",
    createdAt: "2024-01-15T10:35:00Z",
    updatedAt: "2024-01-15T10:35:45Z",
    size: 18520,
    retryCount: 1,
  },
  {
    id: "msg-003",
    from: "alerts@monitoring.io",
    to: "admin@company.com",
    subject: "Server Alert: High CPU Usage",
    queue: "priority",
    status: "pending",
    createdAt: "2024-01-15T10:38:00Z",
    updatedAt: "2024-01-15T10:38:00Z",
    size: 8920,
    retryCount: 0,
  },
  {
    id: "msg-004",
    from: "noreply@social.app",
    to: "user42@example.com",
    subject: "Your password was reset",
    queue: "outbound",
    status: "failed",
    createdAt: "2024-01-15T09:15:00Z",
    updatedAt: "2024-01-15T09:20:00Z",
    size: 12340,
    retryCount: 3,
  },
  {
    id: "msg-005",
    from: "billing@saas.com",
    to: "enterprise@corp.net",
    subject: "Invoice INV-2024-0015",
    queue: "outbound",
    status: "bounced",
    createdAt: "2024-01-15T08:00:00Z",
    updatedAt: "2024-01-15T08:05:00Z",
    size: 56780,
    retryCount: 2,
  },
  {
    id: "msg-006",
    from: "notifications@chat.io",
    to: "user123@demo.com",
    subject: "New message from John",
    queue: "transactional",
    status: "delivered",
    createdAt: "2024-01-15T07:45:00Z",
    updatedAt: "2024-01-15T07:46:30Z",
    size: 4560,
    retryCount: 0,
  },
  {
    id: "msg-007",
    from: "marketing@brand.co",
    to: "subscriber@list.org",
    subject: "Special Offer - 50% Off!",
    queue: "outbound",
    status: "pending",
    createdAt: "2024-01-15T07:30:00Z",
    updatedAt: "2024-01-15T07:30:00Z",
    size: 98240,
    retryCount: 0,
  },
  {
    id: "msg-008",
    from: "system@infra.net",
    to: "ops@company.com",
    subject: "Daily Report - System Health",
    queue: "priority",
    status: "delivered",
    createdAt: "2024-01-14T23:00:00Z",
    updatedAt: "2024-01-14T23:02:00Z",
    size: 34560,
    retryCount: 0,
  },
];

function getStatusColor(status: string) {
  switch (status) {
    case "delivered":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case "processing":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "pending":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    case "failed":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    case "bounced":
      return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    default:
      return "bg-slate-500/20 text-slate-400 border-slate-500/30";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "delivered":
      return CheckCircle;
    case "processing":
      return Loader2;
    case "pending":
      return Clock;
    case "failed":
      return XCircle;
    case "bounced":
      return AlertCircle;
    default:
      return Clock;
  }
}

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function QueuesMessagesPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("24h");
  const [selectedQueue, setSelectedQueue] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [messages, setMessages] = useState<QueueMessage[]>(mockMessages);

  const [queueStats, setQueueStats] = useState({
    total: 847,
    pending: 42,
    processing: 15,
    delivered: 723,
    failed: 67,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setQueueStats((prev) => ({
        ...prev,
        pending: Math.max(0, prev.pending + Math.floor(Math.random() * 5) - 2),
        processing: Math.max(0, prev.processing + Math.floor(Math.random() * 3) - 1),
        delivered: prev.delivered + Math.floor(Math.random() * 2),
      }));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1500);
  };

  const filteredMessages = messages.filter((msg) => {
    if (selectedQueue !== "all" && msg.queue !== selectedQueue) return false;
    if (selectedStatus !== "all" && msg.status !== selectedStatus) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        msg.from.toLowerCase().includes(query) ||
        msg.to.toLowerCase().includes(query) ||
        msg.subject.toLowerCase().includes(query) ||
        msg.id.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Queue Messages</h1>
          <p className="text-sm text-muted-foreground">
            Monitor and manage email queue messages
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatsCard
          title="Total messages"
          value={queueStats.total.toLocaleString()}
          change="+12%"
          changeType="positive"
          description="vs yesterday"
          icon={Mail}
        />
        <StatsCard
          title="Pending"
          value={queueStats.pending.toString()}
          change="+5"
          changeType="negative"
          description="in queue"
          icon={Clock}
        />
        <StatsCard
          title="Processing"
          value={queueStats.processing.toString()}
          change="0"
          changeType="neutral"
          description="active"
          icon={Loader2}
        />
        <StatsCard
          title="Delivered"
          value={queueStats.delivered.toLocaleString()}
          change="+8%"
          changeType="positive"
          description="vs yesterday"
          icon={CheckCircle}
        />
        <StatsCard
          title="Failed"
          value={queueStats.failed.toString()}
          change="-3"
          changeType="positive"
          description="vs yesterday"
          icon={XCircle}
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Message Queue</CardTitle>
              <CardDescription>Recent messages in the queue</CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full sm:w-64"
                />
              </div>
              <Select value={selectedQueue} onValueChange={setSelectedQueue}>
                <SelectTrigger className="w-36">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Queue" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Queues</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                  <SelectItem value="outbound">Outbound</SelectItem>
                  <SelectItem value="transactional">Transactional</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="bounced">Bounced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Status</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Queue</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Retries</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMessages.map((message) => {
                const StatusIcon = getStatusIcon(message.status);
                return (
                  <TableRow key={message.id}>
                    <TableCell>
                      <div className="flex items-center justify-center">
                        <StatusIcon
                          className={`h-4 w-4 ${
                            message.status === "delivered"
                              ? "text-green-500"
                              : message.status === "processing"
                              ? "text-blue-500 animate-spin"
                              : message.status === "pending"
                              ? "text-yellow-500"
                              : message.status === "failed"
                              ? "text-red-500"
                              : "text-orange-500"
                          }`}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{message.from}</TableCell>
                    <TableCell>{message.to}</TableCell>
                    <TableCell className="max-w-xs truncate">{message.subject}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {message.queue}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatBytes(message.size)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(message.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`font-medium ${
                          message.retryCount > 2
                            ? "text-red-500"
                            : message.retryCount > 0
                            ? "text-yellow-500"
                            : ""
                        }`}
                      >
                        {message.retryCount}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Queue Distribution</CardTitle>
            <CardDescription>Messages by queue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Outbound", count: 520, color: "bg-blue-500" },
                { name: "Priority", count: 180, color: "bg-red-500" },
                { name: "Transactional", count: 147, color: "bg-green-500" },
              ].map((queue) => (
                <div key={queue.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-3 w-3 rounded-full ${queue.color}`} />
                    <span className="text-sm">{queue.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${queue.color}`}
                        style={{ width: `${(queue.count / queueStats.total) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-12 text-right">
                      {queue.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Status Overview</CardTitle>
            <CardDescription>Current status distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Delivered</span>
                </div>
                <span className="text-sm font-medium">{queueStats.delivered}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">Pending</span>
                </div>
                <span className="text-sm font-medium">{queueStats.pending}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Processing</span>
                </div>
                <span className="text-sm font-medium">{queueStats.processing}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm">Failed</span>
                </div>
                <span className="text-sm font-medium">{queueStats.failed}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Actions</CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/dashboard/queues/reports">
                  View Queue Reports
                  <ArrowRight className="ml-auto h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Retry Failed Messages
                <ArrowRight className="ml-auto h-4 w-4" />
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Clear Completed
                <ArrowRight className="ml-auto h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
