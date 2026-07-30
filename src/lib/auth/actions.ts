"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthCallbackUrl } from "@/lib/site-url";

export async function loginAction(
  _prev: { error?: string; success?: boolean; redirectTo?: string } | null,
  formData: FormData
) {
  const companyCode = (formData.get("companyCode") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!companyCode || !email || !password) {
    return { error: "Tüm alanları doldurun." };
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return {
      error:
        "Supabase bağlantı ayarları eksik. Vercel ortam değişkenlerini kontrol edin.",
    };
  }

  const supabase = await createClient();

  const { data: company, error: companyError } = await supabase.rpc(
    "get_company_by_code",
    { p_code: companyCode }
  );

  if (companyError || !company?.length) {
    return { error: "Geçersiz şirket kodu." };
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    if (signInError.message.toLowerCase().includes("email not confirmed")) {
      return {
        error:
          "E-posta adresiniz henüz doğrulanmamış. Gelen kutunuzu kontrol edin.",
      };
    }
    return { error: "E-posta veya şifre hatalı." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Giriş başarısız." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("user_id", user.id)
    .single();

  if (!profile) {
    await supabase.auth.signOut();
    return {
      error:
        "Profil bulunamadı. Kayıt sırasında bir hata oluşmuş olabilir. Tekrar kayıt olun veya destek alın.",
    };
  }

  if (profile.company_id !== company[0].id) {
    await supabase.auth.signOut();
    return { error: "Bu şirket kodu hesabınızla eşleşmiyor." };
  }

  return { success: true, redirectTo: "/dashboard" };
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function resendVerificationAction(email: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: getAuthCallbackUrl(),
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
