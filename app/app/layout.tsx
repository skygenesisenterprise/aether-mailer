import type { Metadata } from "next";
import "@/styles/globals.css";
import { AuthProvider } from "@/context/JwtAuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";

export const metadata: Metadata = {
  title: "Aether Mailer",
  description: "A modern, open-source email server built with Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="font-sans antialiased">
        <AuthProvider>
          <DashboardLayout>{children}</DashboardLayout>
          {/* <Toaster /> */}
        </AuthProvider>
      </body>
    </html>
  );
}
