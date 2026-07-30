import { requireAuth } from "@/lib/auth/get-profile";
import { TicketForm } from "@/components/tickets/ticket-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function NewTicketPage() {
  await requireAuth();

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-2xl font-bold">Yeni Talep</h1>
      <Card>
        <CardHeader>
          <CardTitle>IT Destek Talebi</CardTitle>
          <CardDescription>
            Sorununuzu detaylı açıklayın, destek ekibimiz en kısa sürede
            yanıt verecektir.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TicketForm />
        </CardContent>
      </Card>
    </div>
  );
}
