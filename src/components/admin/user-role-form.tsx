"use client";

import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateUserRoleAction } from "@/lib/tickets/actions";
import type { UserRole } from "@/types/database";

const roleLabels: Record<UserRole, string> = {
  employee: "Çalışan",
  support: "IT Destek",
  admin: "Yönetici",
};

interface UserRoleFormProps {
  userId: string;
  currentRole: UserRole;
}

export function UserRoleForm({ userId, currentRole }: UserRoleFormProps) {
  const [pending, startTransition] = useTransition();

  function handleChange(role: UserRole) {
    startTransition(async () => {
      await updateUserRoleAction(userId, role);
    });
  }

  return (
    <Select
      defaultValue={currentRole}
      onValueChange={(v) => handleChange(v as UserRole)}
      disabled={pending}
    >
      <SelectTrigger className="min-h-10 w-36">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {(Object.keys(roleLabels) as UserRole[]).map((role) => (
          <SelectItem key={role} value={role}>
            {roleLabels[role]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
