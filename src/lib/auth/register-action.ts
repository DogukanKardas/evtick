"use server";

import { createClient } from "@/lib/supabase/server";

export async function registerAction(
  _prev: { error?: string; success?: boolean; email?: string } | null,
  formData: FormData
) {
  const companyCode = (formData.get("companyCode") as string)?.trim();
  const fullName = (formData.get("fullName") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!companyCode || !fullName || !email || !password) {
    return { error: "Tüm alanları doldurun." };
  }

  if (password.length < 6) {
    return { error: "Şifre en az 6 karakter olmalıdır." };
  }

  if (password !== confirmPassword) {
    return { error: "Şifreler eşleşmiyor." };
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

  if (companyError) {
    console.error("get_company_by_code error:", companyError);
    if (companyError.message.includes("function") || companyError.code === "42883") {
      return {
        error:
          "Veritabanı kurulumu eksik. Supabase SQL Editor'de migration dosyasını çalıştırın.",
      };
    }
    return { error: `Şirket kodu doğrulanamadı: ${companyError.message}` };
  }

  if (!company?.length) {
    return {
      error: "Geçersiz şirket kodu. DEMO01 kodunu deneyin veya yöneticinize başvurun.",
    };
  }

  const { getAuthCallbackUrl } = await import("@/lib/site-url");

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        company_id: company[0].id,
        full_name: fullName,
        role: "employee",
      },
      emailRedirectTo: getAuthCallbackUrl(),
    },
  });

  if (signUpError) {
    console.error("signUp error:", signUpError);
    const msg = signUpError.message.toLowerCase();
    if (msg.includes("already registered") || msg.includes("already been registered")) {
      return { error: "Bu e-posta adresi zaten kayıtlı. Giriş yapmayı deneyin." };
    }
    if (msg.includes("invalid email")) {
      return { error: "Geçersiz e-posta adresi." };
    }
    if (msg.includes("password")) {
      return { error: "Şifre gereksinimleri karşılanmıyor." };
    }
    return { error: signUpError.message };
  }

  if (!signUpData.user) {
    return { error: "Kayıt oluşturulamadı. Lütfen tekrar deneyin." };
  }

  // E-posta doğrulama kapalıysa oturum açılır; açıksa verify-email'e yönlendir
  if (signUpData.session) {
    return { success: true, email, redirectTo: "/dashboard" };
  }

  return { success: true, email, redirectTo: `/verify-email?email=${encodeURIComponent(email)}` };
}
