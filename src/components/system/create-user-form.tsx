"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LinkButton } from "@/components/ui/link-button";
import { createPlatformUserAction } from "@/lib/system/user-actions";
import { ASSIGNABLE_ROLES, ROLE_LABELS } from "@/types/database";

interface CreateUserFormProps {
  companies: { id: string; name: string; code: string }[];
  defaultCompanyId?: string;
}

export function CreateUserForm({
  companies,
  defaultCompanyId,
}: CreateUserFormProps) {
  const [success, setSuccess] = useState<{
    profileId: string;
    email: string;
  } | null>(null);
  const [state, action, pending] = useActionState(createPlatformUserAction, null);

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    if (state?.success && state.profileId && state.email) {
      setSuccess({ profileId: state.profileId, email: state.email });
      toast.success("Kullanıcı oluşturuldu");
    }
  }, [state]);

  if (success) {
    return (
      <div className="space-y-6 text-center">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-900 dark:bg-emerald-950/30">
          <p className="mb-2 text-sm text-muted-foreground">Hesap oluşturuldu</p>
          <p className="font-medium">{success.email}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Kullanıcı şirket kodu ve belirlediğiniz şifre ile giriş yapabilir.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <LinkButton href="/system/users">Kullanıcı listesine git</LinkButton>
          <LinkButton
            href={`/system/users/${success.profileId}`}
            variant="outline"
          >
            Kullanıcı detayı
          </LinkButton>
          <Button type="button" variant="ghost" onClick={() => setSuccess(null)}>
            Yeni kullanıcı oluştur
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="full_name">Ad Soyad</Label>
        <Input
          id="full_name"
          name="full_name"
          placeholder="Ayşe Yılmaz"
          required
          className="min-h-11"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">E-posta</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="ayse@sirket.com"
          required
          className="min-h-11"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Geçici Şifre</Label>
        <Input
          id="password"
          name="password"
          type="password"
          minLength={8}
          required
          autoComplete="new-password"
          className="min-h-11"
        />
        <p className="text-xs text-muted-foreground">
          En az 8 karakter. Kullanıcıya iletin; ilk girişte değiştirmesi önerilir.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="company_id">Şirket</Label>
        <select
          id="company_id"
          name="company_id"
          required
          defaultValue={defaultCompanyId ?? ""}
          className="min-h-11 w-full rounded-md border bg-background px-3 text-sm"
        >
          <option value="" disabled>
            Şirket seçin
          </option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name} ({company.code})
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Rol</Label>
        <select
          id="role"
          name="role"
          required
          defaultValue="employee"
          className="min-h-11 w-full rounded-md border bg-background px-3 text-sm"
        >
          {ASSIGNABLE_ROLES.map((role) => (
            <option key={role} value={role}>
              {ROLE_LABELS[role]}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          Sistem yöneticisi rolü yalnızca Yöneticiler sayfasından atanabilir.
        </p>
      </div>

      {state?.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="min-h-11 w-full">
        {pending ? "Oluşturuluyor..." : "Kullanıcı Oluştur"}
      </Button>
    </form>
  );
}
