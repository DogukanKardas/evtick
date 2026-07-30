"use client";

import { useActionState, useState, useEffect } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LinkButton } from "@/components/ui/link-button";
import { createCompanyAction } from "@/lib/system/actions";

interface SuccessState {
  code: string;
  id?: string;
}

export function CompanyForm() {
  const [mode, setMode] = useState<"manual" | "auto">("manual");
  const [success, setSuccess] = useState<SuccessState | null>(null);
  const [copied, setCopied] = useState(false);
  const [state, action, pending] = useActionState(createCompanyAction, null);

  useEffect(() => {
    if (state?.success && state.code) {
      setSuccess({ code: state.code, id: state.id });
      toast.success("Şirket oluşturuldu");
    }
    if (state?.error) toast.error(state.error);
  }, [state]);

  async function copyCode() {
    if (!success?.code) return;
    await navigator.clipboard.writeText(success.code);
    setCopied(true);
    toast.success("Kod kopyalandı");
    setTimeout(() => setCopied(false), 2000);
  }

  if (success) {
    return (
      <div className="space-y-6 text-center">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-900 dark:bg-emerald-950/30">
          <p className="mb-2 text-sm text-muted-foreground">Şirket kodu</p>
          <p className="font-mono text-3xl font-bold tracking-wide">
            {success.code}
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={copyCode}
          >
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Kopyalandı
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Kodu Kopyala
              </>
            )}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Bu kodu çalışanlarınızla paylaşın. Kayıt olurken şirket kodu olarak
          kullanılacaktır.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <LinkButton href="/system/companies">Şirket listesine git</LinkButton>
          {success.id && (
            <LinkButton
              href={`/system/companies/${success.id}`}
              variant="outline"
            >
              Detaya git
            </LinkButton>
          )}
          <Button type="button" variant="ghost" onClick={() => setSuccess(null)}>
            Yeni şirket oluştur
          </Button>
        </div>
      </div>
    );
  }

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

      <div className="space-y-2">
        <Label htmlFor="contact_email">İletişim E-postası (opsiyonel)</Label>
        <Input
          id="contact_email"
          name="contact_email"
          type="email"
          placeholder="it@acme.com"
          className="min-h-11"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notlar (opsiyonel)</Label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder="İç notlar..."
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </div>

      {state?.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="min-h-11 w-full">
        {pending ? "Oluşturuluyor..." : "Şirket Oluştur"}
      </Button>
    </form>
  );
}
