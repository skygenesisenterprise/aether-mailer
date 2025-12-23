"use client";

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
  Inbox,
  Star,
  TrendingUp,
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
} from "lucide-react";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background text-foreground space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Aether Mailer Dashboard</h1>
        <p className="text-muted-foreground">
          Vue d'ensemble complète du serveur de messagerie
        </p>
      </div>

      {/* Server Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Serveur</CardTitle>
            <Server className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Actif</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">●</span> 99.9% uptime
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">Normal</span> charge actuelle
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stockage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">67%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-yellow-600">420 GB</span> utilisés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Réseau</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.2 Gbps</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">Stable</span> connexion
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Email Service Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails/Jour</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3,842</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12%</span> vs hier
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Comptes Actifs
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">247</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">5</span> nouvelles ce mois
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Domaines</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">Tous</span> vérifiés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sécurité</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">100%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">OK</span> protections actives
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Server Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Activité Serveur</CardTitle>
            <CardDescription>
              État et événements récents du système
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
                message: "Espace disque à 67%",
                time: "Il y a 1 heure",
                icon: AlertTriangle,
              },
              {
                type: "info",
                service: "Database",
                message: "Backup quotidien terminé",
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
            ].map((event, index) => {
              const IconComponent = event.icon;
              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <IconComponent
                      className={`h-4 w-4 ${
                        event.type === "success"
                          ? "text-green-600"
                          : event.type === "warning"
                            ? "text-yellow-600"
                            : "text-blue-600"
                      }`}
                    />
                    <div>
                      <p className="text-sm font-medium">{event.service}</p>
                      <p className="text-xs text-muted-foreground">
                        {event.message}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {event.time}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Server Management */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestion Serveur</CardTitle>
              <CardDescription>Actions rapides système</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Database className="mr-2 h-4 w-4" />
                Backup Base
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Zap className="mr-2 h-4 w-4" />
                Optimiser Performance
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Shield className="mr-2 h-4 w-4" />
                Sécurité
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Activity className="mr-2 h-4 w-4" />
                Logs Système
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Métriques Serveur</CardTitle>
              <CardDescription>Performance en temps réel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Taux de livraison</span>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">98.7%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Latence moyenne</span>
                <span className="text-sm font-medium">42ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Connexions actives</span>
                <span className="text-sm font-medium">1,247</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Espace disponible</span>
                <span className="text-sm font-medium">180 GB</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
