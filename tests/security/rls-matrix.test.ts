import { describe, expect, it } from "vitest";
import { hasIntegrationEnv } from "../helpers/env";
import {
  createAnonClient,
  createServiceClient,
  getCompanyIdByCode,
  signInAs,
} from "../helpers/supabase-test";

describe.skipIf(!hasIntegrationEnv())("RPC permissions", () => {
  it("employee cannot call generate_company_code", async () => {
    const client = await signInAs("test-employee-a@evtick.test");
    const { error } = await client.rpc("generate_company_code", {
      p_name: "Hack Co",
    });
    expect(error).toBeTruthy();
  });

  it("super admin can call generate_company_code", async () => {
    const client = await signInAs("test-super@evtick.test");
    const { data, error } = await client.rpc("generate_company_code", {
      p_name: "Valid Co",
    });
    expect(error).toBeNull();
    expect(typeof data).toBe("string");
    expect((data as string).length).toBeGreaterThan(2);
  });
});

describe.skipIf(!hasIntegrationEnv())("RLS matrix", () => {
  it("employee cannot read another company ticket", async () => {
    const admin = createServiceClient();
    const companyB = await getCompanyIdByCode("TESTB");

    const { data: ticketB } = await admin
      .from("tickets")
      .select("id")
      .eq("company_id", companyB)
      .limit(1)
      .single();

    expect(ticketB?.id).toBeTruthy();

    const employeeA = await signInAs("test-employee-a@evtick.test");
    const { data, error } = await employeeA
      .from("tickets")
      .select("id")
      .eq("id", ticketB!.id)
      .maybeSingle();

    expect(error).toBeNull();
    expect(data).toBeNull();
  });

  it("anon cannot read tickets", async () => {
    const anon = createAnonClient();
    const { data, error } = await anon.from("tickets").select("id").limit(1);
    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(0);
  });

  it("admin cannot assign super_admin to company user via RLS", async () => {
    const admin = createServiceClient();
    const { data: target } = await admin
      .from("profiles")
      .select("id")
      .eq("email", "test-support-a@evtick.test")
      .single();

    const adminClient = await signInAs("test-admin-a@evtick.test");
    const { error } = await adminClient
      .from("profiles")
      .update({ role: "super_admin" })
      .eq("id", target!.id);

    expect(error).toBeTruthy();
  });

  it("super admin can read all companies", async () => {
    const superClient = await signInAs("test-super@evtick.test");
    const { data, error } = await superClient.from("companies").select("id");
    expect(error).toBeNull();
    expect((data ?? []).length).toBeGreaterThanOrEqual(2);
  });
});
