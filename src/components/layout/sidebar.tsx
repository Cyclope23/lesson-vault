"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  BookOpen,
  CheckSquare,
  GraduationCap,
  LayoutDashboard,
  Settings,
  Upload,
  Users,
  FolderOpen,
  PenLine,
  Lock,
  ServerCog,
} from "lucide-react";

interface SidebarProps {
  role: string;
  collapsed?: boolean;
  aiAvailable?: boolean;
}

/** Links that require AI to be fully functional */
const AI_LINKS = new Set(["/generate"]);

const teacherLinks = [
  { href: "/programs", label: "Programmi", icon: FolderOpen },
  { href: "/generate", label: "Nuovo contenuto", icon: PenLine },
  { href: "/lessons", label: "Risorse", icon: BookOpen },
  { href: "/documents", label: "Documenti", icon: Upload },
  { href: "/settings", label: "Impostazioni", icon: Settings },
];

const adminLinks = [
  { href: "/programs", label: "Programmi", icon: FolderOpen },
  { href: "/lessons", label: "Risorse", icon: BookOpen },
  { href: "/admin/approvals", label: "Approvazioni", icon: CheckSquare },
  { href: "/admin/content", label: "Contenuti", icon: LayoutDashboard },
  { href: "/admin/disciplines", label: "Discipline", icon: GraduationCap },
  { href: "/admin/users", label: "Utenti", icon: Users },
  { href: "/admin/settings", label: "Sistema", icon: ServerCog },
  { href: "/settings", label: "Impostazioni", icon: Settings },
];

export function Sidebar({ role, collapsed, aiAvailable }: SidebarProps) {
  const pathname = usePathname();
  const links = role === "ADMIN" ? adminLinks : teacherLinks;
  const showKeyWarning = role === "TEACHER" && !aiAvailable;

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <BookOpen className="h-4 w-4" />
        </div>
        {!collapsed && (
          <span className="text-lg font-semibold tracking-tight">
            Lesson Vault
          </span>
        )}
      </div>
      <nav className="flex-1 space-y-0.5 p-3">
        <TooltipProvider delayDuration={300}>
          {links.map((link) => {
            const isActive =
              pathname === link.href || pathname.startsWith(link.href + "/");
            const needsKey = showKeyWarning && AI_LINKS.has(link.href);

            const linkContent = (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "border-l-2 border-sidebar-primary bg-sidebar-accent text-sidebar-accent-foreground"
                    : "border-l-2 border-transparent text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                  needsKey && "opacity-50"
                )}
              >
                <link.icon className={cn("h-4 w-4 shrink-0", isActive && "text-sidebar-primary")} />
                {!collapsed && (
                  <>
                    <span className="flex-1">{link.label}</span>
                    {needsKey && <Lock className="h-3 w-3 shrink-0" />}
                  </>
                )}
              </Link>
            );

            if (needsKey) {
              return (
                <Tooltip key={link.href}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right">
                    <p className="text-xs">Configura la tua API key nelle Impostazioni</p>
                  </TooltipContent>
                </Tooltip>
              );
            }

            return linkContent;
          })}
        </TooltipProvider>
      </nav>

      {/* API key warning banner */}
      {showKeyWarning && !collapsed && (
        <div className="mx-3 mb-3 rounded-md bg-sidebar-accent px-3 py-2">
          <div className="flex items-center gap-2 text-xs text-sidebar-foreground/70">
            <Lock className="h-3.5 w-3.5 shrink-0" />
            <span>
              <Link href="/settings" className="underline hover:text-sidebar-foreground">
                Configura API key
              </Link>
              {" "}per usare l&apos;AI
            </span>
          </div>
        </div>
      )}
    </aside>
  );
}
