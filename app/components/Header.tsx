"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Search,
  Bell,
  Settings,
  User,
  ChevronDown,
  HelpCircle,
  LogOut,
  Shield,
  Key,
} from "lucide-react";

export function Header() {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full h-16 border-b border-slate-800 bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-slate-900/60">
      <div className="flex h-full items-center justify-between px-6">
        {/* Left side - Empty space for balance */}
        <div className="w-40"></div>

        {/* Center - Search Bar - Perfectly centered */}
        <div className="flex-1 flex justify-center">
          <div className="w-full max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher des emails, contacts, paramètres..."
                className="w-full h-10 pl-10 pr-4 text-sm bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-500 text-white"
              />
            </div>
          </div>
        </div>

        {/* Right side - User Actions */}
        <div className="w-40 flex items-center justify-end gap-2">
          {/* Help */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <HelpCircle className="h-4 w-4" />
          </Button>

          {/* Notifications */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-slate-400 hover:text-white hover:bg-slate-800"
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            >
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </Button>

            {/* Notifications Dropdown */}
            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-slate-800 border border-slate-700 rounded-lg shadow-lg p-4 z-50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-white">Notifications</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Tout marquer comme lu
                  </Button>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-2 hover:bg-slate-700 rounded-lg cursor-pointer transition-colors">
                    <div className="h-2 w-2 bg-green-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">
                        Serveur SMTP opérationnel
                      </p>
                      <p className="text-xs text-slate-400">Il y a 2 minutes</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-2 hover:bg-slate-700 rounded-lg cursor-pointer transition-colors">
                    <div className="h-2 w-2 bg-yellow-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">
                        Espace disque à 67%
                      </p>
                      <p className="text-xs text-slate-400">Il y a 1 heure</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <Button
              variant="ghost"
              className="flex items-center gap-2 h-9 px-3 text-slate-400 hover:text-white hover:bg-slate-800"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            >
              <div className="h-7 w-7 bg-blue-500/20 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-blue-400" />
              </div>
              <span className="text-sm font-medium">Admin</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${isUserMenuOpen ? "rotate-180" : ""}`}
              />
            </Button>

            {/* User Dropdown */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-lg py-2 z-50">
                <div className="px-3 py-2 border-b border-slate-700">
                  <p className="text-sm font-medium text-white">
                    Administrateur
                  </p>
                  <p className="text-xs text-slate-400">
                    admin@aether-mailer.com
                  </p>
                </div>

                <div className="py-1">
                  <button className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-700 transition-colors text-white">
                    <User className="h-4 w-4" />
                    Mon profil
                  </button>
                  <button className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-700 transition-colors text-white">
                    <Shield className="h-4 w-4" />
                    Sécurité
                  </button>
                  <button className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-700 transition-colors text-white">
                    <Key className="h-4 w-4" />
                    Clés API
                  </button>
                  <button className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-700 transition-colors text-white">
                    <Settings className="h-4 w-4" />
                    Paramètres
                  </button>
                </div>

                <div className="py-1 border-t border-slate-700">
                  <button className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-700 transition-colors text-red-400">
                    <LogOut className="h-4 w-4" />
                    Déconnexion
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
