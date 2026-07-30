import { requireSuperAdmin } from "@/lib/auth/get-profile";
import { SystemSidebar, SystemBreadcrumb } from "@/components/system/system-sidebar";

export default async function SystemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSuperAdmin();

  return (
    <div
      data-system-panel
      className="flex min-h-[calc(100dvh-3.5rem)] w-full bg-background"
    >
      <SystemSidebar />
      <div className="min-w-0 flex-1 overflow-x-hidden px-4 py-6 md:px-6">
        <SystemBreadcrumb />
        {children}
      </div>
    </div>
  );
}
