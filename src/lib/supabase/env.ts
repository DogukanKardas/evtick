function missingEnv(name: string): never {
  throw new Error(
    `Ortam değişkeni eksik: ${name}. .env dosyanıza ekleyin (ör. NEXT_PUBLIC_SUPABASE_URL).`
  );
}

export function getSupabaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.SUPABASE_URL ??
    missingEnv("NEXT_PUBLIC_SUPABASE_URL")
  );
}

export function getSupabaseAnonKey(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    missingEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
  );
}

export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}
