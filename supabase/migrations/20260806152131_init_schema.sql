-- Migration unit 1: schema_changes
-- Transaction mode: transactional
-- Boundary reason: default

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE public.roles AS ENUM (
  'admin',
  'client',
  'agent'
);

COMMENT ON TYPE public.roles IS 'User roles';

CREATE TYPE public.ticket_priority AS ENUM (
  'low',
  'medium',
  'high'
);

COMMENT ON TYPE public.ticket_priority IS 'Priority of a ticket';

CREATE TYPE public.ticket_status AS ENUM (
  'open',
  'in_progress',
  'resolved',
  'closed'
);

COMMENT ON TYPE public.ticket_status IS 'Status of a ticket';


CREATE TYPE public.ticket_category AS ENUM (
  'software',
  'hardware',
  'delivery',
  'payment'
);

COMMENT ON TYPE public.ticket_category IS 'Category of a ticket';

-- Utility function for RLS


CREATE FUNCTION public.get_current_user()
RETURNS uuid
SECURITY DEFINER
LANGUAGE plpgsql
STABLE
SET search_path TO 'public'
AS $function$
DECLARE
  v_current_user_id uuid;
BEGIN

  SELECT auth.uid() INTO v_current_user_id;

  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated'
      USING ERRCODE = '28000'; -- 401 Unauthorized
  END IF;

  RETURN v_current_user_id;

END;
$function$;

REVOKE ALL ON FUNCTION public.get_current_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_current_user() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_current_user() TO authenticated;


CREATE FUNCTION public.get_role()
RETURNS text
SECURITY DEFINER
LANGUAGE plpgsql
STABLE
SET search_path TO 'public'
AS $function$
DECLARE
  v_current_user_id uuid;
  v_current_user_role text;
BEGIN

  v_current_user_id = public.get_current_user();

  SELECT role::text INTO v_current_user_role 
  FROM profiles AS p
  WHERE p.id = v_current_user_id;

  IF v_current_user_role IS NULL THEN
    RAISE EXCEPTION 'Profile % not found', v_current_user_id
      USING ERRCODE = 'P0002'; -- 404 Not Found
  END IF;

  RETURN v_current_user_role;

END;
$function$;

REVOKE ALL ON FUNCTION public.get_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_role() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_role() TO authenticated;


CREATE FUNCTION public.is_admin()
RETURNS BOOLEAN
SECURITY DEFINER
LANGUAGE plpgsql
STABLE
SET search_path TO 'public'
AS $function$
DECLARE
  v_current_user_role text;
BEGIN

  v_current_user_role = public.get_role();

  IF v_current_user_role = 'admin' THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;

END;
$function$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;


CREATE FUNCTION public.is_agent()
RETURNS BOOLEAN
SECURITY DEFINER
LANGUAGE plpgsql
STABLE
SET search_path TO 'public'
AS $function$
DECLARE
  v_current_user_role text;
BEGIN

  v_current_user_role = public.get_role();

  IF v_current_user_role = 'agent' OR v_current_user_role = 'admin' THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;

END;
$function$;

REVOKE ALL ON FUNCTION public.is_agent() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_agent() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_agent() TO authenticated;


-------------- Table definition ---------------------

CREATE TABLE public.tickets (
  id          uuid                     DEFAULT gen_random_uuid() NOT NULL,
  client_id   uuid                     NOT NULL,
  agent_id    uuid                     DEFAULT NULL,
  category    ticket_category          NOT NULL,
  status      public.ticket_status     NOT NULL DEFAULT 'open'::ticket_status,
  description text                     NOT NULL,
  priority    public.ticket_priority   NOT NULL,
  created_at  timestamp with time zone DEFAULT NOW() NOT NULL,
  closed_by   uuid                     DEFAULT NULL,
  CHECK (length(description) <= 255)
);
COMMENT ON TABLE public.tickets IS 'Ticket created by client';
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ADD CONSTRAINT tickets_pkey PRIMARY KEY (id);

grant select, insert, delete on public.tickets to authenticated;
grant all on public.tickets to service_role;

