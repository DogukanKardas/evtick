-- EvTick initial schema

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE public.user_role AS ENUM ('employee', 'support', 'admin');
CREATE TYPE public.ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE public.ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Companies
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX companies_code_idx ON public.companies (UPPER(code));

-- Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  role public.user_role NOT NULL DEFAULT 'employee',
  full_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX profiles_company_id_idx ON public.profiles (company_id);
CREATE INDEX profiles_user_id_idx ON public.profiles (user_id);

-- Tickets
CREATE TABLE public.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  status public.ticket_status NOT NULL DEFAULT 'open',
  priority public.ticket_priority NOT NULL DEFAULT 'medium',
  category text NOT NULL DEFAULT 'genel',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz
);

CREATE INDEX tickets_company_id_idx ON public.tickets (company_id);
CREATE INDEX tickets_created_by_idx ON public.tickets (created_by);
CREATE INDEX tickets_status_idx ON public.tickets (status);

-- Ticket messages
CREATE TABLE public.ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ticket_messages_ticket_id_idx ON public.ticket_messages (ticket_id);

-- Ticket status logs
CREATE TABLE public.ticket_status_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  changed_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  old_status public.ticket_status,
  new_status public.ticket_status NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ticket_status_logs_ticket_id_idx ON public.ticket_status_logs (ticket_id);

-- Helper functions for RLS
CREATE OR REPLACE FUNCTION public.current_profile_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_support_or_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
    AND role IN ('support', 'admin')
  );
$$;

-- Public company lookup for registration
CREATE OR REPLACE FUNCTION public.get_company_by_code(p_code text)
RETURNS TABLE (id uuid, name text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.name
  FROM public.companies c
  WHERE UPPER(c.code) = UPPER(TRIM(p_code))
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_company_by_code(text) TO anon, authenticated;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, company_id, role, full_name)
  VALUES (
    NEW.id,
    (NEW.raw_user_meta_data->>'company_id')::uuid,
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'employee'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ticket updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Ticket status log trigger
CREATE OR REPLACE FUNCTION public.log_ticket_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.ticket_status_logs (ticket_id, changed_by, old_status, new_status)
    VALUES (NEW.id, public.current_profile_id(), OLD.status, NEW.status);

    IF NEW.status = 'closed' AND NEW.closed_at IS NULL THEN
      NEW.closed_at = now();
    ELSIF NEW.status <> 'closed' THEN
      NEW.closed_at = NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER tickets_status_log
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.log_ticket_status_change();

-- Enable RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_status_logs ENABLE ROW LEVEL SECURITY;

-- Companies policies
CREATE POLICY "Users read own company"
  ON public.companies FOR SELECT
  TO authenticated
  USING (id = public.current_company_id());

-- Profiles policies
CREATE POLICY "Users read company profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (company_id = public.current_company_id());

CREATE POLICY "Admins update company profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    company_id = public.current_company_id()
    AND public.current_user_role() = 'admin'
  )
  WITH CHECK (
    company_id = public.current_company_id()
    AND public.current_user_role() = 'admin'
  );

-- Tickets policies
CREATE POLICY "Employees read own tickets"
  ON public.tickets FOR SELECT
  TO authenticated
  USING (
    company_id = public.current_company_id()
    AND (
      public.is_support_or_admin()
      OR created_by = public.current_profile_id()
    )
  );

CREATE POLICY "Employees create tickets"
  ON public.tickets FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id = public.current_company_id()
    AND created_by = public.current_profile_id()
  );

CREATE POLICY "Support updates company tickets"
  ON public.tickets FOR UPDATE
  TO authenticated
  USING (
    company_id = public.current_company_id()
    AND public.is_support_or_admin()
  )
  WITH CHECK (
    company_id = public.current_company_id()
  );

CREATE POLICY "Employees close own open tickets"
  ON public.tickets FOR UPDATE
  TO authenticated
  USING (
    company_id = public.current_company_id()
    AND created_by = public.current_profile_id()
    AND status IN ('open', 'resolved')
  )
  WITH CHECK (
    company_id = public.current_company_id()
    AND created_by = public.current_profile_id()
  );

-- Ticket messages policies
CREATE POLICY "Read ticket messages"
  ON public.ticket_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.id = ticket_id
      AND t.company_id = public.current_company_id()
      AND (
        public.is_support_or_admin()
        OR t.created_by = public.current_profile_id()
      )
    )
  );

CREATE POLICY "Send ticket messages"
  ON public.ticket_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = public.current_profile_id()
    AND EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.id = ticket_id
      AND t.company_id = public.current_company_id()
      AND t.status <> 'closed'
      AND (
        public.is_support_or_admin()
        OR t.created_by = public.current_profile_id()
      )
    )
  );

-- Status logs policies
CREATE POLICY "Read ticket status logs"
  ON public.ticket_status_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.id = ticket_id
      AND t.company_id = public.current_company_id()
      AND (
        public.is_support_or_admin()
        OR t.created_by = public.current_profile_id()
      )
    )
  );

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_messages;

-- Seed data
INSERT INTO public.companies (code, name)
VALUES ('DEMO01', 'Demo Şirket');
