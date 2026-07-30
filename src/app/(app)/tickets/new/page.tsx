import Link from "next/link";
import { requireAuth } from "@/lib/auth/get-profile";
import { NewTicketShell } from "@/components/tickets/new-ticket-shell";

export default async function NewTicketPage() {
  await requireAuth();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <nav className="text-sm text-muted-foreground">
        <Link href="/dashboard" className="hover:underline">
          Panel
        </Link>
        <span className="mx-2">/</span>
        <Link href="/tickets" className="hover:underline">
          Talepler
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">Yeni Talep</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold">Yeni Talep</h1>
        <p className="text-sm text-muted-foreground">
          IT destek ekibine yeni bir talep oluşturun
        </p>
      </div>

      <NewTicketShell />
    </div>
  );
}
