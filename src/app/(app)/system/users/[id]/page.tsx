import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { getPlatformUserById } from "@/lib/system/user-actions";
import { ROLE_LABELS, type UserRole } from "@/types/database";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface UserDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function SystemUserDetailPage({
  params,
}: UserDetailPageProps) {
  const { id } = await params;
  const user = await getPlatformUserById(id);

  if (!user) notFound();

  const company = user.company as { id: string; name: string } | undefined;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{user.full_name}</h1>
        <p className="text-muted-foreground">{user.email}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Rol: </span>
            {ROLE_LABELS[user.role as UserRole]}
          </p>
          <p>
            <span className="text-muted-foreground">Şirket: </span>
            {company ? (
              <Link
                href={`/system/companies/${company.id}`}
                className="text-primary hover:underline"
              >
                {company.name}
              </Link>
            ) : (
              "—"
            )}
          </p>
          <p>
            <span className="text-muted-foreground">Kayıt: </span>
            {format(new Date(user.created_at), "d MMMM yyyy", { locale: tr })}
          </p>
          <p>
            <span className="text-muted-foreground">Açılan talep: </span>
            {user.ticket_count ?? 0}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
