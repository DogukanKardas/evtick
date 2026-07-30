"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Copy, Check, Users, Ticket, Power, PowerOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CompanyStatusBadge } from "@/components/system/company-status-badge";
import { toggleCompanyActiveAction } from "@/lib/system/actions";
import { isPlatformCompany } from "@/lib/system/company-constants";
import type { CompanyWithStats } from "@/types/database";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CompanyDetailHeaderProps {
  company: CompanyWithStats;
  onTabChange?: (tab: string) => void;
}

function formatActivity(days: number | null): string {
  if (days === null) return "—";
  if (days === 0) return "Bugün";
  if (days === 1) return "Dün";
  return `${days} gün önce`;
}

export function CompanyDetailHeader({
  company,
  onTabChange,
}: CompanyDetailHeaderProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  const warnings: string[] = [];
  if (company.open_tickets >= 5) {
    warnings.push(`${company.open_tickets} açık talep`);
  }
  if ((company.days_since_activity ?? 0) >= 30) {
    warnings.push(`${company.days_since_activity} gündür pasif`);
  }

  async function copyCode() {
    await navigator.clipboard.writeText(company.code);
    setCopied(true);
    toast.success("Kod kopyalandı");
    setTimeout(() => setCopied(false), 2000);
  }

  function handleToggle() {
    if (isPlatformCompany(company.code) && company.is_active) {
      toast.error("Platform şirketi (EVTK) pasife alınamaz.");
      return;
    }
    startTransition(async () => {
      const result = await toggleCompanyActiveAction(
        company.id,
        !company.is_active
      );
      if (result.error) toast.error(result.error);
      else {
        toast.success(
          company.is_active ? "Şirket pasife alındı" : "Şirket aktifleştirildi"
        );
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <CompanyStatusBadge isActive={company.is_active} />
            {warnings.map((w) => (
              <span
                key={w}
                className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-100"
              >
                {w}
              </span>
            ))}
          </div>
          <h1 className="text-2xl font-bold">{company.name}</h1>
          <div className="mt-1 flex items-center gap-2">
            <code className="text-muted-foreground">{company.code}</code>
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={copyCode}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            onClick={() => onTabChange?.("users")}
          >
            <Users className="mr-1.5 h-4 w-4" />
            Kullanıcılar
          </button>
          <button
            type="button"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            onClick={() => onTabChange?.("tickets")}
          >
            <Ticket className="mr-1.5 h-4 w-4" />
            Talepler
          </button>
          {!isPlatformCompany(company.code) && (
            <Button
              type="button"
              variant={company.is_active ? "destructive" : "default"}
              size="sm"
              disabled={pending}
              onClick={handleToggle}
            >
              {company.is_active ? (
                <>
                  <PowerOff className="mr-1.5 h-4 w-4" />
                  Pasife Al
                </>
              ) : (
                <>
                  <Power className="mr-1.5 h-4 w-4" />
                  Aktifleştir
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border p-3 text-center">
          <p className="text-xs text-muted-foreground">Kullanıcı</p>
          <p className="text-xl font-bold">{company.user_count}</p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <p className="text-xs text-muted-foreground">Toplam Talep</p>
          <p className="text-xl font-bold">{company.ticket_count}</p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <p className="text-xs text-muted-foreground">Açık</p>
          <p className="text-xl font-bold">{company.open_tickets}</p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <p className="text-xs text-muted-foreground">Son Aktivite</p>
          <p className="text-sm font-bold">
            {formatActivity(company.days_since_activity)}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {format(new Date(company.created_at), "d MMM yyyy", { locale: tr })}
          </p>
        </div>
      </div>
    </div>
  );
}
