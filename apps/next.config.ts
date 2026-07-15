import path from "node:path";
import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";
const isStaticWebBuild = process.env.BUILD_WEB_STATIC === "true";
const apiProxyTarget = (process.env.API_INTERNAL_URL || "http://localhost:8080/api/v1").replace(/\/$/, "");

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "mailer.skygenesisenterprise.com",
    "mailer.skygenesisenterprise.localhost",
    "api.mailer.skygenesisenterprise.localhost",
    "mailer.skygenesisenterprise.lan",
    "api.mailer.skygenesisenterprise.lan",
    "192.168.1.3",
  ],
  turbopack: {
    root: path.resolve(__dirname, ".."),
  },
  outputFileTracingExcludes: {
    "*": ["test/**"],
  },

  reactStrictMode: true,
  poweredByHeader: false,

  ...(isStaticWebBuild
    ? {
        output: "export",
        trailingSlash: true,
        images: {
          unoptimized: true,
          remotePatterns: [
            { protocol: "https", hostname: "mailer.skygenesisenterprise.com", pathname: "/**" },
            { protocol: "https", hostname: "api.dicebear.com", pathname: "/**" },
            { protocol: "https", hostname: "avatars.githubusercontent.com", pathname: "/**" },
            { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
            { protocol: "http", hostname: "127.0.0.1", pathname: "/**" },
            { protocol: "http", hostname: "localhost", pathname: "/**" },
          ],
        },
      }
    : {
        ...(isProduction && {
          output: "standalone",
          ...(process.env.ASSET_PREFIX && { assetPrefix: process.env.ASSET_PREFIX }),
        }),
      }),

  basePath: process.env.BASE_PATH || "",

  ...(!isStaticWebBuild && {
    images: {
      remotePatterns: [
        { protocol: "https", hostname: "mailer.skygenesisenterprise.com", pathname: "/**" },
        { protocol: "https", hostname: "api.dicebear.com", pathname: "/**" },
        { protocol: "https", hostname: "avatars.githubusercontent.com", pathname: "/**" },
        { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
        { protocol: "http", hostname: "127.0.0.1", pathname: "/**" },
        { protocol: "http", hostname: "localhost", pathname: "/**" },
      ],
    },
  }),

  ...(!isStaticWebBuild && {
    async headers() {
      const headers = [{ key: "Referrer-Policy", value: "origin-when-cross-origin" }];

      if (isProduction) {
        headers.push(
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" }
        );
      }

      return [{ source: "/(.*)", headers }];
    },

    async rewrites() {
      return [
        {
          source: "/api/v1/:path*",
          destination: `${apiProxyTarget}/:path*`,
        },
      ];
    },
  }),
};

export default nextConfig;
