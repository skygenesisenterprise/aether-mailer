"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Mail,
  Users,
  Send,
  Archive,
  Shield,
  AlertTriangle,
  TrendingUp,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  Globe,
  Server,
  Database,
  Key,
} from "lucide-react";

const statsCards = [
  {
    title: "Emails envoyés",
    value: "24,593",
    change: "+12.5%",
    icon: <Send className="size-4" />,
    color: "text-blue-600",
  },
  {
    title: "Utilisateurs actifs",
    value: "1,847",
    change: "+5.2%",
    icon: <Users className="size-4" />,
    color: "text-green-600",
  },
  {
    title: "Domaines gérés",
    value: "42",
    change: "+2",
    icon: <Globe className="size-4" />,
    color: "text-purple-600",
  },
  {
    title: "Taux de livraison",
    value: "98.7%",
    change: "+0.3%",
    icon: <CheckCircle className="size-4" />,
    color: "text-emerald-600",
  },
];

const recentActivity = [
  {
    id: 1,
    type: "email_sent",
    message: "Campagne newsletter envoyée à 5,000 abonnés",
    time: "Il y a 2 minutes",
    status: "success",
    icon: <Mail className="size-4" />,
  },
  {
    id: 2,
    type: "user_created",
    message: "Nouvel utilisateur inscrit: jean.dupont@company.fr",
    time: "Il y a 15 minutes",
    status: "success",
    icon: <Users className="size-4" />,
  },
  {
    id: 3,
    type: "spam_detected",
    message: "Email suspect bloqué: phishing@dangerous.com",
    time: "Il y a 1 heure",
    status: "warning",
    icon: <AlertTriangle className="size-4" />,
  },
  {
    id: 4,
    type: "domain_added",
    message: "Nouveau domaine configuré: techcorp.io",
    time: "Il y a 2 heures",
    status: "success",
    icon: <Globe className="size-4" />,
  },
];

const quickActions = [
  {
    title: "Envoyer un email",
    description: "Composer et envoyer un nouvel email",
    icon: <Send className="size-5" />,
    href: "/dashboard/delivery",
    color: "bg-primary",
  },
  {
    title: "Gérer les utilisateurs",
    description: "Ajouter ou modifier des comptes utilisateur",
    icon: <Users className="size-5" />,
    href: "/directory/accounts",
    color: "bg-chart-2",
  },
  {
    title: "Configurer un domaine",
    description: "Ajouter un nouveau domaine de messagerie",
    icon: <Globe className="size-5" />,
    href: "/directory/domains",
    color: "bg-chart-3",
  },
  {
    title: "Voir les logs",
    description: "Analyser les logs système et d'erreur",
    icon: <Activity className="size-5" />,
    href: "/manage/logs",
    color: "bg-chart-5",
  },
];

const systemHealth = [
  {
    service: "Serveur de messagerie",
    status: "online",
    uptime: "15j 3h 24m",
    cpu: "12%",
    memory: "2.1 GB",
    icon: <Server className="size-4" />,
  },
  {
    service: "Base de données",
    status: "online",
    uptime: "15j 3h 28m",
    cpu: "8%",
    memory: "1.8 GB",
    icon: <Database className="size-4" />,
  },
  {
    service: "Redis Cache",
    status: "online",
    uptime: "10j 5h 12m",
    cpu: "3%",
    memory: "512 MB",
    icon: <Activity className="size-4" />,
  },
  {
    service: "Service SMTP",
    status: "online",
    uptime: "15j 3h 24m",
    cpu: "15%",
    memory: "256 MB",
    icon: <Mail className="size-4" />,
  },
];

export default function HomePage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
            Tableau de bord
          </h1>
          <p className="text-muted-foreground">
            Bienvenue dans Aether Mailer - Vue d'ensemble de votre système de
            messagerie
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Clock className="size-4 mr-2" />
            Dernière synchronisation: Il y a 2 min
          </Button>
          <Button size="sm">
            <TrendingUp className="size-4 mr-2" />
            Voir les statistiques
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat, index) => (
          <Card key={index} className="transition-shadow hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={stat.color}>{stat.icon}</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">{stat.change}</span> par
                rapport au mois dernier
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card className="transition-shadow hover:shadow-lg">
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
            <CardDescription>
              Accès rapide aux fonctionnalités principales
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                className="w-full justify-start h-auto p-4 hover:bg-accent hover:text-accent-foreground"
                asChild
              >
                <a href={action.href} className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg text-white ${action.color}`}>
                    {action.icon}
                  </div>
                  <div className="text-left">
                    <div className="font-medium">{action.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {action.description}
                    </div>
                  </div>
                </a>
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="transition-shadow hover:shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Activité récente</CardTitle>
              <Button variant="outline" size="sm">
                Voir tout
              </Button>
            </div>
            <CardDescription>
              Les dernières activités du système
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-full ${
                      activity.status === "success"
                        ? "bg-green-100 text-green-600"
                        : activity.status === "warning"
                          ? "bg-yellow-100 text-yellow-600"
                          : "bg-red-100 text-red-600"
                    }`}
                  >
                    {activity.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <Card className="transition-shadow hover:shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Santé du système</CardTitle>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-sm text-green-600">
                Tous les services en ligne
              </span>
            </div>
          </div>
          <CardDescription>
            État des services critiques du système
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {systemHealth.map((service, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 border rounded-lg"
              >
                <div
                  className={`p-2 rounded-full ${
                    service.status === "online"
                      ? "bg-green-100 text-green-600"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {service.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{service.service}</div>
                  <div className="text-xs text-muted-foreground">
                    {service.uptime}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs">CPU: {service.cpu}</span>
                    <span className="text-xs">RAM: {service.memory}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="transition-shadow hover:shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="size-4" />
              Volume d'emails (7 jours)
            </CardTitle>
            <CardDescription>Nombre d'emails envoyés par jour</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-64 border border-dashed rounded-lg">
              <div className="text-center">
                <BarChart3 className="size-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Graphique de volume d'emails
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Intégration avec Chart.js prévue
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="transition-shadow hover:shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="size-4" />
              Sécurité
            </CardTitle>
            <CardDescription>État des mesures de sécurité</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Shield className="size-4 text-green-600" />
                <span className="text-sm font-medium">SPF</span>
              </div>
              <span className="text-sm text-green-600">Configuré</span>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Key className="size-4 text-green-600" />
                <span className="text-sm font-medium">DKIM</span>
              </div>
              <span className="text-sm text-green-600">Actif</span>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Globe className="size-4 text-green-600" />
                <span className="text-sm font-medium">DMARC</span>
              </div>
              <span className="text-sm text-green-600">Enforcement</span>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Server className="size-4 text-yellow-600" />
                <span className="text-sm font-medium">TLS</span>
              </div>
              <span className="text-sm text-yellow-600">
                Mise à jour requise
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
