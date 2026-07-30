"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  assignPlatformTicketAction,
  updatePlatformTicketAction,
} from "@/lib/system/ticket-actions";
import type { Profile, Ticket, TicketPriority, TicketStatus } from "@/types/database";

interface SystemTicketStatusActionsProps {
  ticket: Ticket;
  profile: Profile;
  assignableProfiles: Profile[];
}

export function SystemTicketStatusActions({
  ticket,
  profile,
  assignableProfiles,
}: SystemTicketStatusActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleStatus(status: TicketStatus) {
    startTransition(async () => {
      const result = await updatePlatformTicketAction(ticket.id, { status });
      if (result.error) toast.error(result.error);
      else {
        toast.success("Durum güncellendi");
        router.refresh();
      }
    });
  }

  function handleAssign() {
    startTransition(async () => {
      const result = await assignPlatformTicketAction(ticket.id);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Talep üstlenildi");
        router.refresh();
      }
    });
  }

  function handlePriority(priority: TicketPriority) {
    startTransition(async () => {
      const result = await updatePlatformTicketAction(ticket.id, { priority });
      if (result.error) toast.error(result.error);
      else {
        toast.success("Öncelik güncellendi");
        router.refresh();
      }
    });
  }

  function handleAssignTo(userId: string) {
    startTransition(async () => {
      const result = await updatePlatformTicketAction(ticket.id, {
        assignedTo: userId || null,
        status: userId && ticket.status === "open" ? "in_progress" : undefined,
      });
      if (result.error) toast.error(result.error);
      else {
        toast.success("Atama güncellendi");
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Öncelik:</span>
          <select
            value={ticket.priority}
            disabled={pending}
            onChange={(e) =>
              handlePriority(e.target.value as TicketPriority)
            }
            className="min-h-9 rounded-md border bg-background px-2 text-sm"
          >
            <option value="low">Düşük</option>
            <option value="medium">Orta</option>
            <option value="high">Yüksek</option>
            <option value="urgent">Acil</option>
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Atanan:</span>
          <select
            value={ticket.assigned_to ?? ""}
            disabled={pending}
            onChange={(e) => handleAssignTo(e.target.value)}
            className="min-h-9 rounded-md border bg-background px-2 text-sm"
          >
            <option value="">Atanmamış</option>
            {assignableProfiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name}
              </option>
            ))}
          </select>
        </label>
      </div>

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
            onClick={() => handleAssignTo(profile.id)}
            disabled={pending}
          >
            Bana Ata
          </Button>
        )}
      </div>
    </div>
  );
}
