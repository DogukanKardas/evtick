"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  Ticket,
  Shield,
  ScrollText,
  PlusCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/system", label: "Panel", icon: LayoutDashboard, exact: true },
  { href: "/system/companies", label: "Şirketler", icon: Building2 },
  { href: "/system/users", label: "Kullanıcılar", icon: Users },
  { href: "/system/tickets", label: "Talepler", icon: Ticket },
  { href: "/system/admins", label: "Yöneticiler", icon: Shield },
  { href: "/system/audit", label: "Denetim", icon: ScrollText },
];

export function SystemSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 shrink-0 border-r bg-muted/30 md:block">
      <div className="sticky top-14 flex h-[calc(100vh-3.5rem)] flex-col p-3">
        <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Sistem Paneli
        </p>
        <nav className="flex flex-1 flex-col gap-0.5">
          {navItems.map(({ href, label, icon: Icon, exact }) => {
            const active = exact
              ? pathname === href
              : pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
        <Link
          href="/system/companies/new"
          className="mt-auto flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm font-medium hover:bg-muted"
        >
          <PlusCircle className="h-4 w-4" />
          Yeni Şirket
        </Link>
      </div>
    </aside>
  );
}

export function SystemBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const labels: Record<string, string> = {
    system: "Sistem",
    companies: "Şirketler",
    users: "Kullanıcılar",
    tickets: "Talepler",
    admins: "Yöneticiler",
    audit: "Denetim",
    new: "Yeni",
  };

  if (segments.length <= 1) return null;

  const crumbs = segments.map((seg, i) => {
    const href = "/" + segments.slice(0, i + 1).join("/");
    const label = labels[seg] ?? (seg.length > 20 ? "Detay" : seg);
    return { href, label, last: i === segments.length - 1 };
  });

  return (
    <nav className="mb-4 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
      {crumbs.map((crumb, i) => (
        <span key={crumb.href} className="flex items-center gap-1">
          {i > 0 && <span>/</span>}
          {crumb.last ? (
            <span className="text-foreground">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="hover:text-foreground">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
