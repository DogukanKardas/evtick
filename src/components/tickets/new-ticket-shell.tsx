"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TicketForm } from "@/components/tickets/ticket-form";
import { TicketFormPreview } from "@/components/tickets/ticket-form-preview";
import { TicketFormTips } from "@/components/tickets/ticket-form-tips";
import type { TicketPriority } from "@/types/database";

export function NewTicketShell() {
  const [preview, setPreview] = useState({
    title: "",
    description: "",
    categoryLabel: "Genel",
    priority: "medium" as TicketPriority,
  });

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>IT Destek Talebi</CardTitle>
            <CardDescription>
              Sorununuzu detaylı açıklayın; destek ekibimiz en kısa sürede
              yanıt verecektir.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TicketForm onPreviewChange={setPreview} />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4 lg:col-span-1">
        <TicketFormPreview
          title={preview.title}
          description={preview.description}
          categoryLabel={preview.categoryLabel}
          priority={preview.priority}
        />
        <TicketFormTips />
      </div>
    </div>
  );
}
