"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

const PLATFORM_TITLES: Record<string, string> = {
  "/manage/dash/overview": "Vue d'ensemble",
  "/manage/dash/performance": "Performance",
  "/manage/dash/security": "Sécurité",
  "/manage/dash/network": "Réseau",
  "/manage/dash/delivery": "Livraison",
  "/manage/directory/accounts": "Comptes",
  "/manage/directory/domains": "Domaines",
  "/monitoring/overview": "Monitoring",
  "/notifications": "Activité",
  "/wallet": "Wallet et Abonnements",
  "/user-info": "Informations personnelles",
  "/security": "Sécurité et connexion",
  "/password": "Mot de passe",
  "/applications": "Applications associées",
  "/data": "Données et confidentialité",
  "/contacts": "Contacts",
  "/familly": "Famille",
  "/drive": "Espace de stockage",
  "/settings": "Paramètres",
};

function getPlatformTitle(pathname: string): string {
  const matchedEntry = Object.entries(PLATFORM_TITLES).find(([route]) => pathname.startsWith(route));

  if (matchedEntry) {
    return `${matchedEntry[1]} | Aether Mailer`;
  }

  return "Aether Mailer";
}

export function PlatformTitleSync() {
  const pathname = usePathname();

  React.useEffect(() => {
    document.title = getPlatformTitle(pathname);
  }, [pathname]);

  return null;
}
