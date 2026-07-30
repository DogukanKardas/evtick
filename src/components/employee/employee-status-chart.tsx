import { TicketStatusChart } from "@/components/system/ticket-status-chart";
import type { TicketStatusCount } from "@/types/database";

export function EmployeeStatusChart({ data }: { data: TicketStatusCount[] }) {
  return <TicketStatusChart data={data} />;
}
