import Link from "next/link";
import { Ticket, LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { ThemeToggle } from "@/components/theme-toggle";
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
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div
        className={
          superAdmin
            ? "flex h-14 w-full"
            : "mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4"
        }
      >
        {superAdmin && (
          <div
            className="hidden w-56 shrink-0 border-r border-border md:block"
            aria-hidden
          />
        )}
        <div
          className={
            superAdmin
              ? "flex min-w-0 flex-1 items-center justify-between gap-4 px-4 md:px-6"
              : "contents"
          }
        >
          <Link
            href={superAdmin ? "/system" : "/dashboard"}
            className="flex shrink-0 items-center gap-2 font-semibold"
          >
            <Ticket className="h-5 w-5 text-primary" />
            <span>EvTick</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {superAdmin ? (
              <LinkButton href="/system" variant="ghost" size="sm">
                <Shield className="mr-1 h-4 w-4" />
                Sistem Paneli
              </LinkButton>
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

          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {profile.full_name}
            </span>
            <ThemeToggle />
            <form action={logoutAction} className="hidden md:block">
              <Button variant="ghost" size="icon" type="submit" title="Çıkış yap">
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </header>
  );
}
