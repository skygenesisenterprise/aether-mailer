"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

const PLATFORM_TITLES: Record<string, string> = {
  "/home": "Accueil",
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
    return `${matchedEntry[1]} | Aether Account`;
  }

  return "Aether Account";
}

export function PlatformTitleSync() {
  const pathname = usePathname();

  React.useEffect(() => {
    document.title = getPlatformTitle(pathname);
  }, [pathname]);

  return null;
}
