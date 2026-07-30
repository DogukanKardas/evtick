"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Ticket,
  PlusCircle,
  Headphones,
  Users,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/lib/auth/actions";
import type { Profile } from "@/types/database";
import { isSupportOrAdmin } from "@/lib/auth/roles";

interface MobileNavProps {
  profile: Profile;
}

export function MobileNav({ profile }: MobileNavProps) {
  const pathname = usePathname();
  const isStaff = isSupportOrAdmin(profile);

  const navItems = [
    { href: "/dashboard", label: "Panel", icon: LayoutDashboard },
    { href: "/tickets", label: "Talepler", icon: Ticket },
    { href: "/tickets/new", label: "Yeni", icon: PlusCircle },
    ...(isStaff
      ? [{ href: "/support", label: "Destek", icon: Headphones }]
      : []),
    ...(profile.role === "admin"
      ? [{ href: "/admin/users", label: "Kullanıcılar", icon: Users }]
      : []),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
      <div className="flex items-center justify-around px-1 py-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-h-14 min-w-14 flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-1 text-xs transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          );
        })}
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex min-h-14 min-w-14 flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-5 w-5" />
            <span>Çıkış</span>
          </button>
        </form>
      </div>
    </nav>
  );
}
