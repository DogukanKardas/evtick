"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { loginAction } from "@/lib/auth/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, null);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Giriş Yap</CardTitle>
        <CardDescription>
          Şirket kodunuz, e-posta ve şifrenizle giriş yapın
        </CardDescription>
      </CardHeader>
      <form action={action}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyCode">Şirket Kodu</Label>
            <Input
              id="companyCode"
              name="companyCode"
              placeholder="DEMO01"
              required
              className="min-h-11 uppercase"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-posta</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="ornek@sirket.com"
              required
              className="min-h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Şifre</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              className="min-h-11"
            />
          </div>
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" disabled={pending} className="min-h-11 w-full">
            {pending ? "Giriş yapılıyor..." : "Giriş Yap"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Hesabınız yok mu?{" "}
            <Link href="/register" className="text-primary underline-offset-4 hover:underline">
              Kayıt Ol
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
