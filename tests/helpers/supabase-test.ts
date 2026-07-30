import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getTestEnv, TEST_PASSWORD } from "./env";

export function createServiceClient(): SupabaseClient {
  const env = getTestEnv();
  return createClient(env.supabaseUrl, env.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function createAnonClient(): SupabaseClient {
  const env = getTestEnv();
  return createClient(env.supabaseUrl, env.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function signInAs(
  email: string,
  password = TEST_PASSWORD
): Promise<SupabaseClient> {
  const client = createAnonClient();
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    throw new Error(`signInAs(${email}): ${error.message}`);
  }
  return client;
}

export async function getCompanyIdByCode(code: string): Promise<string> {
  const admin = createServiceClient();
  const { data, error } = await admin
    .from("companies")
    .select("id")
    .eq("code", code)
    .single();
  if (error || !data) {
    throw new Error(`Company ${code} not found: ${error?.message}`);
  }
  return data.id;
}

export async function getProfileIdByEmail(email: string): Promise<string> {
  const admin = createServiceClient();
  const { data, error } = await admin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .single();
  if (error || !data) {
    throw new Error(`Profile ${email} not found: ${error?.message}`);
  }
  return data.id;
}
