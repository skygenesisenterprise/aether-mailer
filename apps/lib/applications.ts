import {
  AppWindow,
  Bell,
  Blocks,
  Bot,
  BrainCircuit,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Cloud,
  ContactRound,
  Database,
  FolderKanban,
  GraduationCap,
  LineChart,
  ListTodo,
  MessageCircleMore,
  Palette,
  Phone,
  Settings2,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
  UsersRound,
  Video,
  Workflow,
} from "lucide-react";

export interface AppNavItem {
  label: string;
  href: string;
}

export interface AppCategory {
  label: string;
  items: AppNavItem[];
}

export interface FeaturedApp {
  name: string;
  description: string;
  accent: string;
  icon: LucideIcon;
}

export interface MarketplaceApp {
  name: string;
  publisher: string;
  description: string;
  rating: string;
  reviews: string;
  action: "Ouvrir" | "Ajouter" | "Demander";
  icon: LucideIcon;
  accent: string;
  href: string;
  promoted?: boolean;
}

export interface ApplicationSidebarLink {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
  source: "aether" | "third-party";
  category: string;
}

export const defaultAetherMeetApplicationLinks: ApplicationSidebarLink[] = [
  { id: "notifications", label: "Activité", href: "/notifications", icon: Bell, badge: 5, source: "aether", category: "Aether Meet" },
  { id: "chat", label: "Conversations", href: "/chat", icon: MessageCircleMore, badge: 4, source: "aether", category: "Aether Meet" },
  { id: "tasks", label: "Tâches", href: "/tasks", icon: ListTodo, source: "aether", category: "Aether Meet" },
  { id: "projects", label: "Projets", href: "/projects", icon: FolderKanban, source: "aether", category: "Aether Meet" },
  { id: "teams", label: "Équipes", href: "/teams", icon: UsersRound, source: "aether", category: "Aether Meet" },
  { id: "calendar", label: "Calendrier", href: "/calendar", icon: CalendarDays, source: "aether", category: "Aether Meet" },
  { id: "calls", label: "Appels", href: "/calls", icon: Phone, badge: 2, source: "aether", category: "Aether Meet" },
  { id: "drive", label: "Drive", href: "/drive", icon: Cloud, source: "aether", category: "Aether Meet" },
  { id: "contacts", label: "Contacts", href: "/contacts", icon: ContactRound, source: "aether", category: "Aether Meet" },
  { id: "applications", label: "Applications", href: "/applications", icon: AppWindow, source: "aether", category: "Aether Meet" },
  { id: "settings", label: "Réglages", href: "/settings", icon: Settings2, source: "aether", category: "Aether Meet" },
];

export const thirdPartyApplicationLinks: ApplicationSidebarLink[] = [
  { id: "polls", label: "Polls", href: "/applications#polls", icon: LineChart, source: "third-party", category: "Productivité" },
  { id: "forms", label: "Forms", href: "/applications#forms", icon: Blocks, source: "third-party", category: "Productivité" },
  { id: "sharepoint", label: "SharePoint", href: "/applications#sharepoint", icon: Database, source: "third-party", category: "Fichiers" },
  { id: "copilot", label: "Copilot", href: "/applications#copilot", icon: Bot, source: "third-party", category: "Agents" },
];

export const applicationSidebarLinks = [
  ...defaultAetherMeetApplicationLinks,
  ...thirdPartyApplicationLinks,
] satisfies ApplicationSidebarLink[];

export const applicationNavSections: AppCategory[] = [
  {
    label: "Applications",
    items: [
      { label: "Recommandés", href: "#recommandes" },
      { label: "Populaires sur Aether", href: "#populaires-sur-aether" },
      { label: "Agents", href: "#agents" },
      { label: "Sélections", href: "#selections" },
      { label: "Meilleures ventes", href: "#populaires-sur-aether" },
      { label: "Applications les mieux notées", href: "#recommandes" },
    ],
  },
  {
    label: "Catégories",
    items: [
      { label: "Créé par Aether", href: "#categories" },
      { label: "Éducation", href: "#recommandes" },
      { label: "Outils de productivité", href: "#populaires-sur-aether" },
      { label: "Gestion de projet", href: "#populaires-sur-aether" },
      { label: "Utilitaires", href: "#selections" },
      { label: "Créé avec Workflows", href: "#agents" },
    ],
  },
  {
    label: "Secteurs d'activité",
    items: [
      { label: "Agriculture", href: "#secteurs" },
      { label: "Distribution", href: "#secteurs" },
      { label: "Éducation", href: "#secteurs" },
      { label: "Finance", href: "#secteurs" },
      { label: "Administration", href: "#secteurs" },
      { label: "Santé", href: "#secteurs" },
    ],
  },
];

export const featuredApplications: FeaturedApp[] = [
  {
    name: "Aether Learn",
    description: "Créez, partagez et mesurez les parcours de formation directement depuis vos équipes et canaux.",
    accent: "from-[#8b8cff] via-[#b69cff] to-[#f5d0ff]",
    icon: GraduationCap,
  },
  {
    name: "Pulse AI",
    description: "Synthétisez les réunions, détectez les décisions et distribuez automatiquement les prochaines actions.",
    accent: "from-[#22d3ee] via-[#3b82f6] to-[#6366f1]",
    icon: BrainCircuit,
  },
  {
    name: "Workflow Studio",
    description: "Automatisez les validations, formulaires et escalades sans quitter votre espace de travail.",
    accent: "from-[#fb923c] via-[#f97316] to-[#ef4444]",
    icon: Workflow,
  },
];

