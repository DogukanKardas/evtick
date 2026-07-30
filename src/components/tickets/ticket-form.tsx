"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LinkButton } from "@/components/ui/link-button";
import {
  getCategoryDisplayLabel,
  TicketCategoryPicker,
} from "@/components/tickets/ticket-category-picker";
import {
  getPriorityDisplayLabel,
  TicketPriorityPicker,
} from "@/components/tickets/ticket-priority-picker";
import { createTicketAction } from "@/lib/tickets/actions";
import {
  DESCRIPTION_MAX,
  DESCRIPTION_MIN,
  TITLE_MAX,
  TITLE_MIN,
} from "@/lib/tickets/constants";
import type { TicketPriority } from "@/types/database";

interface TicketFormProps {
  onPreviewChange?: (preview: {
    title: string;
    description: string;
    categoryLabel: string;
    priority: TicketPriority;
  }) => void;
}

export function TicketForm({ onPreviewChange }: TicketFormProps) {
  const [state, action, pending] = useActionState(createTicketAction, null);
  const [category, setCategory] = useState("Genel");
  const [categoryCustom, setCategoryCustom] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("medium");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const categoryLabel = getCategoryDisplayLabel(category, categoryCustom);
  const priorityLabel = getPriorityDisplayLabel(priority);

  useEffect(() => {
    if (state?.error) toast.error(state.error);
  }, [state]);

  useEffect(() => {
    onPreviewChange?.({
      title,
      description,
      categoryLabel,
      priority,
    });
  }, [title, description, categoryLabel, priority, onPreviewChange]);

  const titleError = useMemo(() => {
    if (!title.trim()) return null;
    if (title.trim().length < TITLE_MIN) {
      return `En az ${TITLE_MIN} karakter`;
    }
    if (title.length > TITLE_MAX) {
      return `En fazla ${TITLE_MAX} karakter`;
    }
    return null;
  }, [title]);

  const descriptionError = useMemo(() => {
    if (!description.trim()) return null;
    if (description.trim().length < DESCRIPTION_MIN) {
      return `En az ${DESCRIPTION_MIN} karakter`;
    }
    if (description.length > DESCRIPTION_MAX) {
      return `En fazla ${DESCRIPTION_MAX} karakter`;
    }
    return null;
  }, [description]);

  const categoryCustomError =
    category === "other" && !categoryCustom.trim()
      ? "Özel kategori adı gerekli"
      : undefined;

  const isValid =
    title.trim().length >= TITLE_MIN &&
    title.length <= TITLE_MAX &&
    description.trim().length >= DESCRIPTION_MIN &&
    description.length <= DESCRIPTION_MAX &&
    (category !== "other" || categoryCustom.trim().length >= 2);

  return (
    <form action={action} className="space-y-8">
      <section className="space-y-4">
        <h3 className="text-sm font-semibold">Temel Bilgiler</h3>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="title">Başlık</Label>
            <span className="text-xs text-muted-foreground">
              {title.length}/{TITLE_MAX}
            </span>
          </div>
          <Input
            id="title"
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Örn: Monitör açılmıyor"
            required
            maxLength={TITLE_MAX}
            className="min-h-11"
          />
          {titleError && (
            <p className="text-sm text-destructive">{titleError}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Kategori</Label>
          <TicketCategoryPicker
            value={category}
            customValue={categoryCustom}
            onChange={setCategory}
            onCustomChange={setCategoryCustom}
            customError={categoryCustomError}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold">Öncelik</h3>
        <p className="text-sm text-muted-foreground">
          Seçili: <span className="font-medium">{priorityLabel}</span>
        </p>
        <TicketPriorityPicker value={priority} onChange={setPriority} />
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold">Detay</h3>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="description">Açıklama</Label>
            <span className="text-xs text-muted-foreground">
              {description.length}/{DESCRIPTION_MAX}
            </span>
          </div>
          <Textarea
            id="description"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Sorununuzu detaylı açıklayın: ne oldu, ne zaman başladı, hangi adımları denediniz?"
            rows={6}
            required
            maxLength={DESCRIPTION_MAX}
          />
          {descriptionError && (
            <p className="text-sm text-destructive">{descriptionError}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Minimum {DESCRIPTION_MIN} karakter
          </p>
        </div>
      </section>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="submit"
          disabled={pending || !isValid}
          className="min-h-11 flex-1"
        >
          {pending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Gönderiliyor...
            </>
          ) : (
            "Talep Oluştur"
          )}
        </Button>
        <LinkButton
          href="/tickets"
          variant="outline"
          className="min-h-11 sm:flex-initial"
        >
          İptal
        </LinkButton>
      </div>
    </form>
  );
}
