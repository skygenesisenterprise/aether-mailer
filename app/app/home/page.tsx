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
  Clock,
  Users,
  Activity,
  Server,
  Database,
  Globe,
  Shield,
  AlertTriangle,
  CheckCircle,
  Cpu,
  HardDrive,
  Wifi,
  Zap,
  RefreshCw,
  Download,
  Upload,
  Calendar,
  ArrowUp,
  MoreHorizontal,
} from "lucide-react";

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState("24h");
  const [serverStats, setServerStats] = useState({
    uptime: 99.9,
    cpu: 23,
    storage: 67,
    network: 1.2,
  });

  const timeRanges = ["1h", "24h", "7d", "30d"];

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setServerStats((prev) => ({
        ...prev,
        cpu: Math.max(10, Math.min(40, prev.cpu + (Math.random() - 0.5) * 5)),
        network: Math.max(
          0.8,
          Math.min(2.0, prev.network + (Math.random() - 0.5) * 0.2),
        ),
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-800">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Tableau de Bord Aether Mailer
              </h1>
              <p className="text-slate-400 text-lg">
                Surveillance et gestion complète du serveur de messagerie
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2 border border-slate-700">
                <Calendar className="h-4 w-4 text-blue-400" />
                <select
                  value={selectedTimeRange}
                  onChange={(e) => setSelectedTimeRange(e.target.value)}
                  className="bg-slate-800 text-white text-sm outline-none cursor-pointer"
                >
                  {timeRanges.map((range) => (
                    <option
                      key={range}
                      value={range}
                      className="bg-slate-800 text-white"
                    >
                      {range}
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
        {/* Quick Stats */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-green-500/20 rounded-xl">
                  <Server className="h-6 w-6 text-green-400" />
                </div>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs px-2 py-1">
                  Actif
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-3xl font-bold text-white">
                {serverStats.uptime}%
              </div>
              <div className="text-sm text-slate-400">Uptime serveur</div>
              <div className="flex items-center gap-2 text-xs text-green-400">
                <ArrowUp className="h-3 w-3" />
                <span>Stable</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-blue-500/20 rounded-xl">
                  <Cpu className="h-6 w-6 text-blue-400" />
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-400">Normal</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-3xl font-bold text-white">
                {serverStats.cpu.toFixed(1)}%
              </div>
              <div className="text-sm text-slate-400">Utilisation CPU</div>
              <div className="w-full bg-slate-700 rounded-full h-3">
                <div
                  className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${serverStats.cpu}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-yellow-500/20 rounded-xl">
                  <HardDrive className="h-6 w-6 text-yellow-400" />
                </div>
                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs px-2 py-1">
                  Attention
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-3xl font-bold text-white">
                {serverStats.storage}%
              </div>
              <div className="text-sm text-slate-400">Stockage utilisé</div>
              <div className="w-full bg-slate-700 rounded-full h-3">
                <div
                  className="bg-yellow-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${serverStats.storage}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-purple-500/20 rounded-xl">
                  <Wifi className="h-6 w-6 text-purple-400" />
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-400">Stable</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-3xl font-bold text-white">
                {serverStats.network} Gbps
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Upload className="h-3 w-3" />
                <span>↑ 800 Mbps</span>
                <span className="mx-1">•</span>
                <Download className="h-3 w-3" />
                <span>↓ 400 Mbps</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Email Service Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-300">
                  Emails/Jour
                </CardTitle>
                <Mail className="h-4 w-4 text-slate-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">3,842</div>
              <div className="flex items-center gap-1 text-xs text-green-400 mt-1">
                <ArrowUp className="h-3 w-3" />
                <span>+12% vs hier</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-300">
                  Comptes Actifs
                </CardTitle>
                <Users className="h-4 w-4 text-slate-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">247</div>
              <div className="flex items-center gap-1 text-xs text-green-400 mt-1">
                <ArrowUp className="h-3 w-3" />
                <span>+5 ce mois</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-300">
                  Domaines
                </CardTitle>
                <Globe className="h-4 w-4 text-slate-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">12</div>
              <div className="flex items-center gap-1 text-xs text-green-400 mt-1">
                <CheckCircle className="h-3 w-3" />
                <span>Tous vérifiés</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-300">
                  Sécurité
                </CardTitle>
                <Shield className="h-4 w-4 text-slate-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">100%</div>
              <div className="flex items-center gap-1 text-xs text-green-400 mt-1">
                <CheckCircle className="h-3 w-3" />
                <span>Protections actives</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Server Activity */}
          <Card className="lg:col-span-2 bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white font-bold">
                    Activité Serveur
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Événements système en temps réel
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-400 hover:text-white"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  type: "success",
                  service: "SMTP Server",
                  message: "Service démarré avec succès",
                  time: "Il y a 2 minutes",
                  icon: CheckCircle,
                },
                {
                  type: "warning",
                  service: "Stockage",
                  message: "Espace disque à 67% - Nettoyage recommandé",
                  time: "Il y a 1 heure",
                  icon: AlertTriangle,
                },
                {
                  type: "info",
                  service: "Database",
                  message: "Backup quotidien terminé avec succès",
                  time: "Il y a 3 heures",
                  icon: Database,
                },
                {
                  type: "success",
                  service: "SSL Certificate",
                  message: "Certificat renouvelé pour 90 jours",
                  time: "Il y a 6 heures",
                  icon: Shield,
                },
                {
                  type: "error",
                  service: "IMAP Server",
                  message: "Redémarrage automatique après erreur",
                  time: "Il y a 8 heures",
                  icon: AlertTriangle,
                },
              ].map((event, index) => {
                const IconComponent = event.icon;
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border border-slate-700 rounded-lg hover:bg-slate-700/50 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          event.type === "success"
                            ? "bg-green-500/20"
                            : event.type === "warning"
                              ? "bg-yellow-500/20"
                              : event.type === "error"
                                ? "bg-red-500/20"
                                : "bg-blue-500/20"
                        }`}
                      >
                        <IconComponent
                          className={`h-4 w-4 ${
                            event.type === "success"
                              ? "text-green-400"
                              : event.type === "warning"
                                ? "text-yellow-400"
                                : event.type === "error"
                                  ? "text-red-400"
                                  : "text-blue-400"
                          }`}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {event.service}
                        </p>
                        <p className="text-xs text-slate-400">
                          {event.message}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Clock className="h-3 w-3" />
                      {event.time}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white font-bold">
                  Actions Rapides
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Gestion système
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start bg-slate-700 hover:bg-slate-600 text-white">
                  <Database className="mr-2 h-4 w-4" />
                  Backup Base
                </Button>
                <Button className="w-full justify-start bg-slate-700 hover:bg-slate-600 text-white">
                  <Zap className="mr-2 h-4 w-4" />
                  Optimiser Performance
                </Button>
                <Button className="w-full justify-start bg-slate-700 hover:bg-slate-600 text-white">
                  <Shield className="mr-2 h-4 w-4" />
                  Scanner Sécurité
                </Button>
                <Button className="w-full justify-start bg-slate-700 hover:bg-slate-600 text-white">
                  <Activity className="mr-2 h-4 w-4" />
                  Logs Système
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white font-bold">
                  Performance
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Métriques en temps réel
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">
                      Taux de livraison
                    </span>
                    <span className="text-sm font-medium text-green-400">
                      98.7%
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: "98.7%" }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">
                      Latence moyenne
                    </span>
                    <span className="text-sm font-medium text-white">42ms</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: "42%" }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">
                      Connexions actives
                    </span>
                    <span className="text-sm font-medium text-white">
                      1,247
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full"
                      style={{ width: "62%" }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">
                      Espace disponible
                    </span>
                    <span className="text-sm font-medium text-yellow-400">
                      180 GB
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-yellow-500 h-2 rounded-full"
                      style={{ width: "33%" }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
