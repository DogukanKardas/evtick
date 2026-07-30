import { requireSuperAdmin } from "@/lib/auth/get-profile";
import { SystemSidebar, SystemBreadcrumb } from "@/components/system/system-sidebar";

export default async function SystemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSuperAdmin();

  return (
    <div data-system-panel className="-mx-4 flex min-h-[calc(100vh-8rem)] md:-mx-0">
      <SystemSidebar />
      <div className="min-w-0 flex-1 px-4 md:max-w-none md:px-6">
        <SystemBreadcrumb />
        {children}
      </div>
    </div>
  );
}
