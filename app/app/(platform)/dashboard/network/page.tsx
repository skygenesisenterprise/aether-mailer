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
  Wifi,
  Activity,
  Shield,
  CheckCircle,
  TrendingDown,
  BarChart3,
  RefreshCw,
  Download,
  Upload,
  Calendar,
  Filter,
  Search,
  Eye,
  MoreHorizontal,
  AlertTriangle,
  XCircle,
  Zap,
  Router,
  Network,
  Signal,
  Settings,
  Lock,
} from "lucide-react";

export default function DashboardNetworkPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("1h");
  const [networkStats, setNetworkStats] = useState({
    bandwidth: 1.2,
    latency: 12,
    packetLoss: 0.01,
    uptime: 99.98,
    connections: 1247,
    activeInterfaces: 4,
    totalInterfaces: 6,
    dataTransferred: {
      upload: 847.3,
      download: 2341.7,
    },
    securityEvents: 3,
    blockedConnections: 89,
  });

  const periods = ["5m", "15m", "1h", "6h", "24h"];

  useEffect(() => {
    // Simulate real-time network updates
    const interval = setInterval(() => {
      setNetworkStats((prev) => ({
        ...prev,
        bandwidth: Math.max(
          0.8,
          Math.min(2.0, prev.bandwidth + (Math.random() - 0.5) * 0.1),
        ),
        latency: Math.max(
          8,
          Math.min(25, prev.latency + (Math.random() - 0.5) * 2),
        ),
        connections: Math.max(
          1000,
          Math.min(1500, prev.connections + Math.floor(Math.random() * 10) - 5),
        ),
        dataTransferred: {
          upload: prev.dataTransferred.upload + Math.random() * 2,
          download: prev.dataTransferred.download + Math.random() * 5,
        },
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1500);
  };

  const networkInterfaces = [
    {
      id: "eth0",
      name: "Ethernet Principal",
      type: "ethernet",
      status: "active",
      speed: "1 Gbps",
      ip: "192.168.1.10",
      mac: "00:1A:2B:3C:4D:5E",
      rx: 2341.7,
      tx: 847.3,
      utilization: 67,
    },
    {
      id: "wlan0",
      name: "Wi-Fi Principal",
      type: "wifi",
      status: "active",
      speed: "867 Mbps",
      ip: "192.168.1.11",
      mac: "00:1A:2B:3C:4D:5F",
      rx: 123.4,
      tx: 89.2,
      utilization: 23,
    },
    {
      id: "eth1",
      name: "Ethernet Backup",
      type: "ethernet",
      status: "standby",
      speed: "1 Gbps",
      ip: "192.168.1.12",
      mac: "00:1A:2B:3C:4D:60",
      rx: 0,
      tx: 0,
      utilization: 0,
    },
    {
      id: "tun0",
      name: "VPN Tunnel",
      type: "vpn",
      status: "active",
      speed: "100 Mbps",
      ip: "10.0.0.1",
      mac: "N/A",
      rx: 456.7,
      tx: 234.1,
      utilization: 12,
    },
  ];

  const networkEvents = [
    {
      id: 1,
      type: "connection",
      severity: "info",
      source: "192.168.1.100",
      destination: "smtp.gmail.com:587",
      protocol: "TCP",
      status: "established",
      time: "Il y a 30 secondes",
      duration: "2m 15s",
      dataTransferred: "2.3 MB",
    },
    {
      id: 2,
      type: "security",
      severity: "warning",
      source: "Unknown",
      destination: "22.22.22.22:22",
      protocol: "TCP",
      status: "blocked",
      time: "Il y a 2 minutes",
      duration: "N/A",
      dataTransferred: "0 B",
      reason: "Brute force attempt detected",
    },
    {
      id: 3,
      type: "performance",
      severity: "error",
      source: "eth0",
      destination: "N/A",
      protocol: "N/A",
      status: "degraded",
      time: "Il y a 5 minutes",
      duration: "45s",
      dataTransferred: "N/A",
      reason: "High latency detected (>100ms)",
    },
    {
      id: 4,
      type: "connection",
      severity: "info",
      source: "192.168.1.50",
      destination: "api.github.com:443",
      protocol: "HTTPS",
      status: "established",
      time: "Il y a 8 minutes",
      duration: "5m 30s",
      dataTransferred: "15.7 MB",
    },
    {
      id: 5,
      type: "security",
      severity: "critical",
      source: "10.0.0.100",
      destination: "Internal Network",
      protocol: "ICMP",
      status: "blocked",
      time: "Il y a 12 minutes",
      duration: "N/A",
      dataTransferred: "0 B",
      reason: "DDoS attack detected",
    },
  ];

  const getInterfaceIcon = (type: string) => {
    switch (type) {
      case "ethernet":
        return <Network className="h-4 w-4 text-blue-400" />;
      case "wifi":
        return <Wifi className="h-4 w-4 text-green-400" />;
      case "vpn":
        return <Lock className="h-4 w-4 text-purple-400" />;
      default:
        return <Network className="h-4 w-4 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            Actif
          </Badge>
        );
      case "standby":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            Veille
          </Badge>
        );
      case "down":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            Hors service
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

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <XCircle className="h-4 w-4 text-red-400" />;
      case "error":
        return <AlertTriangle className="h-4 w-4 text-orange-400" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
      case "info":
        return <CheckCircle className="h-4 w-4 text-blue-400" />;
      default:
        return <Activity className="h-4 w-4 text-slate-400" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            Critique
          </Badge>
        );
      case "error":
        return (
          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
            Erreur
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

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-800">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Tableau de Bord Réseau
              </h1>
              <p className="text-slate-400 text-lg">
                Surveillance et analyse des performances réseau en temps réel
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
        {/* Network Performance Overview */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 border-blue-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-blue-500/20 rounded-xl">
                  <Wifi className="h-6 w-6 text-blue-400" />
                </div>
                <div className="flex items-center gap-1">
                  <Signal className="h-3 w-3 text-green-400" />
                  <span className="text-xs text-green-400">Stable</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-3xl font-bold text-white">
                {networkStats.bandwidth} Gbps
              </div>
              <div className="text-sm text-slate-400">Bande passante</div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: "78%" }}
                ></div>
              </div>
              <div className="text-xs text-blue-400">Utilisation: 78%</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-900/20 to-green-800/10 border-green-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-green-500/20 rounded-xl">
                  <Zap className="h-6 w-6 text-green-400" />
                </div>
                <div className="flex items-center gap-1">
                  <TrendingDown className="h-3 w-3 text-green-400" />
                  <span className="text-xs text-green-400">Optimal</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-3xl font-bold text-white">
                {networkStats.latency} ms
              </div>
              <div className="text-sm text-slate-400">Latence moyenne</div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: "24%" }}
                ></div>
              </div>
              <div className="text-xs text-green-400">Excellente</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-purple-500/20 rounded-xl">
                  <Network className="h-6 w-6 text-purple-400" />
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-400" />
                  <span className="text-xs text-green-400">Normal</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-3xl font-bold text-white">
                {networkStats.connections}
              </div>
              <div className="text-sm text-slate-400">Connexions actives</div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-purple-500 h-2 rounded-full"
                  style={{ width: "83%" }}
                ></div>
              </div>
              <div className="text-xs text-purple-400">Capacité: 83%</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-900/20 to-orange-800/10 border-orange-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-orange-500/20 rounded-xl">
                  <Shield className="h-6 w-6 text-orange-400" />
                </div>
                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs px-2 py-1">
                  Alertes
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-3xl font-bold text-white">
                {networkStats.securityEvents}
              </div>
              <div className="text-sm text-slate-400">Événements sécurité</div>
              <div className="text-xs text-orange-400">
                {networkStats.blockedConnections} connexions bloquées
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Network Interfaces */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white font-bold">
                  Interfaces Réseau
                </CardTitle>
                <CardDescription className="text-slate-400">
                  État et performances des interfaces réseau
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  {networkStats.activeInterfaces}/{networkStats.totalInterfaces}{" "}
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
            <div className="space-y-4">
              {networkInterfaces.map((networkInterface) => (
                <div
                  key={networkInterface.id}
                  className="flex items-center justify-between p-4 border border-slate-700 rounded-lg hover:bg-slate-700/50 transition-all duration-200"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-slate-700 rounded-lg">
                      {getInterfaceIcon(networkInterface.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-white">
                          {networkInterface.name}
                        </p>
                        {getStatusBadge(networkInterface.status)}
                        <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30 text-xs">
                          {networkInterface.speed}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <span>IP: {networkInterface.ip}</span>
                        <span>MAC: {networkInterface.mac}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Download className="h-3 w-3" />↓{" "}
                          {networkInterface.rx.toFixed(1)} MB
                        </span>
                        <span className="flex items-center gap-1">
                          <Upload className="h-3 w-3" />↑{" "}
                          {networkInterface.tx.toFixed(1)} MB
                        </span>
                        <span>
                          Utilisation: {networkInterface.utilization}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-full bg-slate-700 rounded-full h-2 w-24">
                      <div
                        className={`h-2 rounded-full ${
                          networkInterface.utilization > 80
                            ? "bg-red-500"
                            : networkInterface.utilization > 60
                              ? "bg-yellow-500"
                              : "bg-green-500"
                        }`}
                        style={{ width: `${networkInterface.utilization}%` }}
                      ></div>
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

        {/* Data Transfer Statistics */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-gradient-to-br from-cyan-900/20 to-cyan-800/10 border-cyan-700/50 shadow-xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white font-bold flex items-center gap-2">
                  <Download className="h-5 w-5 text-cyan-400" />
                  Téléchargement
                </CardTitle>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  Actif
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl font-bold text-white">
                {networkStats.dataTransferred.download.toFixed(1)} GB
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">Débit actuel</span>
                  <span className="text-sm font-medium text-cyan-400">
                    847 Mbps
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">
                    Pic aujourd'hui
                  </span>
                  <span className="text-sm font-medium text-white">
                    1.2 Gbps
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">Total ce mois</span>
                  <span className="text-sm font-medium text-slate-400">
                    23.4 TB
                  </span>
                </div>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3">
                <div
                  className="bg-cyan-500 h-3 rounded-full"
                  style={{ width: "71%" }}
                ></div>
              </div>
              <div className="text-xs text-cyan-400">
                Utilisation bande passante: 71%
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-900/20 to-emerald-800/10 border-emerald-700/50 shadow-xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white font-bold flex items-center gap-2">
                  <Upload className="h-5 w-5 text-emerald-400" />
                  Envoi
                </CardTitle>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  Actif
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl font-bold text-white">
                {networkStats.dataTransferred.upload.toFixed(1)} GB
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">Débit actuel</span>
                  <span className="text-sm font-medium text-emerald-400">
                    234 Mbps
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">
                    Pic aujourd'hui
                  </span>
                  <span className="text-sm font-medium text-white">
                    456 Mbps
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">Total ce mois</span>
                  <span className="text-sm font-medium text-slate-400">
                    8.7 TB
                  </span>
                </div>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3">
                <div
                  className="bg-emerald-500 h-3 rounded-full"
                  style={{ width: "39%" }}
                ></div>
              </div>
              <div className="text-xs text-emerald-400">
                Utilisation bande passante: 39%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Network Events */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white font-bold">
                  Événements Réseau
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Activité et événements de sécurité réseau en temps réel
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
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-400 hover:text-white"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {networkEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-4 border border-slate-700 rounded-lg hover:bg-slate-700/50 transition-all duration-200"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-slate-700 rounded-lg">
                      {getSeverityIcon(event.severity)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-white">
                          {event.protocol} - {event.source} →{" "}
                          {event.destination}
                        </p>
                        {getSeverityBadge(event.severity)}
                        {getStatusBadge(event.status)}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <span>Type: {event.type}</span>
                        <span>Durée: {event.duration}</span>
                        <span>Données: {event.dataTransferred}</span>
                      </div>
                      {event.reason && (
                        <div className="mt-1 text-xs text-orange-400">
                          Raison: {event.reason}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs text-slate-400">{event.time}</div>
                      <div className="text-xs text-slate-500">
                        ID: #{event.id}
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

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-colors">
            <CardContent className="p-6 text-center">
              <div className="p-3 bg-blue-500/20 rounded-xl w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <Router className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-white font-medium mb-1">
                Configurer Routeur
              </h3>
              <p className="text-xs text-slate-400 mb-3">
                Paramètres réseau avancés
              </p>
              <Button
                size="sm"
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Configurer
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-colors">
            <CardContent className="p-6 text-center">
              <div className="p-3 bg-green-500/20 rounded-xl w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <Shield className="h-6 w-6 text-green-400" />
              </div>
              <h3 className="text-white font-medium mb-1">Scanner Sécurité</h3>
              <p className="text-xs text-slate-400 mb-3">
                Analyser les menaces réseau
              </p>
              <Button
                size="sm"
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Scanner
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-colors">
            <CardContent className="p-6 text-center">
              <div className="p-3 bg-purple-500/20 rounded-xl w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-purple-400" />
              </div>
              <h3 className="text-white font-medium mb-1">Optimiser Réseau</h3>
              <p className="text-xs text-slate-400 mb-3">
                Améliorer les performances
              </p>
              <Button
                size="sm"
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Optimiser
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-colors">
            <CardContent className="p-6 text-center">
              <div className="p-3 bg-orange-500/20 rounded-xl w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <Activity className="h-6 w-6 text-orange-400" />
              </div>
              <h3 className="text-white font-medium mb-1">Diagnostics</h3>
              <p className="text-xs text-slate-400 mb-3">
                Tester la connectivité
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
