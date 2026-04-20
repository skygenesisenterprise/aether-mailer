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
  Send,
  Inbox,
  Clock,
  Activity,
  Database,
  Shield,
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
} from "lucide-react";

export default function DashboardOverviewPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("7j");
  const [emailStats, setEmailStats] = useState({
    sent: 1247,
    received: 3842,
    failed: 23,
    pending: 156,
    spamBlocked: 89,
    virusDetected: 2,
  });

  const periods = ["24h", "7j", "30j", "90j"];

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setEmailStats((prev) => ({
        ...prev,
        sent: prev.sent + Math.floor(Math.random() * 3),
        received: prev.received + Math.floor(Math.random() * 5),
        pending: Math.max(0, prev.pending + Math.floor(Math.random() * 3) - 1),
      }));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1500);
  };

  const recentEmails = [
    {
      id: 1,
      from: "john.doe@company.com",
      to: "admin@aether-mailer.com",
      subject: "Rapport mensuel - Performance système",
      status: "delivered",
      time: "Il y a 2 minutes",
      size: "2.3 MB",
    },
    {
      id: 2,
      from: "newsletter@techblog.com",
      to: "users@aether-mailer.com",
      subject: "Newsletter hebdomadaire - Actualités tech",
      status: "delivered",
      time: "Il y a 15 minutes",
      size: "156 KB",
    },
    {
      id: 3,
      from: "support@client.com",
      to: "help@aether-mailer.com",
      subject: "Problème de connexion IMAP",
      status: "failed",
      time: "Il y a 1 heure",
      size: "45 KB",
    },
    {
      id: 4,
      from: "system@aether-mailer.com",
      to: "admin@aether-mailer.com",
      subject: "Alerte sécurité - Tentative d'intrusion",
      status: "delivered",
      time: "Il y a 2 heures",
      size: "89 KB",
    },
    {
      id: 5,
      from: "backup@server.com",
      to: "admin@aether-mailer.com",
      subject: "Backup quotidien terminé",
      status: "delivered",
      time: "Il y a 3 heures",
      size: "1.2 GB",
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
                Vue d'ensemble du Dashboard
              </h1>
              <p className="text-slate-400 text-lg">
                Analyse complète des performances et activités du serveur de
                messagerie
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
        {/* Email Statistics Overview */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-green-900/20 to-green-800/10 border-green-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-green-500/20 rounded-xl">
                  <Send className="h-6 w-6 text-green-400" />
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-400" />
                  <span className="text-xs text-green-400">+15%</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-3xl font-bold text-white">
                {emailStats.sent.toLocaleString()}
              </div>
              <div className="text-sm text-slate-400">Emails envoyés</div>
              <div className="text-xs text-green-400">
                Taux de succès: 98.2%
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 border-blue-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-blue-500/20 rounded-xl">
                  <Inbox className="h-6 w-6 text-blue-400" />
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-blue-400" />
                  <span className="text-xs text-blue-400">+8%</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-3xl font-bold text-white">
                {emailStats.received.toLocaleString()}
              </div>
              <div className="text-sm text-slate-400">Emails reçus</div>
              <div className="text-xs text-blue-400">Moyenne: 549/jour</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-900/20 to-yellow-800/10 border-yellow-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-yellow-500/20 rounded-xl">
                  <Clock className="h-6 w-6 text-yellow-400" />
                </div>
                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs px-2 py-1">
                  En attente
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-3xl font-bold text-white">
                {emailStats.pending}
              </div>
              <div className="text-sm text-slate-400">Emails en attente</div>
              <div className="text-xs text-yellow-400">
                Délai moyen: 2.3 min
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
                  <span className="text-xs text-red-400">-5%</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-3xl font-bold text-white">
                {emailStats.failed}
              </div>
              <div className="text-sm text-slate-400">Emails échoués</div>
              <div className="text-xs text-red-400">Taux d'échec: 0.6%</div>
            </CardContent>
          </Card>
        </div>

        {/* Security Overview */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-700/50 shadow-xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white font-bold flex items-center gap-2">
                  <Shield className="h-5 w-5 text-purple-400" />
                  Sécurité
                </CardTitle>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  Actif
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Spam bloqués</span>
                <span className="text-sm font-medium text-purple-400">
                  {emailStats.spamBlocked}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Virus détectés</span>
                <span className="text-sm font-medium text-red-400">
                  {emailStats.virusDetected}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Menaces bloquées</span>
                <span className="text-sm font-medium text-green-400">91</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: "99.8%" }}
                ></div>
              </div>
              <div className="text-xs text-green-400">Protection: 99.8%</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-900/20 to-orange-800/10 border-orange-700/50 shadow-xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white font-bold flex items-center gap-2">
                  <Activity className="h-5 w-5 text-orange-400" />
                  Performance
                </CardTitle>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  Optimal
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Temps de réponse</span>
                <span className="text-sm font-medium text-green-400">45ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Débit actuel</span>
                <span className="text-sm font-medium text-blue-400">
                  1.2 Gbps
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Connexions</span>
                <span className="text-sm font-medium text-white">1,247</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-orange-500 h-2 rounded-full"
                  style={{ width: "87%" }}
                ></div>
              </div>
              <div className="text-xs text-orange-400">Efficacité: 87%</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-cyan-900/20 to-cyan-800/10 border-cyan-700/50 shadow-xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white font-bold flex items-center gap-2">
                  <Database className="h-5 w-5 text-cyan-400" />
                  Stockage
                </CardTitle>
                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                  Attention
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Espace utilisé</span>
                <span className="text-sm font-medium text-yellow-400">67%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Total disponible</span>
                <span className="text-sm font-medium text-white">180 GB</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Emails stockés</span>
                <span className="text-sm font-medium text-cyan-400">2.4M</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full"
                  style={{ width: "67%" }}
                ></div>
              </div>
              <div className="text-xs text-yellow-400">
                Nettoyage recommandé
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Emails Activity */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white font-bold">
                  Activité Email Récente
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Derniers emails traités par le système
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
              {recentEmails.map((email) => (
                <div
                  key={email.id}
                  className="flex items-center justify-between p-4 border border-slate-700 rounded-lg hover:bg-slate-700/50 transition-all duration-200"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-slate-700 rounded-lg">
                      {getStatusIcon(email.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-white truncate">
                          {email.subject}
                        </p>
                        {getStatusBadge(email.status)}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {email.from}
                        </span>
                        <span className="flex items-center gap-1">
                          <ArrowUp className="h-3 w-3" />
                          {email.to}
                        </span>
                        <span className="flex items-center gap-1">
                          <Database className="h-3 w-3" />
                          {email.size}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs text-slate-400">{email.time}</div>
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
                <Mail className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-white font-medium mb-1">Envoyer Email</h3>
              <p className="text-xs text-slate-400 mb-3">
                Composer un nouvel email
              </p>
              <Button
                size="sm"
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Composer
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-colors">
            <CardContent className="p-6 text-center">
              <div className="p-3 bg-green-500/20 rounded-xl w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
              <h3 className="text-white font-medium mb-1">Queue Emails</h3>
              <p className="text-xs text-slate-400 mb-3">
                Gérer les emails en attente
              </p>
              <Button
                size="sm"
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Voir Queue
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-colors">
            <CardContent className="p-6 text-center">
              <div className="p-3 bg-purple-500/20 rounded-xl w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <Shield className="h-6 w-6 text-purple-400" />
              </div>
              <h3 className="text-white font-medium mb-1">Sécurité</h3>
              <p className="text-xs text-slate-400 mb-3">
                Scanner et configurer
              </p>
              <Button
                size="sm"
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Scanner
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-colors">
            <CardContent className="p-6 text-center">
              <div className="p-3 bg-orange-500/20 rounded-xl w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-orange-400" />
              </div>
              <h3 className="text-white font-medium mb-1">Rapports</h3>
              <p className="text-xs text-slate-400 mb-3">
                Générer des rapports
              </p>
              <Button
                size="sm"
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                Générer
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
