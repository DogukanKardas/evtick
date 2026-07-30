export { getSiteUrl } from "@/lib/supabase/env";

import { getSiteUrl } from "@/lib/supabase/env";

export function getAuthCallbackUrl(): string {
  return `${getSiteUrl()}/auth/callback`;
}
