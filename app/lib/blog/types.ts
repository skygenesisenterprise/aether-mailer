export interface Author {
  name: string;
  role: string;
  avatar?: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  publishedAt: string;
  updatedAt?: string;
  author: Author;
  category: BlogCategory;
  tags: string[];
  readingTime: number;
  featured?: boolean;
}

export type BlogCategory =
  | "Engineering"
  | "Security"
  | "Product"
  | "Company"
  | "Tutorials"
  | "Industry";

export const BLOG_CATEGORIES: BlogCategory[] = [
  "Engineering",
  "Security",
  "Product",
  "Company",
  "Tutorials",
  "Industry",
];
