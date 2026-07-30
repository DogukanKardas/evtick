-- Fix auth trigger: validate metadata before profile insert

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

  INSERT INTO public.profiles (user_id, company_id, role, full_name)
  VALUES (NEW.id, v_company_id, v_role, v_full_name)
  ON CONFLICT (user_id) DO UPDATE
    SET
      company_id = EXCLUDED.company_id,
      full_name = EXCLUDED.full_name;

  RETURN NEW;
END;
$$;
