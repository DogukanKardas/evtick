-- Step 2: System admin schema, functions, and RLS
-- Run AFTER 003_add_super_admin_enum.sql has committed successfully

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.profiles(id);

-- Platform company for super admins
INSERT INTO public.companies (code, name, is_active)
VALUES ('EVTK', 'EvTick Platform', true)
ON CONFLICT (code) DO NOTHING;

-- Super admin helper (text cast avoids enum commit edge cases)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
    AND role::text = 'super_admin'
  );
$$;

-- Only return active companies for registration/login lookup
CREATE OR REPLACE FUNCTION public.get_company_by_code(p_code text)
RETURNS TABLE (id uuid, name text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.name
  FROM public.companies c
  WHERE UPPER(c.code) = UPPER(TRIM(p_code))
  AND c.is_active = true
  LIMIT 1;
$$;

-- Auto-generate unique company code from name
CREATE OR REPLACE FUNCTION public.generate_company_code(p_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_slug text;
  v_code text;
  v_attempts int := 0;
BEGIN
  v_slug := upper(
    regexp_replace(
      substring(coalesce(trim(p_name), 'ORG') from 1 for 8),
      '[^a-zA-Z0-9]',
      '',
      'g'
    )
  );

  IF v_slug IS NULL OR length(v_slug) < 2 THEN
    v_slug := 'ORG';
  END IF;

  LOOP
    v_code := v_slug || '-' || upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 4));
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.companies WHERE upper(code) = upper(v_code)
    );
    v_attempts := v_attempts + 1;
    IF v_attempts > 20 THEN
      RAISE EXCEPTION 'Benzersiz şirket kodu üretilemedi';
    END IF;
  END LOOP;

  RETURN v_code;
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_company_code(text) TO authenticated;

-- Super admin RLS policies (idempotent)
DROP POLICY IF EXISTS "Super admin read all companies" ON public.companies;
DROP POLICY IF EXISTS "Super admin insert companies" ON public.companies;
DROP POLICY IF EXISTS "Super admin update companies" ON public.companies;
DROP POLICY IF EXISTS "Super admin read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admin read all tickets" ON public.tickets;

CREATE POLICY "Super admin read all companies"
  ON public.companies FOR SELECT
  TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "Super admin insert companies"
  ON public.companies FOR INSERT
  TO authenticated
  WITH CHECK (public.is_super_admin());

CREATE POLICY "Super admin update companies"
  ON public.companies FOR UPDATE
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "Super admin read all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_super_admin());

CREATE POLICY "Super admin read all tickets"
  ON public.tickets FOR SELECT
  TO authenticated
  USING (public.is_super_admin());
