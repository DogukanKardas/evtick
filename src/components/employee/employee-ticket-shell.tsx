"use client";

import { useState } from "react";
import { EmployeeTicketHeader } from "@/components/employee/employee-ticket-header";
import { EmployeeTicketTabs } from "@/components/employee/employee-ticket-tabs";
import type {
  Profile,
  Ticket,
  TicketMessage,
  TicketStatusLog,
} from "@/types/database";

type Tab = "general" | "chat" | "history";

interface EmployeeTicketShellProps {
  ticket: Ticket;
  profile: Profile;
  messages: TicketMessage[];
  statusLogs: TicketStatusLog[];
}

export function EmployeeTicketShell({
  ticket,
  profile,
  messages,
  statusLogs,
}: EmployeeTicketShellProps) {
  const [tab, setTab] = useState<Tab>("general");

  return (
    <div className="space-y-6">
      <EmployeeTicketHeader
        ticket={ticket}
        messageCount={messages.length}
        onTabChange={(t) => setTab(t as Tab)}
      />
      <EmployeeTicketTabs
        ticket={ticket}
        profile={profile}
        messages={messages}
        statusLogs={statusLogs}
        initialTab={tab}
        onTabChange={setTab}
      />
    </div>
  );
}
