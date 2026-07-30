"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTicketAction } from "@/lib/tickets/actions";

export function TicketForm() {
  const [state, action, pending] = useActionState(createTicketAction, null);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Başlık</Label>
        <Input
          id="title"
          name="title"
          placeholder="Talep başlığı"
          required
          className="min-h-11"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Kategori</Label>
        <Input
          id="category"
          name="category"
          placeholder="ör. Donanım, Yazılım, Ağ"
          defaultValue="genel"
          className="min-h-11"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="priority">Öncelik</Label>
        <Select name="priority" defaultValue="medium">
          <SelectTrigger className="min-h-11">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Düşük</SelectItem>
            <SelectItem value="medium">Orta</SelectItem>
            <SelectItem value="high">Yüksek</SelectItem>
            <SelectItem value="urgent">Acil</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Açıklama</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Sorununuzu detaylı açıklayın..."
          rows={5}
          required
        />
      </div>

      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <Button type="submit" disabled={pending} className="min-h-11 w-full">
        {pending ? "Gönderiliyor..." : "Talep Oluştur"}
      </Button>
    </form>
  );
}
