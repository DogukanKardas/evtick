import {
  TicketsKpiSectionWithSuspense,
  TicketsTableSectionWithSuspense,
} from "@/components/system/tickets-sections";

export default function SystemTicketsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Talepler</h1>
        <p className="text-sm text-muted-foreground">
          Platform geneli talep kuyruğu
        </p>
      </div>

      <TicketsKpiSectionWithSuspense />
      <TicketsTableSectionWithSuspense />
    </div>
  );
}
