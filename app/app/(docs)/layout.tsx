import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { DocsSidebar } from "@/components/docs/sidebar";
import { DocsHeader } from "@/components/docs/header";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <DocsSidebar />
      <SidebarInset className="flex flex-col h-screen overflow-hidden">
        <DocsHeader className="sticky top-0 z-50 flex-none" />
        <main className="flex-1 overflow-auto">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
