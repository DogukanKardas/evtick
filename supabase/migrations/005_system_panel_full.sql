-- Full system panel: email sync, company meta, audit logs, extended RLS

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text;

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS notes text;

CREATE TABLE IF NOT EXISTS public.system_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS system_audit_logs_created_at_idx
  ON public.system_audit_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS system_audit_logs_actor_id_idx
  ON public.system_audit_logs (actor_id);

CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles (email);

-- Sync email on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id uuid;
  v_role public.user_role;
  v_full_name text;
BEGIN
  v_company_id := (NEW.raw_user_meta_data->>'company_id')::uuid;
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Kayıt için şirket kodu gerekli (company_id eksik)';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.companies WHERE id = v_company_id) THEN
    RAISE EXCEPTION 'Geçersiz şirket (company_id bulunamadı)';
  END IF;

  BEGIN
    v_role := COALESCE(
      (NEW.raw_user_meta_data->>'role')::public.user_role,
      'employee'::public.user_role
    );
  EXCEPTION WHEN others THEN
    v_role := 'employee';
  END;

  INSERT INTO public.profiles (user_id, company_id, role, full_name, email)
  VALUES (NEW.id, v_company_id, v_role, v_full_name, NEW.email)
  ON CONFLICT (user_id) DO UPDATE
    SET
      company_id = EXCLUDED.company_id,
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      role = EXCLUDED.role;

  RETURN NEW;
END;
$$;

-- Backfill emails from auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.user_id = u.id AND (p.email IS NULL OR p.email = '');

ALTER TABLE public.system_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admin read audit logs" ON public.system_audit_logs;
DROP POLICY IF EXISTS "Super admin insert audit logs" ON public.system_audit_logs;
DROP POLICY IF EXISTS "Super admin update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admin update tickets" ON public.tickets;

CREATE POLICY "Super admin read audit logs"
  ON public.system_audit_logs FOR SELECT
  TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "Super admin insert audit logs"
  ON public.system_audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (public.is_super_admin());

CREATE POLICY "Super admin update profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "Super admin update tickets"
  ON public.tickets FOR UPDATE
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());
