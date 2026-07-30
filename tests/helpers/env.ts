export function getTestEnv() {
  return {
    supabaseUrl:
      process.env.NEXT_PUBLIC_SUPABASE_URL ??
      process.env.SUPABASE_URL ??
      "",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  };
}

export function hasIntegrationEnv(): boolean {
  const env = getTestEnv();
  return Boolean(
    env.supabaseUrl &&
      env.anonKey &&
      env.serviceRoleKey &&
      process.env.RUN_INTEGRATION_TESTS === "1"
  );
}

export const TEST_PASSWORD = "TestPass123!";

export const TEST_USERS = {
  employeeA: {
    email: "test-employee-a@evtick.test",
    role: "employee" as const,
    companyCode: "TESTA",
  },
  supportA: {
    email: "test-support-a@evtick.test",
    role: "support" as const,
    companyCode: "TESTA",
  },
  adminA: {
    email: "test-admin-a@evtick.test",
    role: "admin" as const,
    companyCode: "TESTA",
  },
  employeeB: {
    email: "test-employee-b@evtick.test",
    role: "employee" as const,
    companyCode: "TESTB",
  },
  superAdmin: {
    email: "test-super@evtick.test",
    role: "super_admin" as const,
    companyCode: "EVTK",
  },
};
