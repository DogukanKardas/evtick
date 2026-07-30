import Link from "next/link";
import { Ticket, LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { logoutAction } from "@/lib/auth/actions";
import type { Profile } from "@/types/database";
import { isSuperAdmin, isSupportOrAdmin, isCompanyAdmin } from "@/lib/auth/roles";

interface HeaderProps {
  profile: Profile;
}

export function Header({ profile }: HeaderProps) {
  const isStaff = isSupportOrAdmin(profile);
  const superAdmin = isSuperAdmin(profile);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link
          href={superAdmin ? "/system" : "/dashboard"}
          className="flex items-center gap-2 font-semibold"
        >
          <Ticket className="h-5 w-5 text-primary" />
          <span>EvTick</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {superAdmin ? (
            <>
              <LinkButton href="/system" variant="ghost" size="sm">
                <Shield className="mr-1 h-4 w-4" />
                Sistem Paneli
              </LinkButton>
              <LinkButton href="/system/companies" variant="ghost" size="sm">
                Şirketler
              </LinkButton>
              <LinkButton href="/system/companies/new" variant="ghost" size="sm">
                Yeni Şirket
              </LinkButton>
            </>
          ) : (
            <>
              <LinkButton href="/dashboard" variant="ghost" size="sm">
                Panel
              </LinkButton>
              <LinkButton href="/tickets" variant="ghost" size="sm">
                Talepler
              </LinkButton>
              <LinkButton href="/tickets/new" variant="ghost" size="sm">
                Yeni Talep
              </LinkButton>
              {isStaff && (
                <LinkButton href="/support" variant="ghost" size="sm">
                  Destek Kuyruğu
                </LinkButton>
              )}
              {isCompanyAdmin(profile) && (
                <LinkButton href="/admin/users" variant="ghost" size="sm">
                  Kullanıcılar
                </LinkButton>
              )}
            </>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {profile.full_name}
          </span>
          <form action={logoutAction} className="hidden md:block">
            <Button variant="ghost" size="icon" type="submit">
              <LogOut className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
