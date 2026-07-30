import { describe, expect, it } from "vitest";
import { hasIntegrationEnv } from "../helpers/env";
import {
  createServiceClient,
  getCompanyIdByCode,
  getProfileIdByEmail,
  signInAs,
} from "../helpers/supabase-test";

describe.skipIf(!hasIntegrationEnv())("IDOR protection", () => {
  it("employee cannot insert message on another company ticket", async () => {
    const admin = createServiceClient();
    const companyB = await getCompanyIdByCode("TESTB");
    const employeeBId = await getProfileIdByEmail("test-employee-b@evtick.test");

    const { data: ticketB } = await admin
      .from("tickets")
      .select("id")
      .eq("company_id", companyB)
      .eq("created_by", employeeBId)
      .limit(1)
      .single();

    expect(ticketB?.id).toBeTruthy();

    const employeeA = await signInAs("test-employee-a@evtick.test");
    const senderId = await getProfileIdByEmail("test-employee-a@evtick.test");

    const { error } = await employeeA.from("ticket_messages").insert({
      ticket_id: ticketB!.id,
      sender_id: senderId,
      content: "IDOR attempt",
    });

    expect(error).toBeTruthy();
  });

  it("employee cannot read another company audit logs", async () => {
    const employeeA = await signInAs("test-employee-a@evtick.test");
    const { data, error } = await employeeA
      .from("system_audit_logs")
      .select("id")
      .limit(1);

    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(0);
  });
});
