"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  assignPlatformTicketAction,
  updatePlatformTicketAction,
} from "@/lib/system/ticket-actions";
import type { Profile, Ticket, TicketStatus } from "@/types/database";

interface SystemTicketStatusActionsProps {
  ticket: Ticket;
  profile: Profile;
}

export function SystemTicketStatusActions({
  ticket,
  profile,
}: SystemTicketStatusActionsProps) {
  const [pending, startTransition] = useTransition();

  function handleStatus(status: TicketStatus) {
    startTransition(async () => {
      await updatePlatformTicketAction(ticket.id, { status });
    });
  }

  function handleAssign() {
    startTransition(async () => {
      await assignPlatformTicketAction(ticket.id);
    });
  }

  if (ticket.status === "closed") {
    return (
      <p className="text-sm text-muted-foreground">Bu talep kapatılmıştır.</p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {ticket.status === "open" && (
        <Button size="sm" onClick={handleAssign} disabled={pending}>
          Üstlen
        </Button>
      )}

      {ticket.status === "in_progress" && (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => handleStatus("resolved")}
          disabled={pending}
        >
          Çözüldü
        </Button>
      )}

      {ticket.status === "open" && (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => handleStatus("in_progress")}
          disabled={pending}
        >
          İşleme Al
        </Button>
      )}

      <Button
        size="sm"
        variant="outline"
        onClick={() => handleStatus("closed")}
        disabled={pending}
      >
        Kapat
      </Button>

      {(ticket.status === "open" || ticket.status === "in_progress") && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleStatus("resolved")}
          disabled={pending}
        >
          Çözüldü Olarak İşaretle
        </Button>
      )}

      {!ticket.assigned_to && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() =>
            startTransition(async () => {
              await updatePlatformTicketAction(ticket.id, {
                assignedTo: profile.id,
                status: "in_progress",
              });
            })
          }
          disabled={pending}
        >
          Bana Ata
        </Button>
      )}
    </div>
  );
}
