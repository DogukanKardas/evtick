import Link from "next/link";
import {
  PlusCircle,
  Users,
  Ticket,
  Shield,
  ScrollText,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const actions = [
  { href: "/system/companies/new", label: "Yeni Şirket", icon: PlusCircle },
  { href: "/system/users", label: "Kullanıcılar", icon: Users },
  { href: "/system/tickets", label: "Talepler", icon: Ticket },
  { href: "/system/admins", label: "Yönetici Davet", icon: Shield },
  { href: "/system/audit", label: "Denetim", icon: ScrollText },
];

export function DashboardQuickActions() {
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "min-h-9")}
        >
          <Icon className="mr-1.5 h-4 w-4" />
          {label}
        </Link>
      ))}
    </div>
  );
}
