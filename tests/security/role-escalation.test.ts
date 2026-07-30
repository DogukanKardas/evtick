import { describe, expect, it } from "vitest";
import { hasIntegrationEnv } from "../helpers/env";

describe("role allowlists", () => {
  it("ASSIGNABLE_ROLES excludes super_admin", async () => {
    const { ASSIGNABLE_ROLES } = await import("@/types/database");
    expect(ASSIGNABLE_ROLES).not.toContain("super_admin");
    expect(ASSIGNABLE_ROLES).toEqual(
      expect.arrayContaining(["employee", "support", "admin"])
    );
  });
});

describe.skipIf(!hasIntegrationEnv())("role escalation (integration)", () => {
  it("signup metadata cannot persist super_admin role", async () => {
    const { createServiceClient, getCompanyIdByCode } = await import(
      "../helpers/supabase-test"
    );
    const admin = createServiceClient();
    const companyId = await getCompanyIdByCode("TESTA");
    const email = `escalation-${Date.now()}@evtick.test`;

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: "TestPass123!",
      email_confirm: true,
      user_metadata: {
        company_id: companyId,
        full_name: "Escalation Test",
        role: "super_admin",
      },
    });

    expect(error).toBeNull();
    expect(data.user).toBeTruthy();

    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("user_id", data.user!.id)
      .single();

    expect(profile?.role).toBe("employee");

    await admin.auth.admin.deleteUser(data.user!.id);
  });
});
