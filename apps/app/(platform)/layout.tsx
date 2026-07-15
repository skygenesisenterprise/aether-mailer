import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PlatformShell } from "@/components/platform/platform-shell";
import { PlatformTitleSync } from "@/components/platform/platform-title-sync";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <PlatformTitleSync />
      <PlatformShell>{children}</PlatformShell>
    </ProtectedRoute>
  );
}
