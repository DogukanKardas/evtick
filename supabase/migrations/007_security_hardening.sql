-- Security hardening: signup role allowlist, admin role constraints, RPC lockdown

-- Signup always creates employee; never trust metadata role on conflict upsert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id uuid;
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

  INSERT INTO public.profiles (user_id, company_id, role, full_name, email)
  VALUES (NEW.id, v_company_id, 'employee'::public.user_role, v_full_name, NEW.email)
  ON CONFLICT (user_id) DO UPDATE
    SET
      company_id = EXCLUDED.company_id,
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email;

  RETURN NEW;
END;
$$;

-- Restrict company code generation to super admins
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
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Bu işlem için yetkiniz yok';
  END IF;

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

REVOKE ALL ON FUNCTION public.generate_company_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_company_code(text) TO authenticated;

-- Company admins cannot assign super_admin via RLS
DROP POLICY IF EXISTS "Admins update company profiles" ON public.profiles;

CREATE POLICY "Admins update company profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    company_id = public.current_company_id()
    AND public.current_user_role() = 'admin'
    AND role <> 'super_admin'
  )
  WITH CHECK (
    company_id = public.current_company_id()
    AND public.current_user_role() = 'admin'
    AND role IN ('employee', 'support', 'admin')
  );
