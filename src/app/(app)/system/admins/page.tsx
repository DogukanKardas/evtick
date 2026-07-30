import { getSuperAdmins } from "@/lib/system/admin-actions";
import { getPlatformUsers } from "@/lib/system/user-actions";
import { AdminsPanel } from "@/components/system/admins-form";

export default async function SystemAdminsPage() {
  const [admins, allUsers] = await Promise.all([
    getSuperAdmins(),
    getPlatformUsers(),
  ]);

  const adminIds = new Set(admins.map((a) => a.id));
  const promotableUsers = allUsers.filter(
    (u) => !adminIds.has(u.id) && u.role !== "super_admin"
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Sistem Yöneticileri</h1>
        <p className="text-sm text-muted-foreground">
          Super admin listesi, davet ve yükseltme
        </p>
      </div>

      <AdminsPanel admins={admins} promotableUsers={promotableUsers} />
    </div>
  );
}
