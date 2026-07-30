-- Performance indexes and aggregated company stats RPC

CREATE INDEX IF NOT EXISTS tickets_created_at_idx ON public.tickets (created_at DESC);
CREATE INDEX IF NOT EXISTS tickets_priority_idx ON public.tickets (priority);
CREATE INDEX IF NOT EXISTS tickets_assigned_to_idx ON public.tickets (assigned_to);
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles (role);

CREATE OR REPLACE FUNCTION public.get_company_stats_agg()
RETURNS TABLE (
  company_id uuid,
  user_count bigint,
  ticket_count bigint,
  open_tickets bigint,
  last_ticket_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_super_admin() THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    c.id AS company_id,
    COUNT(DISTINCT p.id)::bigint AS user_count,
    COUNT(DISTINCT t.id)::bigint AS ticket_count,
    COUNT(DISTINCT t.id) FILTER (
      WHERE t.status IN ('open', 'in_progress')
    )::bigint AS open_tickets,
    MAX(t.created_at) AS last_ticket_at
  FROM public.companies c
  LEFT JOIN public.profiles p ON p.company_id = c.id
  LEFT JOIN public.tickets t ON t.company_id = c.id
  GROUP BY c.id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_company_stats_agg() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_company_stats_agg() TO authenticated;
