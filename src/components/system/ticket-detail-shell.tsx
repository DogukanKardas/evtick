"use client";

import { useState } from "react";
import { TicketDetailHeader } from "@/components/system/ticket-detail-header";
import { TicketTabs } from "@/components/system/ticket-tabs";
import type {
  Profile,
  SystemAuditLog,
  Ticket,
  TicketMessage,
  TicketStatusLog,
} from "@/types/database";

type Tab = "general" | "chat" | "history" | "activity";

interface TicketDetailShellProps {
  ticket: Ticket;
  profile: Profile;
  assignableProfiles: Profile[];
  messages: TicketMessage[];
  statusLogs: TicketStatusLog[];
  auditLogs: (SystemAuditLog & { action_label: string; href?: string })[];
}

export function TicketDetailShell({
  ticket,
  profile,
  assignableProfiles,
  messages,
  statusLogs,
  auditLogs,
}: TicketDetailShellProps) {
  const [tab, setTab] = useState<Tab>("general");

  return (
    <div className="space-y-6">
      <TicketDetailHeader
        ticket={ticket}
        messageCount={messages.length}
        statusLogCount={statusLogs.length}
        onTabChange={(t) => setTab(t as Tab)}
      />
      <TicketTabs
        ticket={ticket}
        profile={profile}
        assignableProfiles={assignableProfiles}
        messages={messages}
        statusLogs={statusLogs}
        auditLogs={auditLogs}
        initialTab={tab}
        onTabChange={setTab}
      />
    </div>
  );
}
