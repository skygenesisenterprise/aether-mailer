import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // Required for Docker standalone output
  output: "standalone",

  images: {
    domains: [],
    unoptimized: false,
  },

  async rewrites() {
    // Configuration robuste pour développement et production
    const isDevelopment = process.env.NODE_ENV === "development";
    const isProduction = process.env.NODE_ENV === "production";
    
    // Déterminer l'URL du backend selon l'environnement
    let backendUrl: string;
    
    if (process.env.BACKEND_URL) {
      // Priorité à la variable d'environnement explicite
      backendUrl = process.env.BACKEND_URL;
    } else if (isProduction) {
      // En production, utiliser l'URL de l'API ou fallback
      backendUrl = process.env.API_BASE_URL || "https://api.yourdomain.com";
    } else {
      // En développement, utiliser localhost
      backendUrl = "http://localhost:8080";
    }

    // Validation de l'URL
    try {
      new URL(backendUrl);
    } catch (error) {
      console.error('❌ Invalid backend URL:', backendUrl, error);
      // Fallback sécurisé
      backendUrl = isDevelopment ? "http://localhost:8080" : "https://api.yourdomain.com";
    }

    const rewrites = [
      // Proxy API v1 routes (priorité haute)
      {
        source: "/api/v1/:path*",
        destination: `${backendUrl}/api/v1/:path*`,
      },

      // Proxy health check
      {
        source: "/health",
        destination: `${backendUrl}/health`,
      },

      // Proxy OIDC well-known endpoints
      {
        source: "/.well-known/:path*",
        destination: `${backendUrl}/.well-known/:path*`,
      },

      // Proxy autres routes API (fallback)
      {
        source: "/api/:path*",
        destination: `${backendUrl}/:path*`,
      },
    ];

    console.log('📝 Rewrites configured:', rewrites.length, 'rules');
    return rewrites;
  },

  async headers() {
    const isDevelopment = process.env.NODE_ENV === "development";
    const isProduction = process.env.NODE_ENV === "production";
    
    const baseHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "origin-when-cross-origin" },
      { key: "X-XSS-Protection", value: "1; mode=block" },
    ];

    // Headers spécifiques à l'environnement
    if (isProduction) {
      baseHeaders.push(
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" }
      );
    } else {
      baseHeaders.push(
        { key: "X-Frame-Options", value: "SAMEORIGIN" }
      );
    }

    return [
      {
        source: "/(.*)",
        headers: baseHeaders,
      },
    ];
  },
};

export default nextConfig;