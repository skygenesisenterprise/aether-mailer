"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Cpu,
  HardDrive,
  MemoryStick,
  Zap,
  BarChart3,
  RefreshCw,
  Download,
  Calendar,
  Filter,
  Search,
  Eye,
  MoreHorizontal,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Thermometer,
  Battery,
  Settings,
  Gauge,
} from "lucide-react";

export default function DashboardPerformancePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("1h");
  const [performanceMetrics, setPerformanceMetrics] = useState({
    cpu: {
      usage: 23.4,
      cores: 8,
      temperature: 45,
      frequency: 3.2,
      load: [15.2, 18.7, 23.4],
    },
    memory: {
      used: 8.7,
      total: 16,
      percentage: 54.4,
      swap: 2.1,
      cached: 3.2,
    },
    disk: {
      used: 420,
      total: 750,
      percentage: 56,
      readSpeed: 125,
      writeSpeed: 89,
      iops: 1250,
    },
    network: {
      bandwidth: 1.2,
      latency: 12,
      packetLoss: 0.01,
      connections: 1247,
    },
    system: {
      uptime: 99.98,
      processes: 247,
      threads: 1847,
      loadAverage: [1.2, 1.5, 1.8],
    },
  });

  const periods = ["5m", "15m", "1h", "6h", "24h"];

  useEffect(() => {
    // Simulate real-time performance updates
    const interval = setInterval(() => {
      setPerformanceMetrics((prev) => ({
        ...prev,
        cpu: {
          ...prev.cpu,
          usage: Math.max(
            10,
            Math.min(40, prev.cpu.usage + (Math.random() - 0.5) * 3),
          ),
          temperature: Math.max(
            35,
            Math.min(65, prev.cpu.temperature + (Math.random() - 0.5) * 2),
          ),
          load: prev.cpu.load.map((load) =>
            Math.max(5, Math.min(30, load + (Math.random() - 0.5) * 2)),
          ),
        },
        memory: {
          ...prev.memory,
          used: Math.max(
            6,
            Math.min(12, prev.memory.used + (Math.random() - 0.5) * 0.5),
          ),
        },
        disk: {
          ...prev.disk,
          readSpeed: Math.max(
            80,
            Math.min(200, prev.disk.readSpeed + (Math.random() - 0.5) * 10),
          ),
          writeSpeed: Math.max(
            50,
            Math.min(150, prev.disk.writeSpeed + (Math.random() - 0.5) * 8),
          ),
        },
        system: {
          ...prev.system,
          processes: Math.max(
            200,
            Math.min(
              300,
              prev.system.processes + Math.floor(Math.random() * 5) - 2,
            ),
          ),
          threads: Math.max(
            1500,
            Math.min(
              2000,
              prev.system.threads + Math.floor(Math.random() * 10) - 5,
            ),
          ),
        },
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1500);
  };

  const performanceAlerts = [
    {
      id: 1,
      type: "warning",
      metric: "CPU Temperature",
      value: "62°C",
      threshold: "60°C",
      time: "Il y a 5 minutes",
      status: "active",
    },
    {
      id: 2,
      type: "info",
      metric: "Memory Usage",
      value: "54.4%",
      threshold: "80%",
      time: "Il y a 15 minutes",
      status: "resolved",
    },
    {
      id: 3,
      type: "critical",
      metric: "Disk I/O",
      value: "95%",
      threshold: "90%",
      time: "Il y a 30 minutes",
      status: "active",
    },
    {
      id: 4,
      type: "warning",
      metric: "System Load",
      value: "2.8",
      threshold: "2.0",
      time: "Il y a 1 heure",
      status: "resolved",
    },
  ];

  const topProcesses = [
    {
      name: "smtp-server",
      pid: 1234,
      cpu: 15.2,
      memory: 2.3,
      status: "running",
      uptime: "2d 14h",
    },
    {
      name: "mysql",
      pid: 5678,
      cpu: 8.7,
      memory: 4.1,
      status: "running",
      uptime: "5d 8h",
    },
    {
      name: "nginx",
      pid: 9012,
      cpu: 5.4,
      memory: 1.2,
      status: "running",
      uptime: "12d 3h",
    },
    {
      name: "redis-server",
      pid: 3456,
      cpu: 3.1,
      memory: 0.8,
      status: "running",
      uptime: "8d 16h",
    },
    {
      name: "node-app",
      pid: 7890,
      cpu: 2.8,
      memory: 1.5,
      status: "running",
      uptime: "1d 5h",
    },
  ];

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "critical":
        return <XCircle className="h-4 w-4 text-red-400" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
      case "info":
        return <CheckCircle className="h-4 w-4 text-blue-400" />;
      default:
        return <Activity className="h-4 w-4 text-slate-400" />;
    }
  };

  const getAlertBadge = (type: string) => {
    switch (type) {
      case "critical":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            Critique
          </Badge>
        );
      case "warning":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            Avertissement
          </Badge>
        );
      case "info":
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
            Info
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">
            Inconnu
          </Badge>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "running":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            Actif
          </Badge>
        );
      case "stopped":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            Arrêté
          </Badge>
        );
      case "sleeping":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            Veille
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">
            Inconnu
          </Badge>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-800">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Tableau de Bord Performance
              </h1>
              <p className="text-slate-400 text-lg">
                Surveillance et analyse des performances système en temps réel
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2 border border-slate-700">
                <Calendar className="h-4 w-4 text-blue-400" />
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="bg-slate-800 text-white text-sm outline-none cursor-pointer"
                >
                  {periods.map((period) => (
                    <option
                      key={period}
                      value={period}
                      className="bg-slate-800 text-white"
                    >
                      {period}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
                className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
                />
                Actualiser
              </Button>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Core Performance Metrics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 border-blue-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-blue-500/20 rounded-xl">
                  <Cpu className="h-6 w-6 text-blue-400" />
                </div>
                <div className="flex items-center gap-1">
                  <Thermometer className="h-3 w-3 text-green-400" />
                  <span className="text-xs text-green-400">
                    {performanceMetrics.cpu.temperature}°C
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-3xl font-bold text-white">
                {performanceMetrics.cpu.usage.toFixed(1)}%
              </div>
              <div className="text-sm text-slate-400">Utilisation CPU</div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Cores: {performanceMetrics.cpu.cores}</span>
                  <span>Fréquence: {performanceMetrics.cpu.frequency} GHz</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <span>Load: </span>
                  {performanceMetrics.cpu.load.map((load, index) => (
                    <span key={index} className="text-blue-400">
                      {load.toFixed(1)}
                    </span>
                  ))}
                </div>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${performanceMetrics.cpu.usage}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-900/20 to-green-800/10 border-green-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-green-500/20 rounded-xl">
                  <MemoryStick className="h-6 w-6 text-green-400" />
                </div>
                <div className="flex items-center gap-1">
                  <Battery className="h-3 w-3 text-green-400" />
                  <span className="text-xs text-green-400">Stable</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-3xl font-bold text-white">
                {performanceMetrics.memory.percentage.toFixed(1)}%
              </div>
              <div className="text-sm text-slate-400">Utilisation Mémoire</div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>
                    {performanceMetrics.memory.used} GB /{" "}
                    {performanceMetrics.memory.total} GB
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <span>Swap: {performanceMetrics.memory.swap} GB</span>
                  <span>•</span>
                  <span>Cache: {performanceMetrics.memory.cached} GB</span>
                </div>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${performanceMetrics.memory.percentage}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-purple-500/20 rounded-xl">
                  <HardDrive className="h-6 w-6 text-purple-400" />
                </div>
                <div className="flex items-center gap-1">
                  <Activity className="h-3 w-3 text-yellow-400" />
                  <span className="text-xs text-yellow-400">Actif</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-3xl font-bold text-white">
                {performanceMetrics.disk.percentage}%
              </div>
              <div className="text-sm text-slate-400">Utilisation Disque</div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>
                    {performanceMetrics.disk.used} GB /{" "}
                    {performanceMetrics.disk.total} GB
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <span>R: {performanceMetrics.disk.readSpeed} MB/s</span>
                  <span>•</span>
                  <span>W: {performanceMetrics.disk.writeSpeed} MB/s</span>
                </div>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${performanceMetrics.disk.percentage}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-900/20 to-orange-800/10 border-orange-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-orange-500/20 rounded-xl">
                  <Gauge className="h-6 w-6 text-orange-400" />
                </div>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs px-2 py-1">
                  Optimal
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-3xl font-bold text-white">
                {performanceMetrics.system.uptime}%
              </div>
              <div className="text-sm text-slate-400">Uptime Système</div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Processus: {performanceMetrics.system.processes}</span>
                  <span>Threads: {performanceMetrics.system.threads}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <span>Load: </span>
                  {performanceMetrics.system.loadAverage.map((load, index) => (
                    <span key={index} className="text-orange-400">
                      {load.toFixed(1)}
                    </span>
                  ))}
                </div>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-orange-500 h-2 rounded-full"
                  style={{ width: "99.8%" }}
                ></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Alerts */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white font-bold">
                  Alertes Performance
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Seuils dépassés et notifications système
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                  {
                    performanceAlerts.filter(
                      (alert) => alert.status === "active",
                    ).length
                  }{" "}
                  Actives
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-400 hover:text-white"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configurer
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {performanceAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-4 border border-slate-700 rounded-lg hover:bg-slate-700/50 transition-all duration-200"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-slate-700 rounded-lg">
                      {getAlertIcon(alert.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-white">
                          {alert.metric}
                        </p>
                        {getAlertBadge(alert.type)}
                        {alert.status === "active" ? (
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                            Active
                          </Badge>
                        ) : (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                            Résolue
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <span>Valeur: {alert.value}</span>
                        <span>Seuil: {alert.threshold}</span>
                        <span>{alert.time}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 text-slate-400 hover:text-white"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 text-slate-400 hover:text-white"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Processes */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white font-bold">
                  Processus les Plus Gourmands
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Classement des processus par utilisation CPU et mémoire
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-400 hover:text-white"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filtrer
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-400 hover:text-white"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Rechercher
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topProcesses.map((process, index) => (
                <div
                  key={process.pid}
                  className="flex items-center justify-between p-4 border border-slate-700 rounded-lg hover:bg-slate-700/50 transition-all duration-200"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center text-sm font-bold text-slate-400">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-white">
                          {process.name}
                        </p>
                        {getStatusBadge(process.status)}
                        <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30 text-xs">
                          PID: {process.pid}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <span>Uptime: {process.uptime}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-sm font-medium text-blue-400">
                        CPU: {process.cpu}%
                      </div>
                      <div className="w-16 bg-slate-700 rounded-full h-1 mt-1">
                        <div
                          className="bg-blue-500 h-1 rounded-full"
                          style={{
                            width: `${Math.min(100, process.cpu * 5)}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-400">
                        RAM: {process.memory} GB
                      </div>
                      <div className="w-16 bg-slate-700 rounded-full h-1 mt-1">
                        <div
                          className="bg-green-500 h-1 rounded-full"
                          style={{
                            width: `${Math.min(100, process.memory * 20)}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 text-slate-400 hover:text-white"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 text-slate-400 hover:text-white"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Detailed System Metrics */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-gradient-to-br from-cyan-900/20 to-cyan-800/10 border-cyan-700/50 shadow-xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white font-bold flex items-center gap-2">
                  <Activity className="h-5 w-5 text-cyan-400" />
                  Métriques CPU Détaillées
                </CardTitle>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  Normal
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm text-slate-300">
                    Utilisation totale
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {performanceMetrics.cpu.usage.toFixed(1)}%
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-slate-300">Température</div>
                  <div className="text-2xl font-bold text-white">
                    {performanceMetrics.cpu.temperature}°C
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-slate-300">Fréquence</div>
                  <div className="text-2xl font-bold text-white">
                    {performanceMetrics.cpu.frequency} GHz
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-slate-300">Cores actifs</div>
                  <div className="text-2xl font-bold text-white">
                    {performanceMetrics.cpu.cores}/8
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="text-sm text-slate-300">
                  Charge moyenne (1m, 5m, 15m)
                </div>
                <div className="flex gap-2">
                  {performanceMetrics.cpu.load.map((load, index) => (
                    <div key={index} className="flex-1 text-center">
                      <div className="text-lg font-medium text-cyan-400">
                        {load.toFixed(1)}
                      </div>
                      <div className="text-xs text-slate-500">
                        [{index === 0 ? "1m" : index === 1 ? "5m" : "15m"}]
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3">
                <div
                  className="bg-cyan-500 h-3 rounded-full"
                  style={{ width: `${performanceMetrics.cpu.usage}%` }}
                ></div>
              </div>
              <div className="text-xs text-cyan-400">
                Performance CPU: Excellente
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-900/20 to-emerald-800/10 border-emerald-700/50 shadow-xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white font-bold flex items-center gap-2">
                  <HardDrive className="h-5 w-5 text-emerald-400" />
                  Métriques Disque Détaillées
                </CardTitle>
                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                  Attention
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm text-slate-300">Espace utilisé</div>
                  <div className="text-2xl font-bold text-white">
                    {performanceMetrics.disk.percentage}%
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-slate-300">Espace libre</div>
                  <div className="text-2xl font-bold text-white">
                    {(
                      performanceMetrics.disk.total -
                      performanceMetrics.disk.used
                    ).toFixed(0)}{" "}
                    GB
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-slate-300">Vitesse lecture</div>
                  <div className="text-2xl font-bold text-white">
                    {performanceMetrics.disk.readSpeed}
                  </div>
                  <div className="text-xs text-emerald-400">MB/s</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-slate-300">Vitesse écriture</div>
                  <div className="text-2xl font-bold text-white">
                    {performanceMetrics.disk.writeSpeed}
                  </div>
                  <div className="text-xs text-emerald-400">MB/s</div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="text-sm text-slate-300">
                  Opérations d'E/S (IOPS)
                </div>
                <div className="text-2xl font-bold text-emerald-400">
                  {performanceMetrics.disk.iops}
                </div>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3">
                <div
                  className="bg-emerald-500 h-3 rounded-full"
                  style={{ width: `${performanceMetrics.disk.percentage}%` }}
                ></div>
              </div>
              <div className="text-xs text-emerald-400">
                Performance disque: Bonne
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-colors">
            <CardContent className="p-6 text-center">
              <div className="p-3 bg-blue-500/20 rounded-xl w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <Zap className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-white font-medium mb-1">Optimiser CPU</h3>
              <p className="text-xs text-slate-400 mb-3">
                Gérer les processus CPU
              </p>
              <Button
                size="sm"
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Optimiser
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-colors">
            <CardContent className="p-6 text-center">
              <div className="p-3 bg-green-500/20 rounded-xl w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <MemoryStick className="h-6 w-6 text-green-400" />
              </div>
              <h3 className="text-white font-medium mb-1">Nettoyer Mémoire</h3>
              <p className="text-xs text-slate-400 mb-3">
                Libérer la mémoire RAM
              </p>
              <Button
                size="sm"
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Nettoyer
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-colors">
            <CardContent className="p-6 text-center">
              <div className="p-3 bg-purple-500/20 rounded-xl w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <HardDrive className="h-6 w-6 text-purple-400" />
              </div>
              <h3 className="text-white font-medium mb-1">Défragmenter</h3>
              <p className="text-xs text-slate-400 mb-3">Optimiser le disque</p>
              <Button
                size="sm"
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Défragmenter
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-colors">
            <CardContent className="p-6 text-center">
              <div className="p-3 bg-orange-500/20 rounded-xl w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-orange-400" />
              </div>
              <h3 className="text-white font-medium mb-1">Benchmark</h3>
              <p className="text-xs text-slate-400 mb-3">
                Tester les performances
              </p>
              <Button
                size="sm"
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                Tester
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
