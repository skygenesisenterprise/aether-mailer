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
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Ban,
  Activity,
  FileText,
  Search,
  Filter,
  RefreshCw,
  Download,
  Calendar,
  MoreHorizontal,
  Settings,
  Sword,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  AlertCircle,
  Info,
  Bug,
  LockKeyhole,
} from "lucide-react";

export default function DashboardSecurityPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("24h");
  const [securityStats, setSecurityStats] = useState({
    threatLevel: "low",
    totalThreats: 12,
    blockedThreats: 89,
    activeThreats: 3,
    securityScore: 94.2,
    firewallStatus: "active",
    antivirusStatus: "updated",
    sslCertificates: 12,
    expiredCertificates: 0,
    failedLogins: 23,
    successfulLogins: 1247,
    suspiciousActivities: 5,
    malwareScans: 156,
    virusesDetected: 2,
    phishingAttempts: 8,
    dataBreaches: 0,
  });

  const periods = ["1h", "6h", "24h", "7d", "30d"];

  useEffect(() => {
    // Simulate real-time security updates
    const interval = setInterval(() => {
      setSecurityStats((prev) => ({
        ...prev,
        totalThreats: prev.totalThreats + Math.floor(Math.random() * 2),
        blockedThreats: prev.blockedThreats + Math.floor(Math.random() * 3),
        successfulLogins: prev.successfulLogins + Math.floor(Math.random() * 5),
        malwareScans: prev.malwareScans + Math.floor(Math.random() * 2),
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1500);
  };

  const securityEvents = [
    {
      id: 1,
      type: "threat",
      severity: "high",
      title: "Tentative d'intrusion SSH",
      description: "Multiple failed login attempts from unknown IP",
      source: "192.168.1.100",
      target: "SSH Server",
      time: "Il y a 5 minutes",
      status: "blocked",
      actions: "IP bloqué, alerte envoyée",
    },
    {
      id: 2,
      type: "malware",
      severity: "critical",
      title: "Virus détecté dans email",
      description: "Trojan horse detected in incoming email attachment",
      source: "john.doe@external.com",
      target: "Email Server",
      time: "Il y a 15 minutes",
      status: "quarantined",
      actions: "Email mis en quarantaine, utilisateur notifié",
    },
    {
      id: 3,
      type: "phishing",
      severity: "medium",
      title: "Tentative de phishing",
      description: "Suspicious email attempting to steal credentials",
      source: "support@fake-company.com",
      target: "Multiple Users",
      time: "Il y a 1 heure",
      status: "blocked",
      actions: "Email bloqué, utilisateurs avertis",
    },
    {
      id: 4,
      type: "vulnerability",
      severity: "medium",
      title: "Vulnérabilité SSL découverte",
      description: "Outdated SSL certificate detected on web server",
      source: "Security Scanner",
      target: "Web Server",
      time: "Il y a 2 heures",
      status: "resolved",
      actions: "Certificate renewed, service restarted",
    },
    {
      id: 5,
      type: "data_breach",
      severity: "low",
      title: "Accès non autorisé détecté",
      description: "Unauthorized access attempt to sensitive data",
      source: "10.0.0.50",
      target: "Database Server",
      time: "Il y a 3 heures",
      status: "blocked",
      actions: "Access denied, IP logged and monitored",
    },
  ];

  const securityPolicies = [
    {
      name: "Password Policy",
      status: "active",
      compliance: 95,
      lastUpdated: "Il y a 2 jours",
      description: "Minimum 12 characters, 2FA required",
    },
    {
      name: "Firewall Rules",
      status: "active",
      compliance: 100,
      lastUpdated: "Il y a 1 heure",
      description: "All ports secured, intrusion detection active",
    },
    {
      name: "Data Encryption",
      status: "active",
      compliance: 88,
      lastUpdated: "Il y a 6 heures",
      description: "AES-256 encryption for all sensitive data",
    },
    {
      name: "Access Control",
      status: "warning",
      compliance: 72,
      lastUpdated: "Il y a 1 jour",
      description: "Some users have excessive permissions",
    },
  ];

  const recentLogins = [
    {
      user: "admin@aether-mailer.com",
      ip: "192.168.1.10",
      location: "Paris, France",
      time: "Il y a 2 minutes",
      status: "success",
      device: "Windows 11 / Chrome",
    },
    {
      user: "john.doe@company.com",
      ip: "192.168.1.50",
      location: "Lyon, France",
      time: "Il y a 15 minutes",
      status: "success",
      device: "macOS / Safari",
    },
    {
      user: "unknown@external.com",
      ip: "22.22.22.22",
      location: "Unknown",
      time: "Il y a 1 heure",
      status: "failed",
      device: "Unknown / Unknown",
    },
    {
      user: "support@company.com",
      ip: "192.168.1.25",
      location: "Marseille, France",
      time: "Il y a 2 heures",
      status: "success",
      device: "Ubuntu / Firefox",
    },
  ];

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <XCircle className="h-4 w-4 text-red-400" />;
      case "high":
        return <AlertTriangle className="h-4 w-4 text-orange-400" />;
      case "medium":
        return <AlertCircle className="h-4 w-4 text-yellow-400" />;
      case "low":
        return <Info className="h-4 w-4 text-blue-400" />;
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
      case "high":
        return (
          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
            Élevé
          </Badge>
        );
      case "medium":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            Moyen
          </Badge>
        );
      case "low":
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
            Faible
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
      case "active":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            Actif
          </Badge>
        );
      case "blocked":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            Bloqué
          </Badge>
        );
      case "quarantined":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            Quarantaine
          </Badge>
        );
      case "resolved":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            Résolu
          </Badge>
        );
      case "warning":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            Attention
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

  const getLoginStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-400" />;
      default:
        return <Activity className="h-4 w-4 text-slate-400" />;
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
                Tableau de Bord Sécurité
              </h1>
              <p className="text-slate-400 text-lg">
                Surveillance et protection complète du système de messagerie
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
        {/* Security Overview */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-green-900/20 to-green-800/10 border-green-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-green-500/20 rounded-xl">
                  <ShieldCheck className="h-6 w-6 text-green-400" />
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-400" />
                  <span className="text-xs text-green-400">Stable</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-3xl font-bold text-white">
                {securityStats.securityScore}%
              </div>
              <div className="text-sm text-slate-400">Score de sécurité</div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${securityStats.securityScore}%` }}
                ></div>
              </div>
              <div className="text-xs text-green-400">
                Excellente protection
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-900/20 to-red-800/10 border-red-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-red-500/20 rounded-xl">
                  <ShieldAlert className="h-6 w-6 text-red-400" />
                </div>
                <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs px-2 py-1">
                  Actives
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-3xl font-bold text-white">
                {securityStats.activeThreats}
              </div>
              <div className="text-sm text-slate-400">Menaces actives</div>
              <div className="text-xs text-red-400">
                {securityStats.totalThreats} total détectées
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 border-blue-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-blue-500/20 rounded-xl">
                  <ShieldCheck className="h-6 w-6 text-blue-400" />
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-400" />
                  <span className="text-xs text-green-400">Actif</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-3xl font-bold text-white">
                {securityStats.blockedThreats}
              </div>
              <div className="text-sm text-slate-400">Menaces bloquées</div>
              <div className="text-xs text-blue-400">
                Firewall: {securityStats.firewallStatus}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-purple-500/20 rounded-xl">
                  <Bug className="h-6 w-6 text-purple-400" />
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-400" />
                  <span className="text-xs text-green-400">À jour</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-3xl font-bold text-white">
                {securityStats.virusesDetected}
              </div>
              <div className="text-sm text-slate-400">Virus détectés</div>
              <div className="text-xs text-purple-400">
                {securityStats.malwareScans} scans effectués
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Security Events */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white font-bold">
                  Événements de Sécurité
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Menaces détectées et actions de sécurité récentes
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                  {securityStats.activeThreats} Actives
                </Badge>
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
              {securityEvents.map((event) => (
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
                          {event.title}
                        </p>
                        {getSeverityBadge(event.severity)}
                        {getStatusBadge(event.status)}
                      </div>
                      <p className="text-xs text-slate-400 mb-1">
                        {event.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>Source: {event.source}</span>
                        <span>Cible: {event.target}</span>
                        <span>{event.time}</span>
                      </div>
                      {event.actions && (
                        <div className="mt-1 text-xs text-green-400">
                          Actions: {event.actions}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs text-slate-400">
                        ID: #{event.id}
                      </div>
                      <div className="text-xs text-slate-500">
                        Type: {event.type}
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

        {/* Security Policies */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white font-bold">
                  Politiques de Sécurité
                </CardTitle>
                <CardDescription className="text-slate-400">
                  État des politiques et conformité sécurité
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-white"
              >
                <Settings className="h-4 w-4 mr-2" />
                Configurer
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {securityPolicies.map((policy, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border border-slate-700 rounded-lg hover:bg-slate-700/50 transition-all duration-200"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-slate-700 rounded-lg">
                      {policy.status === "active" ? (
                        <ShieldCheck className="h-4 w-4 text-green-400" />
                      ) : (
                        <ShieldAlert className="h-4 w-4 text-yellow-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-white">
                          {policy.name}
                        </p>
                        {getStatusBadge(policy.status)}
                      </div>
                      <p className="text-xs text-slate-400">
                        {policy.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                        <span>Mis à jour: {policy.lastUpdated}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-lg font-bold text-white">
                        {policy.compliance}%
                      </div>
                      <div className="text-xs text-slate-400">Conformité</div>
                    </div>
                    <div className="w-20 bg-slate-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          policy.compliance >= 90
                            ? "bg-green-500"
                            : policy.compliance >= 70
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }`}
                        style={{ width: `${policy.compliance}%` }}
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

        {/* Recent Logins */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white font-bold">
                    Connexions Récentes
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Activité de connexion et tentatives d'accès
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    {securityStats.successfulLogins} Succès
                  </Badge>
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                    {securityStats.failedLogins} Échecs
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentLogins.map((login, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border border-slate-700 rounded-lg hover:bg-slate-700/50 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1 bg-slate-700 rounded-lg">
                        {getLoginStatusIcon(login.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-white truncate">
                            {login.user}
                          </p>
                          {login.status === "success" ? (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                              Succès
                            </Badge>
                          ) : (
                            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                              Échec
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-400">
                          <span>IP: {login.ip}</span>
                          <span>{login.location}</span>
                          <span>{login.device}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-400">{login.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white font-bold">
                    Statistiques Menaces
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Répartition des types de menaces détectées
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bug className="h-4 w-4 text-orange-400" />
                    <span className="text-sm text-slate-300">Malware</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">
                      {securityStats.malwareScans}
                    </span>
                    <span className="text-xs text-slate-400">scans</span>
                  </div>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-orange-500 h-2 rounded-full"
                    style={{ width: "75%" }}
                  ></div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-400" />
                    <span className="text-sm text-slate-300">Phishing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">
                      {securityStats.phishingAttempts}
                    </span>
                    <span className="text-xs text-slate-400">tentatives</span>
                  </div>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-yellow-500 h-2 rounded-full"
                    style={{ width: "45%" }}
                  ></div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sword className="h-4 w-4 text-red-400" />
                    <span className="text-sm text-slate-300">Intrusion</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">
                      {securityStats.failedLogins}
                    </span>
                    <span className="text-xs text-slate-400">tentatives</span>
                  </div>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{ width: "25%" }}
                  ></div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldX className="h-4 w-4 text-purple-400" />
                    <span className="text-sm text-slate-300">
                      Vulnérabilités
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">
                      {securityStats.expiredCertificates}
                    </span>
                    <span className="text-xs text-slate-400">détectées</span>
                  </div>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full"
                    style={{ width: "5%" }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-colors">
            <CardContent className="p-6 text-center">
              <div className="p-3 bg-blue-500/20 rounded-xl w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <Shield className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-white font-medium mb-1">Scanner Sécurité</h3>
              <p className="text-xs text-slate-400 mb-3">
                Analyse complète des vulnérabilités
              </p>
              <Button
                size="sm"
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Scanner
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-colors">
            <CardContent className="p-6 text-center">
              <div className="p-3 bg-green-500/20 rounded-xl w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <LockKeyhole className="h-6 w-6 text-green-400" />
              </div>
              <h3 className="text-white font-medium mb-1">Mettre à Jour</h3>
              <p className="text-xs text-slate-400 mb-3">
                Mettre à jour les certificats SSL
              </p>
              <Button
                size="sm"
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Mettre à jour
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-colors">
            <CardContent className="p-6 text-center">
              <div className="p-3 bg-purple-500/20 rounded-xl w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <Ban className="h-6 w-6 text-purple-400" />
              </div>
              <h3 className="text-white font-medium mb-1">Bloquer IP</h3>
              <p className="text-xs text-slate-400 mb-3">
                Gérer la liste noire IP
              </p>
              <Button
                size="sm"
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Gérer
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-colors">
            <CardContent className="p-6 text-center">
              <div className="p-3 bg-orange-500/20 rounded-xl w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <FileText className="h-6 w-6 text-orange-400" />
              </div>
              <h3 className="text-white font-medium mb-1">Rapports</h3>
              <p className="text-xs text-slate-400 mb-3">
                Générer des rapports sécurité
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
