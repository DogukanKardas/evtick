"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminsInviteForm } from "@/components/system/admins-invite-form";
import { AdminsTablePro } from "@/components/system/admins-table-pro";
import { PromotableUsersTable } from "@/components/system/promotable-users-table";
import { AdminsActivityTab } from "@/components/system/admins-activity-tab";
import type { Profile, SystemAuditLog } from "@/types/database";

type Tab = "admins" | "invite" | "promote" | "activity";

interface AdminsShellProps {
  admins: Profile[];
  promotableUsers: Profile[];
  companies: { id: string; name: string }[];
  auditLogs: (SystemAuditLog & { action_label: string; href?: string })[];
  currentProfileId: string;
}

export function AdminsShell({
  admins,
  promotableUsers,
  companies,
  auditLogs,
  currentProfileId,
}: AdminsShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as Tab | null;
  const [tab, setTab] = useState<Tab>(tabParam ?? "admins");

  useEffect(() => {
    if (tabParam && ["admins", "invite", "promote", "activity"].includes(tabParam)) {
      setTab(tabParam);
    }
  }, [tabParam]);

  const selectTab = useCallback(
    (id: Tab) => {
      setTab(id);
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", id);
      router.push(`/system/admins?${params.toString()}`);
    },
    [router, searchParams]
  );

  const tabs: { id: Tab; label: string }[] = [
    { id: "admins", label: "Yöneticiler" },
    { id: "invite", label: "Davet Et" },
    { id: "promote", label: "Yükselt" },
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

      {tab === "admins" && (
        <AdminsTablePro admins={admins} currentProfileId={currentProfileId} />
      )}
      {tab === "invite" && <AdminsInviteForm />}
      {tab === "promote" && (
        <PromotableUsersTable users={promotableUsers} companies={companies} />
      )}
      {tab === "activity" && <AdminsActivityTab logs={auditLogs} />}
    </div>
  );
}