export const appreciatedApplications: MarketplaceApp[] = [
  {
    name: "Viva Learning",
    publisher: "Microsoft Corporation",
    description: "Continuez à apprendre et à vous développer avec des modules intégrés aux espaces de travail.",
    rating: "4.4",
    reviews: "29,1 k évaluations",
    action: "Ouvrir",
    icon: Cloud,
    accent: "from-[#f8fafc] to-[#dbeafe]",
    href: "/applications#viva-learning",
    promoted: true,
  },
  {
    name: "CSOD Learn",
    publisher: "Cornerstone OnDemand",
    description: "L'essentiel d'un LMS directement dans Aether pour former les équipes terrain.",
    rating: "3.3",
    reviews: "12 évaluations",
    action: "Demander",
    icon: Sparkles,
    accent: "from-[#ff4d1d] to-[#ff2f11]",
    href: "/applications#csod-learn",
  },
  {
    name: "Breakthru",
    publisher: "Breakthru Immersive, INC",
    description: "De petites pauses pour partager, jouer et relancer l'attention dans votre journée.",
    rating: "4.7",
    reviews: "2,8 k évaluations",
    action: "Demander",
    icon: Palette,
    accent: "from-[#fff7ed] to-[#f8fafc]",
    href: "/applications#breakthru",
  },
  {
    name: "Learn365",
    publisher: "Zensai International ApS",
    description: "Apprenez, partagez et gérez la formation au sein de vos communautés métiers.",
    rating: "4.1",
    reviews: "2,2 k évaluations",
    action: "Demander",
    icon: CheckCircle2,
    accent: "from-[#ff7a18] to-[#ff4d00]",
    href: "/applications#learn365",
  },
];

export const popularApplications: MarketplaceApp[] = [
  {
    name: "Polls",
    publisher: "Aether Corporation",
    description: "Sondages rapides dans les conversations.",
    rating: "1.6",
    reviews: "1,1 k évaluations",
    action: "Ajouter",
    icon: LineChart,
    accent: "from-[#6366f1] to-[#818cf8]",
    href: "/applications#polls",
  },
  {
    name: "Forms for Aether",
    publisher: "Aether Corporation",
    description: "Collecte structurée et questionnaires.",
    rating: "3.5",
    reviews: "281 évaluations",
    action: "Ajouter",
    icon: Blocks,
    accent: "from-[#0891b2] to-[#0f766e]",
    href: "/applications#forms",
  },
  {
    name: "SharePoint",
    publisher: "Microsoft Corporation",
    description: "Sites, fichiers et espaces d'équipe.",
    rating: "2.2",
    reviews: "72 évaluations",
    action: "Ajouter",
    icon: Database,
    accent: "from-[#0f766e] to-[#14b8a6]",
    href: "/applications#sharepoint",
  },
  {
    name: "Listes",
    publisher: "Microsoft Corporation",
    description: "Suivi collaboratif des informations.",
    rating: "3.2",
    reviews: "47 évaluations",
    action: "Ajouter",
    icon: BriefcaseBusiness,
    accent: "from-[#c026d3] to-[#f97316]",
    href: "/applications#listes",
  },
  {
    name: "Copilot",
    publisher: "Aether AI",
    description: "Assistant pour résumer et rédiger.",
    rating: "4.3",
    reviews: "160,8 k évaluations",
    action: "Demander",
    icon: Bot,
    accent: "from-[#22c55e] to-[#6366f1]",
    href: "/applications#copilot",
  },
  {
    name: "Planificateur",
    publisher: "Microsoft Corporation",
    description: "Plans, tâches et tableaux d'équipe.",
    rating: "3.8",
    reviews: "13,6 k évaluations",
    action: "Ouvrir",
    icon: Workflow,
    accent: "from-[#7c3aed] to-[#ec4899]",
    href: "/applications#planificateur",
  },
  {
    name: "Stream",
    publisher: "Aether Media",
    description: "Vidéo, replay et partage sécurisé.",
    rating: "4.2",
    reviews: "801 évaluations",
    action: "Demander",
    icon: Video,
    accent: "from-[#ef4444] to-[#f97316]",
    href: "/applications#stream",
  },
  {
    name: "Avatars",
    publisher: "Microsoft Corporation",
    description: "Identités visuelles pour réunions.",
    rating: "4.3",
    reviews: "4,9 k évaluations",
    action: "Ajouter",
    icon: ShieldCheck,
    accent: "from-[#1d4ed8] to-[#312e81]",
    href: "/applications#avatars",
  },
];

export const applicationCategoryPills = [
  "Créé par Aether",
  "Éducation",
  "Productivité",
  "Gestion de projet",
  "Utilitaires",
  "Workflows",
];

export const applicationIndustryPills = ["Agriculture", "Distribution", "Éducation", "Finance", "Administration", "Santé"];
