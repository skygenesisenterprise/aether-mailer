"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Edit, Trash2, Eye } from "lucide-react";

const users = [
  {
    id: "USR001",
    name: "Jean Dupont",
    email: "jean.dupont@company.fr",
    role: "Admin",
    domain: "company.fr",
    status: "active",
    lastLogin: "2024-01-15 14:30",
  },
  {
    id: "USR002",
    name: "Marie Martin",
    email: "marie.martin@company.fr",
    role: "User",
    domain: "company.fr",
    status: "active",
    lastLogin: "2024-01-15 12:15",
  },
  {
    id: "USR003",
    name: "Pierre Bernard",
    email: "pierre.bernard@techcorp.io",
    role: "Admin",
    domain: "techcorp.io",
    status: "suspended",
    lastLogin: "2024-01-14 09:45",
  },
];

export default function DirectoryAccountsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Gestion des comptes
          </h1>
          <p className="text-muted-foreground">
            Gérez les comptes utilisateur de votre système de messagerie
          </p>
        </div>
        <Button>
          <Plus className="size-4 mr-2" />
          Nouvel utilisateur
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Utilisateurs récents</CardTitle>
          <CardDescription>Liste des utilisateurs du système</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Users className="size-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {user.email}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant={
                          user.role === "Admin"
                            ? "default"
                            : user.role === "Moderator"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {user.role}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {user.domain}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      user.status === "active" ? "default" : "destructive"
                    }
                  >
                    {user.status === "active" ? "Actif" : "Suspendu"}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm">
                      <Eye className="size-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="size-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600">
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