CREATE TABLE public.profiles (
  id         uuid                     DEFAULT gen_random_uuid() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  username   text UNIQUE              DEFAULT ''::text NOT NULL,
  role       roles                    DEFAULT 'client'::roles NOT NULL,
  CHECK (length(username) <= 50)
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.profiles IS 'Profile for users';
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);

grant select, insert, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;

CREATE TABLE public.messages (
  id             uuid                     DEFAULT gen_random_uuid() NOT NULL,
  created_at     timestamp with time zone DEFAULT now() NOT NULL,
  ticket_id      uuid                     NOT NULL,
  sender_id      uuid                     NOT NULL,
  content        text                     DEFAULT ''::text,
  attachment_url text                     DEFAULT NULL,
  CHECK (length(trim(content)) <= 500 AND length(trim(content)) > 0),
  CHECK (length(trim(attachment_url)) <= 500 AND length(trim(attachment_url)) > 0)
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


grant select, insert on public.messages to authenticated;
grant all on public.messages to service_role;



------- Messages --------

ALTER TABLE public.messages
  ADD CONSTRAINT messages_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE public.messages
  ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;

CREATE INDEX messages_created_at_ticket_id_idx ON public.messages (ticket_id, created_at);


------- Profiles --------
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


------- Tickets --------
ALTER TABLE public.tickets
  ADD CONSTRAINT tickets_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public.tickets
  ADD CONSTRAINT tickets_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public.tickets
  ADD CONSTRAINT tickets_closed_by_fkey FOREIGN KEY (closed_by) REFERENCES public.profiles(id) ON UPDATE CASCADE ON DELETE CASCADE;

CREATE INDEX tickets_client_id_agent_id_idx ON public.tickets (client_id, agent_id);
CREATE INDEX tickets_created_at_id_idx ON public.tickets (created_at, id);
CREATE INDEX tickets_id_agent_id_idx ON public.tickets (agent_id, id);



--------- RPC functions --------------


CREATE OR REPLACE FUNCTION public.reassign_ticket(
  p_ticket_id uuid,
  p_new_agent_id uuid
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_is_new_agent_valid boolean;
BEGIN

  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Forbidden'
      USING ERRCODE = '42501'; -- 403 Forbidden
  END IF;

  v_is_new_agent_valid := EXISTS(
    SELECT 1
    FROM public.profiles AS p
    WHERE p.id = p_new_agent_id AND p.role = 'agent'::public.roles
  );

  IF NOT v_is_new_agent_valid THEN
    RAISE EXCEPTION 'Forbidden, new agent user is not an actual agent'
      USING ERRCODE = '42501'; -- 403 Forbidden
  END IF;

  UPDATE public.tickets
  SET agent_id = p_new_agent_id
  WHERE id = p_ticket_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ticket % not found', p_ticket_id
      USING ERRCODE = 'P0002'; -- 404 Not Found
  END IF;

  RETURN TRUE;
END;
$function$;

REVOKE ALL ON FUNCTION public.reassign_ticket(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reassign_ticket(uuid, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.reassign_ticket(uuid, uuid) TO authenticated;



CREATE OR REPLACE FUNCTION public.update_role(
  p_profile_id uuid,
  p_new_role public.roles
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
BEGIN

  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Forbidden'
      USING ERRCODE = '42501'; -- 403 Forbidden
  END IF;

  UPDATE public.profiles
  SET role = p_new_role
  WHERE id = p_profile_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile % not found', p_profile_id
      USING ERRCODE = 'P0002'; -- 404 Not Found
  END IF;

  RETURN TRUE;
END;
$function$;

REVOKE ALL ON FUNCTION public.update_role(uuid, public.roles) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_role(uuid, public.roles) FROM anon;
GRANT EXECUTE ON FUNCTION public.update_role(uuid, public.roles) TO authenticated;


CREATE OR REPLACE FUNCTION public.claim_ticket(
  p_ticket_id uuid,
  p_agent_id uuid
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_is_ticket_claimed boolean;
BEGIN

  IF NOT public.is_agent() THEN
    RAISE EXCEPTION 'Forbidden'
      USING ERRCODE = '42501'; -- 403 Forbidden
  END IF;

  -- Check if the ticket already has been claimed by someone else

  v_is_ticket_claimed := EXISTS(
    SELECT 1 
    FROM public.tickets AS t 
    WHERE t.id = p_ticket_id AND t.agent_id IS NOT NULL
  );
  
  IF v_is_ticket_claimed THEN
    RAISE EXCEPTION 'Forbidden: ticket already claimed'
      USING ERRCODE = '42501'; -- 403 Forbidden
  END IF;

  UPDATE public.tickets
  SET agent_id = p_agent_id
  WHERE id = p_ticket_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ticket % not found', p_ticket_id
      USING ERRCODE = 'P0002'; -- 404 Not Found
  END IF;

  RETURN TRUE;
END;
$function$;

REVOKE ALL ON FUNCTION public.claim_ticket(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_ticket(uuid, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.claim_ticket(uuid, uuid) TO authenticated;


CREATE OR REPLACE FUNCTION public.close_ticket(
  p_ticket_id uuid
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_role        text;
  v_user_id          uuid;
  v_is_claimed_agent boolean;
BEGIN

  v_user_id   := public.get_current_user();
  v_user_role := public.get_role();

  IF v_user_role = 'client' THEN
    RAISE EXCEPTION 'Forbidden'
      USING ERRCODE = '42501'; -- 403 Forbidden
  END IF;

  -- chekc if the current agent is the assigned one
  v_is_claimed_agent := (v_user_role = 'admin') OR EXISTS (
    SELECT 1 FROM public.tickets t
    WHERE t.id = p_ticket_id AND t.agent_id = v_user_id
  );

  IF NOT v_is_claimed_agent THEN
    RAISE EXCEPTION 'Forbidden'
      USING ERRCODE = '42501'; -- 403 Forbidden
  END IF;


  UPDATE public.tickets
  SET status = 'closed'::ticket_status, closed_by = v_user_id
  WHERE id = p_ticket_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ticket % not found', p_ticket_id
      USING ERRCODE = 'P0002'; -- 404 Not Found
  END IF;

  RETURN TRUE;
END;
$function$;

REVOKE ALL ON FUNCTION public.close_ticket(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.close_ticket(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.close_ticket(uuid) TO authenticated;



CREATE OR REPLACE FUNCTION public.in_progress_ticket(
  p_ticket_id uuid
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_role        text;
  v_user_id          uuid;
  v_is_claimed_agent boolean;
BEGIN

  v_user_id   := public.get_current_user();
  v_user_role := public.get_role();

  IF v_user_role = 'client' THEN
    RAISE EXCEPTION 'Forbidden'
      USING ERRCODE = '42501'; -- 403 Forbidden
  END IF;

  -- chekc if the current agent is the assigned one
  v_is_claimed_agent := (v_user_role = 'admin') OR EXISTS (
    SELECT 1 FROM public.tickets t
    WHERE t.id = p_ticket_id AND t.agent_id = v_user_id
  );

  IF NOT v_is_claimed_agent THEN
    RAISE EXCEPTION 'Forbidden'
      USING ERRCODE = '42501'; -- 403 Forbidden
  END IF;


  UPDATE public.tickets
  SET status = 'in_progress'::ticket_status, closed_by = v_user_id
  WHERE id = p_ticket_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ticket % not found', p_ticket_id
      USING ERRCODE = 'P0002'; -- 404 Not Found
  END IF;

  RETURN TRUE;
END;
$function$;

REVOKE ALL ON FUNCTION public.in_progress_ticket(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.in_progress_ticket(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.in_progress_ticket(uuid) TO authenticated;


--------- Trigger functions --------------



CREATE FUNCTION public.create_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_new_user_id uuid;
  v_new_user_username text;
BEGIN

  v_new_user_id := NEW.id;
  v_new_user_username := NEW.raw_user_meta_data->>'username';

  IF v_new_user_username IS NULL OR v_new_user_username = '' THEN
    v_new_user_username := v_new_user_id::text; -- add as default ?
  END IF;

  INSERT INTO public.profiles
  (id, created_at, username, role)
  VALUES (
    v_new_user_id, 
    NOW(), 
    v_new_user_username, 
    'client'::roles -- default to client role, admin must update it after
  ); 

  RETURN NEW;

  
END;
$function$;


CREATE TRIGGER create_profile_trigger AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.create_profile();


CREATE FUNCTION public.set_ticket_default_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN

  -- force default fields values
  NEW.created_at := NOW();
  NEW.status     := 'open'::ticket_status;
  NEW.agent_id   := NULL;
  NEW.closed_by  := NULL;

  RETURN NEW;
  
END;
$function$;


CREATE TRIGGER set_ticket_default_fields_trigger 
BEFORE INSERT ON public.tickets 
FOR EACH ROW 
WHEN (row_security_active('public.tickets')) -- do not apply for admin
EXECUTE FUNCTION public.set_ticket_default_fields();



-- Trigger function to force created_at to current server time
CREATE OR REPLACE FUNCTION public.override_message_created_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  NEW.created_at := now();
  RETURN NEW;
END;
$function$;

-- Attach trigger to messages table
CREATE TRIGGER enforce_message_created_at
BEFORE INSERT ON public.messages
FOR EACH ROW
WHEN (row_security_active('public.tickets')) -- do not apply for admin
EXECUTE FUNCTION public.override_message_created_at();
----------- RLS policies --------------

-- No UPDATE RLS policies because they are too complex to handle cleanly (trigger function to avoid the update of fixed values), 
-- so only RPC function handles updates


CREATE POLICY "Authenticated can see their profile" ON public.profiles
  FOR SELECT
  TO authenticated
  USING ((id = ( SELECT auth.uid() AS uid)));


create policy "clients can view profile of their assigned agent"
on profiles
for select
to authenticated
using (
  role = 'agent'
  and exists (
    select 1 from tickets
    where tickets.agent_id = profiles.id
    and tickets.client_id = (SELECT auth.uid() AS uid)
  )
);


CREATE POLICY "Agent and admin can see profiles" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.is_agent());

CREATE POLICY "User can delete their profile" ON public.profiles
  FOR DELETE
  TO authenticated
  USING ((id = ( SELECT auth.uid() AS uid)));



CREATE POLICY "Participants can insert messages" ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = (SELECT auth.uid()) AND
    (EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE (
        (t.id = messages.ticket_id) 
        AND (
          (t.client_id = ( SELECT auth.uid() AS uid)) OR (t.agent_id = ( SELECT auth.uid() AS uid)))))
        )
      );

CREATE POLICY "Ticket participants can see messages" ON public.messages
  FOR SELECT
  TO authenticated
  USING (
    (EXISTS(
      SELECT 1 FROM public.tickets t
      WHERE (
        (t.id = messages.ticket_id) 
        AND (
          (t.client_id = ( SELECT auth.uid() AS uid)) 
          OR (t.agent_id = ( SELECT auth.uid() AS uid)) 
          OR (public.get_role() = 'admin'))))
        )
    );


CREATE POLICY "Agent sees assigned and unassigned tickets" ON public.tickets
  FOR SELECT
  TO authenticated
  USING (
    agent_id IS NULL OR
    (agent_id = ( SELECT auth.uid() AS uid))
  );

CREATE POLICY "Client can create ticket" ON public.tickets
  FOR INSERT
  TO authenticated
  WITH CHECK ((client_id = ( SELECT auth.uid() AS uid)));


CREATE POLICY "Client can delete ticket if they are open" ON public.tickets
  FOR DELETE
  TO authenticated
  USING (
    (client_id = ( SELECT auth.uid() AS uid))
    AND status = 'open'::ticket_status
  );

CREATE POLICY "Client owns the ticket" ON public.tickets
  FOR SELECT
  TO authenticated
  USING ((client_id = ( SELECT auth.uid() AS uid)));


CREATE POLICY "Admin sees all tickets" ON public.tickets
  FOR SELECT
  TO authenticated
  USING (public.get_role() = 'admin');