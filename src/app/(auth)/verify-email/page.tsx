"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useTransition } from "react";
import { LinkButton } from "@/components/ui/link-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { resendVerificationAction } from "@/lib/auth/actions";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [pending, startTransition] = useTransition();

  function handleResend() {
    if (!email) return;
    startTransition(async () => {
      await resendVerificationAction(email);
    });
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>E-posta Doğrulama</CardTitle>
        <CardDescription>
          {email
            ? `${email} adresine doğrulama bağlantısı gönderildi.`
            : "Kayıt işleminiz tamamlandı."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Lütfen e-posta kutunuzu kontrol edin ve hesabınızı doğrulamak için
          bağlantıya tıklayın. Doğrulama sonrası giriş yapabilirsiniz.
        </p>
      </CardContent>
      <CardFooter className="flex flex-col gap-3">
        {email && (
          <Button
            variant="outline"
            onClick={handleResend}
            disabled={pending}
            className="min-h-11 w-full"
          >
            {pending ? "Gönderiliyor..." : "Doğrulama E-postasını Tekrar Gönder"}
          </Button>
        )}
        <LinkButton href="/login" className="min-h-11 w-full">
          Giriş Sayfasına Dön
        </LinkButton>
      </CardFooter>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
