/**
 * Seeds test companies and users into local/staging Supabase.
 * Run after: supabase db reset (migrations applied)
 *
 * Usage: npx tsx scripts/seed-test-data.ts
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import path from "path";

config({ path: path.resolve(process.cwd(), ".env.test.local") });
config({ path: path.resolve(process.cwd(), ".env.local") });
config({ path: path.resolve(process.cwd(), ".env") });

const PASSWORD = process.env.TEST_PASSWORD ?? "TestPass123!";

const USERS = [
  { email: "test-employee-a@evtick.test", full_name: "Test Employee A", companyCode: "TESTA", role: "employee" },
  { email: "test-support-a@evtick.test", full_name: "Test Support A", companyCode: "TESTA", role: "support" },
  { email: "test-admin-a@evtick.test", full_name: "Test Admin A", companyCode: "TESTA", role: "admin" },
  { email: "test-employee-b@evtick.test", full_name: "Test Employee B", companyCode: "TESTB", role: "employee" },
  { email: "test-super@evtick.test", full_name: "Test Super Admin", companyCode: "EVTK", role: "super_admin" },
] as const;

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  async function ensureCompany(code: string, name: string) {
    const { data: existing } = await admin
      .from("companies")
      .select("id")
      .eq("code", code)
      .maybeSingle();

    if (existing) return existing.id;

    const { data, error } = await admin
      .from("companies")
      .insert({ code, name, is_active: true })
      .select("id")
      .single();

    if (error || !data) {
      throw new Error(`Failed to create company ${code}: ${error?.message}`);
    }
    return data.id;
  }

  await ensureCompany("TESTA", "Test Company A");
  await ensureCompany("TESTB", "Test Company B");
  await ensureCompany("EVTK", "EvTick Platform");

  const { data: companies } = await admin.from("companies").select("id, code");
  const companyByCode = new Map(companies?.map((c) => [c.code, c.id]) ?? []);

  for (const user of USERS) {
    const companyId = companyByCode.get(user.companyCode);
    if (!companyId) {
      throw new Error(`Company ${user.companyCode} missing`);
    }

    const { data: list } = await admin.auth.admin.listUsers();
    const existing = list?.users.find((u) => u.email === user.email);

    let userId = existing?.id;

    if (!existing) {
      const { data, error } = await admin.auth.admin.createUser({
        email: user.email,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: {
          company_id: companyId,
          full_name: user.full_name,
        },
      });
      if (error || !data.user) {
        throw new Error(`Failed to create ${user.email}: ${error?.message}`);
      }
      userId = data.user.id;
    }

    if (!userId) continue;

    const { error: profileError } = await admin
      .from("profiles")
      .update({ role: user.role, company_id: companyId, full_name: user.full_name })
      .eq("user_id", userId);

    if (profileError) {
      throw new Error(`Failed to update profile ${user.email}: ${profileError.message}`);
    }

    console.log(`OK ${user.email} (${user.role})`);
  }

  // Seed one ticket per company for IDOR tests
  const employeeA = await admin
    .from("profiles")
    .select("id, company_id")
    .eq("email", "test-employee-a@evtick.test")
    .single();
  const employeeB = await admin
    .from("profiles")
    .select("id, company_id")
    .eq("email", "test-employee-b@evtick.test")
    .single();

  if (employeeA.data && employeeB.data) {
    for (const [profile, title] of [
      [employeeA.data, "TESTA Ticket"],
      [employeeB.data, "TESTB Ticket"],
    ] as const) {
      const { data: existingTicket } = await admin
        .from("tickets")
        .select("id")
        .eq("created_by", profile.id)
        .eq("title", title)
        .maybeSingle();

      if (!existingTicket) {
        await admin.from("tickets").insert({
          company_id: profile.company_id,
          created_by: profile.id,
          title,
          description: "Test ticket for security tests",
          status: "open",
          priority: "medium",
          category: "Genel",
        });
      }
    }
  }

  console.log("Seed complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
