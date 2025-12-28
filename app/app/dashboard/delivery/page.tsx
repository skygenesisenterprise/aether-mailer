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
  Mail,
  Truck,
  Clock,
  Activity,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  RefreshCw,
  Download,
  Calendar,
  ArrowUp,
  Filter,
  Search,
  Eye,
  MoreHorizontal,
  User,
  MailCheck,
  XCircle,
  AlertTriangle,
  Server,
  Wifi,
  Target,
  Navigation,
  Route,
  Package,
} from "lucide-react";

export default function DashboardDeliveryPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("24h");
  const [deliveryStats, setDeliveryStats] = useState({
    totalSent: 1247,
    delivered: 1198,
    failed: 23,
    pending: 26,
    queued: 0,
    deferred: 0,
    bounced: 0,
    delayed: 0,
    successRate: 96.1,
    avgDeliveryTime: 2.3,
  });

  const periods = ["1h", "6h", "24h", "7j", "30j"];

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setDeliveryStats((prev) => ({
        ...prev,
        totalSent: prev.totalSent + Math.floor(Math.random() * 3),
        delivered: prev.delivered + Math.floor(Math.random() * 3),
        avgDeliveryTime: Math.max(
          1.5,
          Math.min(5.0, prev.avgDeliveryTime + (Math.random() - 0.5) * 0.3),
        ),
      }));
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1500);
  };

  const deliveryEvents = [
    {
      id: 1,
      messageId: "msg-2024-001",
      from: "john.doe@company.com",
      to: "client@external.com",
      subject: "Rapport mensuel - Performance Q4",
      status: "delivered",
      server: "smtp-primary-01",
      route: "direct",
      time: "Il y a 2 minutes",
      deliveryTime: "1.2s",
      size: "2.3 MB",
      attempts: 1,
    },
    {
      id: 2,
      messageId: "msg-2024-002",
      from: "newsletter@techblog.com",
      to: "subscribers@lists.com",
      subject: "Newsletter hebdomadaire - Tech News",
      status: "delivered",
      server: "smtp-secondary-02",
      route: "relay",
      time: "Il y a 15 minutes",
      deliveryTime: "3.8s",
      size: "156 KB",
      attempts: 1,
    },
    {
      id: 3,
      messageId: "msg-2024-003",
      from: "support@client.com",
      to: "help@external.com",
      subject: "Ticket support #12345 - Résolu",
      status: "failed",
      server: "smtp-primary-01",
      route: "direct",
      time: "Il y a 1 heure",
      deliveryTime: "N/A",
      size: "45 KB",
      attempts: 3,
      error: "Connection timeout",
    },
    {
      id: 4,
      messageId: "msg-2024-004",
      from: "system@aether-mailer.com",
      to: "admin@partner.com",
      subject: "Alerte sécurité - Mise à jour requise",
      status: "delivered",
      server: "smtp-backup-03",
      route: "fallback",
      time: "Il y a 2 heures",
      deliveryTime: "5.1s",
      size: "89 KB",
      attempts: 2,
    },
    {
      id: 5,
      messageId: "msg-2024-005",
      from: "billing@company.com",
      to: "customers@domain.com",
      subject: "Facture #F2024-001 - Échéance 30 jours",
      status: "pending",
      server: "smtp-primary-01",
      route: "direct",
      time: "Il y a 3 heures",
      deliveryTime: "En cours",
      size: "234 KB",
      attempts: 1,
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <MailCheck className="h-4 w-4 text-green-400" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-400" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-400" />;
      case "deferred":
        return <AlertTriangle className="h-4 w-4 text-orange-400" />;
      default:
        return <Mail className="h-4 w-4 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "delivered":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            Livré
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            Échoué
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            En attente
          </Badge>
        );
      case "deferred":
        return (
          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
            Différé
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

  const getRouteIcon = (route: string) => {
    switch (route) {
      case "direct":
        return <Navigation className="h-4 w-4 text-blue-400" />;
      case "relay":
        return <Route className="h-4 w-4 text-purple-400" />;
      case "fallback":
        return <Navigation className="h-4 w-4 text-orange-400" />;
      default:
        return <Route className="h-4 w-4 text-slate-400" />;
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
                Tableau de Bord Livraison
              </h1>
              <p className="text-slate-400 text-lg">
                Surveillance et analyse des performances de livraison des emails
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
        {/* Delivery Statistics Overview */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-green-900/20 to-green-800/10 border-green-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-green-500/20 rounded-xl">
                  <Truck className="h-6 w-6 text-green-400" />
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-400" />
                  <span className="text-xs text-green-400">+8%</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-3xl font-bold text-white">
                {deliveryStats.delivered.toLocaleString()}
              </div>
              <div className="text-sm text-slate-400">Emails livrés</div>
              <div className="text-xs text-green-400">
                Taux: {deliveryStats.successRate}%
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-900/20 to-red-800/10 border-red-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-red-500/20 rounded-xl">
                  <XCircle className="h-6 w-6 text-red-400" />
                </div>
                <div className="flex items-center gap-1">
                  <TrendingDown className="h-3 w-3 text-red-400" />
                  <span className="text-xs text-red-400">-12%</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-3xl font-bold text-white">
                {deliveryStats.failed}
              </div>
              <div className="text-sm text-slate-400">Échecs de livraison</div>
              <div className="text-xs text-red-400">Taux d'échec: 1.8%</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-900/20 to-yellow-800/10 border-yellow-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-yellow-500/20 rounded-xl">
                  <Clock className="h-6 w-6 text-yellow-400" />
                </div>
                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs px-2 py-1">
                  En cours
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-3xl font-bold text-white">
                {deliveryStats.pending}
              </div>
              <div className="text-sm text-slate-400">En attente</div>
              <div className="text-xs text-yellow-400">
                Queue: {deliveryStats.queued}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 border-blue-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-blue-500/20 rounded-xl">
                  <Target className="h-6 w-6 text-blue-400" />
                </div>
                <div className="flex items-center gap-1">
                  <Activity className="h-3 w-3 text-blue-400" />
                  <span className="text-xs text-blue-400">Optimal</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-3xl font-bold text-white">
                {deliveryStats.avgDeliveryTime}s
              </div>
              <div className="text-sm text-slate-400">Temps moyen</div>
              <div className="text-xs text-blue-400">
                Total: {deliveryStats.totalSent.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Server Performance */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-700/50 shadow-xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white font-bold flex items-center gap-2">
                  <Server className="h-5 w-5 text-purple-400" />
                  Serveurs SMTP
                </CardTitle>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  3 Actifs
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">
                    smtp-primary-01
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-400">Actif</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">
                    smtp-secondary-02
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-400">Actif</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">smtp-backup-03</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <span className="text-xs text-yellow-400">Standby</span>
                  </div>
                </div>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-purple-500 h-2 rounded-full"
                  style={{ width: "87%" }}
                ></div>
              </div>
              <div className="text-xs text-purple-400">Charge moyenne: 87%</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-900/20 to-orange-800/10 border-orange-700/50 shadow-xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white font-bold flex items-center gap-2">
                  <Route className="h-5 w-5 text-orange-400" />
                  Routes de Livraison
                </CardTitle>
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                  Optimales
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">Direct</span>
                  <span className="text-sm font-medium text-blue-400">67%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">Relay</span>
                  <span className="text-sm font-medium text-purple-400">
                    23%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">Fallback</span>
                  <span className="text-sm font-medium text-orange-400">
                    10%
                  </span>
                </div>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-orange-500 h-2 rounded-full"
                  style={{ width: "92%" }}
                ></div>
              </div>
              <div className="text-xs text-orange-400">Efficacité: 92%</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-cyan-900/20 to-cyan-800/10 border-cyan-700/50 shadow-xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white font-bold flex items-center gap-2">
                  <Wifi className="h-5 w-5 text-cyan-400" />
                  Réseau
                </CardTitle>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  Stable
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">Bande passante</span>
                  <span className="text-sm font-medium text-cyan-400">
                    1.2 Gbps
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">Latence</span>
                  <span className="text-sm font-medium text-green-400">
                    12ms
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">Perte paquets</span>
                  <span className="text-sm font-medium text-green-400">
                    0.01%
                  </span>
                </div>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-cyan-500 h-2 rounded-full"
                  style={{ width: "95%" }}
                ></div>
              </div>
              <div className="text-xs text-cyan-400">Qualité: 95%</div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Delivery Events */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white font-bold">
                  Événements de Livraison Récents
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Derniers emails traités avec détails de livraison
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
              {deliveryEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-4 border border-slate-700 rounded-lg hover:bg-slate-700/50 transition-all duration-200"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-slate-700 rounded-lg">
                      {getStatusIcon(event.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-white truncate">
                          {event.subject}
                        </p>
                        {getStatusBadge(event.status)}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {event.from}
                        </span>
                        <span className="flex items-center gap-1">
                          <ArrowUp className="h-3 w-3" />
                          {event.to}
                        </span>
                        <span className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          {event.size}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Server className="h-3 w-3" />
                          {event.server}
                        </span>
                        <span className="flex items-center gap-1">
                          {getRouteIcon(event.route)}
                          {event.route}
                        </span>
                        <span className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          {event.deliveryTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <Activity className="h-3 w-3" />
                          {event.attempts} tentative
                          {event.attempts > 1 ? "s" : ""}
                        </span>
                      </div>
                      {event.error && (
                        <div className="mt-1 text-xs text-red-400">
                          Erreur: {event.error}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs text-slate-400">{event.time}</div>
                      <div className="text-xs text-slate-500">
                        ID: {event.messageId}
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
                <Truck className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-white font-medium mb-1">Queue Livraison</h3>
              <p className="text-xs text-slate-400 mb-3">
                Gérer les emails en attente
              </p>
              <Button
                size="sm"
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Voir Queue
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-colors">
            <CardContent className="p-6 text-center">
              <div className="p-3 bg-green-500/20 rounded-xl w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
              <h3 className="text-white font-medium mb-1">Relancer Échecs</h3>
              <p className="text-xs text-slate-400 mb-3">
                Retenter les emails échoués
              </p>
              <Button
                size="sm"
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Relancer
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-colors">
            <CardContent className="p-6 text-center">
              <div className="p-3 bg-purple-500/20 rounded-xl w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <Route className="h-6 w-6 text-purple-400" />
              </div>
              <h3 className="text-white font-medium mb-1">Optimiser Routes</h3>
              <p className="text-xs text-slate-400 mb-3">
                Configurer les routes de livraison
              </p>
              <Button
                size="sm"
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Configurer
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-colors">
            <CardContent className="p-6 text-center">
              <div className="p-3 bg-orange-500/20 rounded-xl w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-orange-400" />
              </div>
              <h3 className="text-white font-medium mb-1">
                Rapports Livraison
              </h3>
              <p className="text-xs text-slate-400 mb-3">
                Analyser les performances
              </p>
              <Button
                size="sm"
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                Analyser
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
