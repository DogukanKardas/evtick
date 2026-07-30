"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCompanyAction } from "@/lib/system/actions";

export function CompanyForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"manual" | "auto">("manual");
  const [state, action, pending] = useActionState(createCompanyAction, null);

  useEffect(() => {
    if (state?.success) {
      router.push("/system/companies");
    }
  }, [state, router]);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="mode" value={mode} />

      <div className="flex gap-2">
        <Button
          type="button"
          variant={mode === "manual" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("manual")}
          className="min-h-10"
        >
          Manuel Kod
        </Button>
        <Button
          type="button"
          variant={mode === "auto" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("auto")}
          className="min-h-10"
        >
          Otomatik Kod
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Şirket Adı</Label>
        <Input
          id="name"
          name="name"
          placeholder="Acme Corp"
          required
          className="min-h-11"
        />
      </div>

      {mode === "manual" && (
        <div className="space-y-2">
          <Label htmlFor="code">Şirket Kodu</Label>
          <Input
            id="code"
            name="code"
            placeholder="ACME01"
            required
            pattern="[A-Za-z0-9]{4,12}"
            className="min-h-11 uppercase"
            onChange={(e) => {
              e.target.value = e.target.value.toUpperCase();
            }}
          />
          <p className="text-xs text-muted-foreground">
            4-12 karakter, büyük harf ve rakam
          </p>
        </div>
      )}

      {mode === "auto" && (
        <p className="text-sm text-muted-foreground">
          Sistem şirket adından benzersiz bir kod üretecek (ör. ACME-X7K2).
        </p>
      )}

      {state?.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      {state?.success && state.code && (
        <p className="rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
          Şirket oluşturuldu! Kod: <strong>{state.code}</strong>
        </p>
      )}

      <Button type="submit" disabled={pending} className="min-h-11 w-full">
        {pending ? "Oluşturuluyor..." : "Şirket Oluştur"}
      </Button>
    </form>
  );
}
