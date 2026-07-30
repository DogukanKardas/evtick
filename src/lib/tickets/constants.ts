import type { TicketPriority } from "@/types/database";

export const TICKET_CATEGORIES = [
  {
    value: "Donanım",
    label: "Donanım",
    hint: "Bilgisayar, monitör, yazıcı, klavye",
  },
  {
    value: "Yazılım",
    label: "Yazılım",
    hint: "Program kurulumu, lisans, hata",
  },
  {
    value: "Ağ",
    label: "Ağ",
    hint: "İnternet, VPN, Wi-Fi bağlantısı",
  },
  {
    value: "E-posta",
    label: "E-posta",
    hint: "Outlook, hesap erişimi, spam",
  },
  {
    value: "Genel",
    label: "Genel",
    hint: "Diğer IT destek konuları",
  },
  {
    value: "other",
    label: "Diğer",
    hint: "Listede olmayan özel kategori",
  },
] as const;

export const TICKET_CATEGORY_FILTER_VALUES = [
  "Donanım",
  "Yazılım",
  "Ağ",
  "E-posta",
  "Genel",
  "genel",
];

export const TICKET_PRIORITIES: {
  value: TicketPriority;
  label: string;
  description: string;
  colorClass: string;
  borderClass: string;
}[] = [
  {
    value: "low",
    label: "Düşük",
    description: "Acil değil, uygun zamanda",
    colorClass: "text-muted-foreground",
    borderClass: "border-muted-foreground/30",
  },
  {
    value: "medium",
    label: "Orta",
    description: "Normal iş akışını etkiliyor",
    colorClass: "text-foreground",
    borderClass: "border-foreground/30",
  },
  {
    value: "high",
    label: "Yüksek",
    description: "Önemli, hızlı müdahale gerekli",
    colorClass: "text-orange-600",
    borderClass: "border-orange-500/50",
  },
  {
    value: "urgent",
    label: "Acil",
    description: "İş durdurucu, anında müdahale",
    colorClass: "text-red-600",
    borderClass: "border-red-500/50",
  },
];

export const TITLE_MIN = 5;
export const TITLE_MAX = 120;
export const DESCRIPTION_MIN = 20;
export const DESCRIPTION_MAX = 2000;

export const VALID_PRIORITIES: TicketPriority[] = [
  "low",
  "medium",
  "high",
  "urgent",
];

export function resolveTicketCategory(
  categoryRaw: string,
  categoryCustom?: string
): string {
  if (categoryRaw === "other") {
    return categoryCustom?.trim() || "";
  }
  return categoryRaw;
}

export function isValidTicketCategory(category: string): boolean {
  if (!category.trim()) return false;
  const preset = TICKET_CATEGORIES.find((c) => c.value === category);
  if (preset && preset.value !== "other") return true;
  return category.length >= 2;
}
