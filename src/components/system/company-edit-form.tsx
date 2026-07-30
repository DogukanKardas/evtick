"use client";

import { useActionState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  updateCompanyAction,
  toggleCompanyActiveAction,
} from "@/lib/system/actions";
import type { CompanyWithStats } from "@/types/database";

export function CompanyEditForm({ company }: { company: CompanyWithStats }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(updateCompanyAction, null);
  const [togglePending, startToggle] = useTransition();

  useEffect(() => {
    if (state?.success) {
      // page will revalidate
    }
  }, [state]);

  function handleToggle() {
    startToggle(async () => {
      await toggleCompanyActiveAction(company.id, !company.is_active);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <form action={action} className="space-y-4">
        <input type="hidden" name="id" value={company.id} />
        <input
          type="hidden"
          name="is_active"
          value={company.is_active ? "true" : "false"}
        />

        <div className="space-y-2">
          <Label htmlFor="name">Şirket Adı</Label>
          <Input
            id="name"
            name="name"
            defaultValue={company.name}
            required
            className="min-h-11"
          />
        </div>

        <div className="space-y-2">
          <Label>Şirket Kodu</Label>
          <Input
            value={company.code}
            disabled
            className="min-h-11 font-mono"
          />
          <p className="text-xs text-muted-foreground">
            Kod değiştirilemez. Yeni kod için yeni şirket oluşturun.
          </p>
        </div>

        {state?.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
        {state?.success && (
          <p className="text-sm text-emerald-600">Güncellendi.</p>
        )}

        <Button type="submit" disabled={pending} className="min-h-11">
          {pending ? "Kaydediliyor..." : "Kaydet"}
        </Button>
      </form>

      <Button
        type="button"
        variant={company.is_active ? "destructive" : "default"}
        onClick={handleToggle}
        disabled={togglePending}
        className="min-h-11"
      >
        {togglePending
          ? "..."
          : company.is_active
            ? "Şirketi Pasife Al"
            : "Şirketi Aktifleştir"}
      </Button>
    </div>
  );
}
