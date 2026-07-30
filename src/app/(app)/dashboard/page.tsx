import { redirect } from "next/navigation";
import { PlusCircle } from "lucide-react";
import { requireAuth } from "@/lib/auth/get-profile";
import { LinkButton } from "@/components/ui/link-button";
import { isSuperAdmin } from "@/lib/auth/roles";
import { EmployeeDashboardContentWithSuspense } from "@/components/employee/employee-dashboard-sections";

export default async function DashboardPage() {
  const profile = await requireAuth();
  if (isSuperAdmin(profile)) redirect("/system");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Panel</h1>
          <p className="text-sm text-muted-foreground">
            Hoş geldiniz, {profile.full_name}
          </p>
        </div>
        <LinkButton href="/tickets/new" className="min-h-11">
          <PlusCircle className="mr-2 h-4 w-4" />
          Yeni Talep
        </LinkButton>
      </div>

      <EmployeeDashboardContentWithSuspense />
    </div>
  );
}
