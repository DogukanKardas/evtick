"use client";

import { useState, useTransition, useActionState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Copy, Check, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LinkButton } from "@/components/ui/link-button";
import { CompanyStatusBadge } from "@/components/system/company-status-badge";
import { CompanyActivityTab } from "@/components/system/company-activity-tab";
import { TicketStatusChart } from "@/components/system/ticket-status-chart";
import { updateCompanyAction, toggleCompanyActiveAction } from "@/lib/system/actions";
import { updateCompanyUserRoleAction } from "@/lib/system/user-actions";
import { isPlatformCompany } from "@/lib/system/company-constants";
import { PriorityBadge, StatusBadge } from "@/components/tickets/status-badge";
import { ROLE_LABELS, ASSIGNABLE_ROLES } from "@/types/database";
import type {
  CompanyWithStats,
  Profile,
  SystemAuditLog,
  Ticket,
  TicketPriority,
  TicketStatus,
  UserRole,
} from "@/types/database";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

type Tab = "general" | "users" | "tickets" | "stats" | "activity";

interface CompanyTabsProps {
  company: CompanyWithStats;
  users: Profile[];
  tickets: Ticket[];
  stats: {
    statusCounts: Record<string, number>;
    last30Days: number;
    total: number;
  };
  auditLogs: (SystemAuditLog & { action_label: string; href?: string })[];
  initialTab?: Tab;
  onTabChange?: (tab: Tab) => void;
}

export function CompanyTabs({
  company,
  users,
  tickets,
  stats,
  auditLogs,
  initialTab = "general",
  onTabChange,
}: CompanyTabsProps) {
  const [tab, setTab] = useState<Tab>(initialTab);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  function selectTab(id: Tab) {
    setTab(id);
    onTabChange?.(id);
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "general", label: "Genel" },
    { id: "users", label: "Kullanıcılar" },
    { id: "tickets", label: "Talepler" },
    { id: "stats", label: "İstatistik" },
    { id: "activity", label: "Aktivite" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1 border-b pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => selectTab(t.id)}
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
      {tab === "users" && (
        <CompanyUsersTab companyId={company.id} users={users} />
      )}
      {tab === "tickets" && <CompanyTicketsTab tickets={tickets} />}
      {tab === "stats" && <CompanyStatsTab stats={stats} />}
      {tab === "activity" && <CompanyActivityTab logs={auditLogs} />}
    </div>
  );
}

function CompanyGeneralTab({ company }: { company: CompanyWithStats }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();
  const [state, action, savePending] = useActionState(updateCompanyAction, null);

  useEffect(() => {
    if (state?.success) toast.success("Şirket güncellendi");
    if (state?.error) toast.error(state.error);
  }, [state]);

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

        <Button type="submit" className="min-h-10" disabled={savePending}>
          {savePending ? "Kaydediliyor..." : "Kaydet"}
        </Button>
      </form>

      {!isPlatformCompany(company.code) && (
        <Button
          type="button"
          variant={company.is_active ? "destructive" : "default"}
          onClick={handleToggle}
          disabled={pending}
        >
          {company.is_active ? "Pasife Al" : "Aktifleştir"}
        </Button>
      )}
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
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const filtered = useMemo(() => {
    let list = [...users];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (u) =>
          u.full_name.toLowerCase().includes(q) ||
          (u.email?.toLowerCase().includes(q) ?? false)
      );
    }
    if (roleFilter) list = list.filter((u) => u.role === roleFilter);
    return list;
  }, [users, search, roleFilter]);

  function handleRoleChange(profileId: string, role: UserRole) {
    startTransition(async () => {
      const result = await updateCompanyUserRoleAction(profileId, role);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Rol güncellendi");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          placeholder="Ad veya e-posta ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="min-h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="">Tüm roller</option>
          {[...ASSIGNABLE_ROLES, "super_admin" as UserRole].map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>
        </div>
        <LinkButton
          href={`/system/users/new?companyId=${companyId}`}
          variant="outline"
          size="sm"
          className="min-h-10 shrink-0"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Kullanıcı Ekle
        </LinkButton>
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          Kullanıcı bulunamadı.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {filtered.map((u) => (
            <li
              key={u.id}
              className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <Link
                  href={`/system/users/${u.id}`}
                  className="font-medium hover:underline"
                >
                  {u.full_name}
                </Link>
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
      )}
    </div>
  );
}

function CompanyTicketsTab({ tickets }: { tickets: Ticket[] }) {
  const [status, setStatus] = useState<TicketStatus | "">("");
  const [priority, setPriority] = useState<TicketPriority | "">("");

  const filtered = useMemo(() => {
    let list = [...tickets];
    if (status) list = list.filter((t) => t.status === status);
    if (priority) list = list.filter((t) => t.priority === priority);
    return list.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [tickets, status, priority]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as TicketStatus | "")}
          className="min-h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="">Tüm durumlar</option>
          <option value="open">Açık</option>
          <option value="in_progress">İşlemde</option>
          <option value="resolved">Çözüldü</option>
          <option value="closed">Kapalı</option>
        </select>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as TicketPriority | "")}
          className="min-h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="">Tüm öncelikler</option>
          <option value="low">Düşük</option>
          <option value="medium">Orta</option>
          <option value="high">Yüksek</option>
          <option value="urgent">Acil</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          Talep bulunamadı.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {filtered.map((t) => (
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
      )}
    </div>
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
  const chartData = Object.entries(stats.statusCounts).map(([status, count]) => ({
    status: status as TicketStatus,
    count,
  }));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Toplam talep</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Son 30 gün</p>
          <p className="text-2xl font-bold">{stats.last30Days}</p>
        </div>
      </div>
      <TicketStatusChart data={chartData} />
    </div>
  );
}
