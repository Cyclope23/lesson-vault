"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { GenerationNotifier } from "@/components/layout/generation-notifier";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [generatingCount, setGeneratingCount] = useState(0);

  // Wait for session to load before rendering sidebar to avoid wrong role flash
  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const role = (session?.user as any)?.role ?? "TEACHER";
  const apiKeyConfigured = (session?.user as any)?.apiKeyConfigured ?? false;
  const geminiAvailable = (session?.user as any)?.geminiAvailable ?? false;
  const aiAvailable = apiKeyConfigured || geminiAvailable;
  const user = session?.user ?? { name: "", email: "" };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar role={role} collapsed={sidebarCollapsed} aiAvailable={aiAvailable} />
      </div>

      {/* Mobile sidebar */}
      <MobileNav
        open={mobileOpen}
        onOpenChange={setMobileOpen}
        role={role}
        aiAvailable={aiAvailable}
      />

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar
          user={user}
          generatingCount={generatingCount}
          onToggleSidebar={() => {
            // On mobile, toggle sheet; on desktop, toggle collapse
            if (window.innerWidth < 768) {
              setMobileOpen(true);
            } else {
              setSidebarCollapsed(!sidebarCollapsed);
            }
          }}
        />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>

      <GenerationNotifier onGeneratingCountChange={setGeneratingCount} />
    </div>
  );
}
