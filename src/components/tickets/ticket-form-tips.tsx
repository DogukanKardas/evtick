import { AlertCircle, Clock, Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TicketFormTips() {
  const tips = [
    "Başlığı kısa ve net yazın (ör. “Monitör açılmıyor”).",
    "Açıklamada ne olduğunu, ne zaman başladığını ve denediğiniz adımları belirtin.",
    "Doğru kategori seçimi talebinizin daha hızlı yönlendirilmesini sağlar.",
    "Acil önceliği yalnızca işi tamamen durduran durumlar için kullanın.",
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Lightbulb className="h-4 w-4" />
          İpuçları
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2 text-sm text-muted-foreground">
          {tips.map((tip) => (
            <li key={tip} className="flex gap-2">
              <span className="text-primary">•</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>

        <div className="flex gap-2 rounded-lg border bg-muted/30 p-3 text-sm">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <p className="text-muted-foreground">
            Normal talepler genellikle 1 iş günü içinde yanıtlanır. Acil
            talepler önceliklendirilir.
          </p>
        </div>

        <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Acil öncelik yalnızca iş durdurucu sorunlar içindir. Yanlış
            kullanım gecikmelere yol açabilir.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
