"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function loginAction(
  _prev: { error?: string } | null,
  formData: FormData
) {
  const companyCode = (formData.get("companyCode") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;

  if (!companyCode || !email || !password) {
    return { error: "Tüm alanları doldurun." };
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

  if (!profile || profile.company_id !== company[0].id) {
    await supabase.auth.signOut();
    return { error: "Bu şirket kodu hesabınızla eşleşmiyor." };
  }

  redirect("/dashboard");
}

export async function registerAction(
  _prev: { error?: string } | null,
  formData: FormData
) {
  const companyCode = (formData.get("companyCode") as string)?.trim();
  const fullName = (formData.get("fullName") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
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

  const supabase = await createClient();

  const { data: company, error: companyError } = await supabase.rpc(
    "get_company_by_code",
    { p_code: companyCode }
  );

  if (companyError || !company?.length) {
    return { error: "Geçersiz şirket kodu." };
  }

  const { error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        company_id: company[0].id,
        full_name: fullName,
        role: "employee",
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
    },
  });

  if (signUpError) {
    if (signUpError.message.includes("already registered")) {
      return { error: "Bu e-posta adresi zaten kayıtlı." };
    }
    return { error: signUpError.message };
  }

  redirect("/verify-email?email=" + encodeURIComponent(email));
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
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
