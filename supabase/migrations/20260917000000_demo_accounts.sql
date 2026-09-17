-- Demo accounts used by the signin page "one-click login" buttons.
-- WARNING (demo only): password_plain stores demo credentials in clear text so
-- unauthenticated visitors can log in as client1 / agent1 / admin.
-- These are throwaway demo accounts (nightly db reset)

CREATE TABLE public.demo_accounts (
  id             uuid        DEFAULT gen_random_uuid() NOT NULL,
  label          text        NOT NULL UNIQUE,
  email          text        NOT NULL UNIQUE,
  password_plain text        NOT NULL,
  role           public.roles NOT NULL,
  created_at     timestamptz DEFAULT now() NOT NULL,
  CHECK (length(label) <= 50),
  CHECK (length(email) <= 50)
);
COMMENT ON TABLE public.demo_accounts IS 'Demo login accounts (clear-text passwords, demo only)';
ALTER TABLE public.demo_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demo_accounts ADD CONSTRAINT demo_accounts_pkey PRIMARY KEY (id);

-- The signin page is public, so demo credentials must be readable pre-auth.
CREATE POLICY "Anyone can view demo accounts" ON public.demo_accounts
  FOR SELECT
  TO anon, authenticated
  USING (true);

GRANT SELECT ON public.demo_accounts TO anon, authenticated;
GRANT ALL ON public.demo_accounts TO service_role;

INSERT INTO public.demo_accounts (label, email, password_plain, role)
VALUES
  ('client1', 'client1@example.com', 'P@ssw0rd12345!', 'client'::public.roles),
  ('agent1', 'agent1@example.com', 'P@ssw0rd12345!', 'agent'::public.roles),
  ('admin', 'admin@example.com', 'P@ssw0rd12345!', 'admin'::public.roles)
ON CONFLICT (label) DO UPDATE
SET email = EXCLUDED.email,
    password_plain = EXCLUDED.password_plain,
    role = EXCLUDED.role;
