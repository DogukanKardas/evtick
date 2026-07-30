import { LoginForm } from "@/components/auth/login-form";

interface LoginPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;
  const callbackError =
    error === "auth"
      ? "Doğrulama bağlantısı geçersiz veya süresi dolmuş. Tekrar deneyin."
      : undefined;

  return <LoginForm initialError={callbackError} />;
}
