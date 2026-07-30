-- Super admin access to ticket messages and status logs across companies

DROP POLICY IF EXISTS "Super admin read ticket messages" ON public.ticket_messages;
DROP POLICY IF EXISTS "Super admin send ticket messages" ON public.ticket_messages;
DROP POLICY IF EXISTS "Super admin read ticket status logs" ON public.ticket_status_logs;

CREATE POLICY "Super admin read ticket messages"
  ON public.ticket_messages FOR SELECT
  TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "Super admin send ticket messages"
  ON public.ticket_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_super_admin()
    AND sender_id = public.current_profile_id()
    AND EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.id = ticket_id
      AND t.status <> 'closed'
    )
  );

CREATE POLICY "Super admin read ticket status logs"
  ON public.ticket_status_logs FOR SELECT
  TO authenticated
  USING (public.is_super_admin());
