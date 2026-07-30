"use client";

import { useState, useTransition, useActionState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CompanyStatusBadge } from "@/components/system/company-status-badge";
import {
  updateCompanyAction,
  toggleCompanyActiveAction,
} from "@/lib/system/actions";
import { updateCompanyUserRoleAction } from "@/lib/system/user-actions";
import { PriorityBadge, StatusBadge } from "@/components/tickets/status-badge";
import { ROLE_LABELS, ASSIGNABLE_ROLES } from "@/types/database";
import type { CompanyWithStats, Profile, Ticket, UserRole } from "@/types/database";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

type Tab = "general" | "users" | "tickets" | "stats";

interface CompanyTabsProps {
  company: CompanyWithStats;
  users: Profile[];
  tickets: Ticket[];
  stats: {
    statusCounts: Record<string, number>;
    last30Days: number;
    total: number;
  };
}

export function CompanyTabs({
  company,
  users,
  tickets,
  stats,
}: CompanyTabsProps) {
  const [tab, setTab] = useState<Tab>("general");
  const tabs: { id: Tab; label: string }[] = [
    { id: "general", label: "Genel" },
    { id: "users", label: "Kullanıcılar" },
    { id: "tickets", label: "Talepler" },
    { id: "stats", label: "İstatistik" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1 border-b pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-md px-3 py-1.5 text-sm ${
              tab === t.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "general" && <CompanyGeneralTab company={company} />}
      {tab === "users" && <CompanyUsersTab companyId={company.id} users={users} />}
      {tab === "tickets" && <CompanyTicketsTab tickets={tickets} />}
      {tab === "stats" && <CompanyStatsTab stats={stats} />}
    </div>
  );
}

function CompanyGeneralTab({ company }: { company: CompanyWithStats }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();
  const [state, action, savePending] = useActionState(updateCompanyAction, null);

  async function copyCode() {
    await navigator.clipboard.writeText(company.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleToggle() {
    startTransition(async () => {
      await toggleCompanyActiveAction(company.id, !company.is_active);
      router.refresh();
    });
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="flex items-center gap-2">
        <CompanyStatusBadge isActive={company.is_active} />
        <span className="text-sm text-muted-foreground">
          {format(new Date(company.created_at), "d MMMM yyyy", { locale: tr })}
        </span>
      </div>

      <form action={action} className="space-y-4">
        <input type="hidden" name="id" value={company.id} />
        <input
          type="hidden"
          name="is_active"
          value={company.is_active ? "true" : "false"}
        />

        <div className="space-y-2">
          <Label htmlFor="name">Şirket Adı</Label>
          <Input id="name" name="name" defaultValue={company.name} required />
        </div>

        <div className="space-y-2">
          <Label>Kod</Label>
          <div className="flex gap-2">
            <Input value={company.code} disabled className="font-mono" />
            <Button type="button" variant="outline" onClick={copyCode}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact_email">İletişim E-postası</Label>
          <Input
            id="contact_email"
            name="contact_email"
            type="email"
            defaultValue={company.contact_email ?? ""}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notlar</Label>
          <textarea
            id="notes"
            name="notes"
            defaultValue={company.notes ?? ""}
            rows={3}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        {state?.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
        {state?.success && (
          <p className="text-sm text-emerald-600">Güncellendi.</p>
        )}

        <Button type="submit" className="min-h-10" disabled={savePending}>
          {savePending ? "Kaydediliyor..." : "Kaydet"}
        </Button>
      </form>

      <Button
        type="button"
        variant={company.is_active ? "destructive" : "default"}
        onClick={handleToggle}
        disabled={pending}
      >
        {company.is_active ? "Pasife Al" : "Aktifleştir"}
      </Button>
    </div>
  );
}

function CompanyUsersTab({
  companyId,
  users,
}: {
  companyId: string;
  users: Profile[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleRoleChange(profileId: string, role: UserRole) {
    startTransition(async () => {
      await updateCompanyUserRoleAction(profileId, role);
      router.refresh();
    });
  }

  if (users.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        Bu şirkette kullanıcı yok.
      </p>
    );
  }

  return (
    <ul className="divide-y rounded-lg border">
      {users.map((u) => (
        <li
          key={u.id}
          className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="font-medium">{u.full_name}</p>
            <p className="text-sm text-muted-foreground">{u.email}</p>
          </div>
          {u.role === "super_admin" ? (
            <span className="text-sm">{ROLE_LABELS.super_admin}</span>
          ) : (
            <select
              value={u.role}
              disabled={pending}
              onChange={(e) =>
                handleRoleChange(u.id, e.target.value as UserRole)
              }
              className="min-h-10 rounded-md border bg-background px-3 text-sm"
            >
              {ASSIGNABLE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          )}
        </li>
      ))}
    </ul>
  );
}

function CompanyTicketsTab({ tickets }: { tickets: Ticket[] }) {
  if (tickets.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        Bu şirkette talep yok.
      </p>
    );
  }

  return (
    <ul className="divide-y rounded-lg border">
      {tickets.map((t) => (
        <li key={t.id} className="p-4">
          <Link
            href={`/system/tickets/${t.id}`}
            className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-medium hover:underline">{t.title}</p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(t.created_at), "d MMM yyyy", { locale: tr })}
              </p>
            </div>
            <div className="flex gap-2">
              <StatusBadge status={t.status} />
              <PriorityBadge priority={t.priority} />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function CompanyStatsTab({
  stats,
}: {
  stats: {
    statusCounts: Record<string, number>;
    last30Days: number;
    total: number;
  };
}) {
  const labels: Record<string, string> = {
    open: "Açık",
    in_progress: "İşlemde",
    resolved: "Çözüldü",
    closed: "Kapalı",
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-lg border p-4">
        <p className="text-sm text-muted-foreground">Toplam talep</p>
        <p className="text-2xl font-bold">{stats.total}</p>
      </div>
      <div className="rounded-lg border p-4">
        <p className="text-sm text-muted-foreground">Son 30 gün</p>
        <p className="text-2xl font-bold">{stats.last30Days}</p>
      </div>
      {Object.entries(stats.statusCounts).map(([status, count]) => (
        <div key={status} className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">
            {labels[status] ?? status}
          </p>
          <p className="text-2xl font-bold">{count}</p>
        </div>
      ))}
    </div>
  );
}
