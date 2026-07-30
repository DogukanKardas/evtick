"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inviteSuperAdminAction } from "@/lib/system/admin-actions";

export function AdminsInviteForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(inviteSuperAdminAction, null);

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    if (state?.success) {
      toast.success("Davet gönderildi");
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <div className="space-y-4">
      <section className="rounded-lg border p-4 max-w-md">
        <h2 className="mb-4 text-lg font-semibold">
          Yeni Sistem Yöneticisi Davet
        </h2>
        <form ref={formRef} action={action} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Ad Soyad</Label>
            <Input
              id="full_name"
              name="full_name"
              required
              className="min-h-10"
            />
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
          <Button type="submit" disabled={pending} className="min-h-10">
            {pending ? "Gönderiliyor..." : "Davet Gönder"}
          </Button>
        </form>
      </section>

      {state?.success && state.email && (
        <div className="max-w-md rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
          <p className="font-medium">Davet başarıyla gönderildi</p>
          <p className="mt-1 text-muted-foreground">
            {state.email} adresine davet e-postası iletildi.
          </p>
        </div>
      )}
    </div>
  );
}
