import { Locale } from "./locale";

export interface FooterLink {
  name: string;
  href: string;
}

export interface FooterContent {
  brand: {
    title: string;
    description: string;
  };
  subscription: FooterLink[];
  legal: FooterLink[];
  socialLabel: string;
  copyright: string;
  company: string;
}

const footerContent: Record<Locale, FooterContent> = {
  fr: {
    brand: {
      title: "The Etheria Times",
      description: "Votre fenêtre sur le monde — L'actualité qui compte, décryptée pour vous",
    },
    subscription: [
      { name: "Abonnement", href: "/abonnement" },
      { name: "Newsletter", href: "/newsletter" },
      { name: "Application mobile", href: "/app" },
      { name: "Archives", href: "/archives" },
    ],
    legal: [
      { name: "Mentions légales", href: "/mentions-legales" },
      { name: "CGU", href: "/cgu" },
      { name: "Politique de confidentialité", href: "/confidentialite" },
      { name: "Gestion des cookies", href: "/cookies" },
    ],
    socialLabel: "Suivez-nous",
    copyright: "© 2026 The Etheria Times. Tous droits réservés.",
    company: "A Sky Genesis Enterprise company",
  },
  be_fr: {
    brand: {
      title: "The Etheria Times",
      description: "Votre fenêtre sur le monde — L'actualité qui compte, décryptée pour vous",
    },
    subscription: [
      { name: "Abonnement", href: "/be_fr/abonnement" },
      { name: "Newsletter", href: "/be_fr/newsletter" },
      { name: "Application mobile", href: "/be_fr/app" },
      { name: "Archives", href: "/be_fr/archives" },
    ],
    legal: [
      { name: "Mentions légales", href: "/be_fr/mentions-legales" },
      { name: "CGU", href: "/be_fr/cgu" },
      { name: "Politique de confidentialité", href: "/be_fr/confidentialite" },
      { name: "Gestion des cookies", href: "/be_fr/cookies" },
    ],
    socialLabel: "Suivez-nous",
    copyright: "© 2026 The Etheria Times. Tous droits réservés.",
    company: "A Sky Genesis Enterprise company",
  },
  be_nl: {
    brand: {
      title: "The Etheria Times",
      description: "Je venster op de wereld — Het nieuws dat telt, ontcijferd voor u",
    },
    subscription: [
      { name: "Abonnement", href: "/be_nl/abonnement" },
      { name: "Newsletter", href: "/be_nl/newsletter" },
      { name: "App", href: "/be_nl/app" },
      { name: "Archief", href: "/be_nl/archives" },
    ],
    legal: [
      { name: "Wettelijke vermeldingen", href: "/be_nl/mentions-legales" },
      { name: "Gebruiksvoorwaarden", href: "/be_nl/cgu" },
      { name: "Privacybeleid", href: "/be_nl/confidentialite" },
      { name: "Cookiebeheer", href: "/be_nl/cookies" },
    ],
    socialLabel: "Volg ons",
    copyright: "© 2026 The Etheria Times. Alle rechten voorbehouden.",
    company: "A Sky Genesis Enterprise company",
  },
  ch_fr: {
    brand: {
      title: "The Etheria Times",
      description: "Votre fenêtre sur le monde — L'actualité qui compte, décryptée pour vous",
    },
    subscription: [
      { name: "Abonnement", href: "/ch_fr/abonnement" },
      { name: "Newsletter", href: "/ch_fr/newsletter" },
      { name: "Application mobile", href: "/ch_fr/app" },
      { name: "Archives", href: "/ch_fr/archives" },
    ],
    legal: [
      { name: "Mentions légales", href: "/ch_fr/mentions-legales" },
      { name: "CGU", href: "/ch_fr/cgu" },
      { name: "Politique de confidentialité", href: "/ch_fr/confidentialite" },
      { name: "Gestion des cookies", href: "/ch_fr/cookies" },
    ],
    socialLabel: "Suivez-nous",
    copyright: "© 2026 The Etheria Times. Tous droits réservés.",
    company: "A Sky Genesis Enterprise company",
  },
};

export function getFooterContent(locale: Locale): FooterContent {
  return footerContent[locale] || footerContent.fr;
}
