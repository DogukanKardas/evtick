"use client";

import { useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  inviteSuperAdminAction,
  promoteToSuperAdminAction,
  demoteSuperAdminAction,
} from "@/lib/system/admin-actions";
import type { Profile } from "@/types/database";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { ROLE_LABELS } from "@/types/database";

interface AdminsPanelProps {
  admins: Profile[];
  promotableUsers: Profile[];
}

export function AdminsPanel({ admins, promotableUsers }: AdminsPanelProps) {
  const [state, action, pending] = useActionState(inviteSuperAdminAction, null);
  const router = useRouter();
  const [togglePending, startTransition] = useTransition();

  function handlePromote(profileId: string) {
    startTransition(async () => {
      await promoteToSuperAdminAction(profileId);
      router.refresh();
    });
  }

  function handleDemote(profileId: string) {
    startTransition(async () => {
      await demoteSuperAdminAction(profileId);
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <section className="rounded-lg border p-4">
        <h2 className="mb-4 text-lg font-semibold">Yeni Sistem Yöneticisi Davet</h2>
        <form action={action} className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="full_name">Ad Soyad</Label>
            <Input id="full_name" name="full_name" required className="min-h-10" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-posta</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              className="min-h-10"
            />
          </div>
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          {state?.success && (
            <p className="text-sm text-emerald-600">Davet gönderildi.</p>
          )}
          <Button type="submit" disabled={pending} className="min-h-10">
            {pending ? "Gönderiliyor..." : "Davet Gönder"}
          </Button>
        </form>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Mevcut Yöneticiler</h2>
        <ul className="divide-y rounded-lg border">
          {admins.map((a) => (
            <li
              key={a.id}
              className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">{a.full_name}</p>
                <p className="text-sm text-muted-foreground">{a.email}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(a.created_at), "d MMMM yyyy", { locale: tr })}
                </p>
              </div>
              {admins.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={togglePending}
                  onClick={() => handleDemote(a.id)}
                >
                  Rolü Düşür
                </Button>
              )}
            </li>
          ))}
        </ul>
      </section>

      {promotableUsers.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">Mevcut Kullanıcıyı Yükselt</h2>
          <ul className="divide-y rounded-lg border">
            {promotableUsers.slice(0, 20).map((u) => (
              <li
                key={u.id}
                className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">{u.full_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {u.email} · {ROLE_LABELS[u.role]}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  disabled={togglePending}
                  onClick={() => handlePromote(u.id)}
                >
                  Yükselt
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
