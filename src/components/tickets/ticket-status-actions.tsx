"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  assignTicketAction,
  updateTicketStatusAction,
} from "@/lib/tickets/actions";
import type { Profile, Ticket, TicketStatus } from "@/types/database";
import { isSupportOrAdmin } from "@/lib/auth/roles";

interface TicketStatusActionsProps {
  ticket: Ticket;
  profile: Profile;
}

export function TicketStatusActions({ ticket, profile }: TicketStatusActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const isStaff = isSupportOrAdmin(profile);
  const isOwner = ticket.created_by === profile.id;

  function handleStatus(status: TicketStatus) {
    startTransition(async () => {
      const result = await updateTicketStatusAction(ticket.id, status);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Durum güncellendi");
        router.refresh();
      }
    });
  }

  function handleAssign() {
    startTransition(async () => {
      const result = await assignTicketAction(ticket.id);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Talep üstlenildi");
        router.refresh();
      }
    });
  }

  if (ticket.status === "closed") {
    return (
      <p className="text-sm text-muted-foreground">Bu talep kapatılmıştır.</p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {isStaff && ticket.status === "open" && (
        <Button
          size="sm"
          onClick={handleAssign}
          disabled={pending}
          className="min-h-10"
        >
          Üstlen
        </Button>
      )}

      {isStaff && ticket.status === "in_progress" && (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => handleStatus("resolved")}
          disabled={pending}
          className="min-h-10"
        >
          Çözüldü
        </Button>
      )}

      {(isStaff || isOwner) && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleStatus("closed")}
          disabled={pending}
          className="min-h-10"
        >
          Kapat
        </Button>
      )}

      {isOwner && ticket.status === "open" && (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => handleStatus("resolved")}
          disabled={pending}
          className="min-h-10"
        >
          Çözüldü Olarak İşaretle
        </Button>
      )}
    </div>
  );
}
