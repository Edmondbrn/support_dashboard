
-- add messages table to supabase realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;


-- Table definition --
CREATE TABLE public.ticket_reads (
  ticket_id    uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_read_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (ticket_id, user_id)
);

ALTER TABLE public.ticket_reads ENABLE ROW LEVEL SECURITY;

grant select, insert, update on public.ticket_reads to authenticated;
grant all on public.ticket_reads to service_role;

-- users can only see/write their own read markers, and only for tickets they belong to
CREATE POLICY "select own reads" ON public.ticket_reads
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Function to get all the conversations for a given user about a ticket
CREATE OR REPLACE FUNCTION public.find_conversation_for_user(
    v_last_loaded_ticket_id uuid DEFAULT NULL,
    v_last_message_at timestamptz DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    category public.ticket_category,
    status public.ticket_status,
    priority public.ticket_priority,
    description text,
    created_at timestamptz,
    other_user_id uuid,
    username text,
    last_message_content text,
    last_message_at timestamptz
)
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id   uuid := public.get_current_user();
  v_is_agent boolean := public.is_agent();
BEGIN
    RETURN QUERY
    WITH last_messages AS (
        SELECT DISTINCT ON (ticket_id)
            m.ticket_id,
            m.content,
            m.created_at
        FROM public.messages AS m
        ORDER BY ticket_id, created_at DESC
    )
    SELECT 
        t.id,
        t.category,
        t.status,
        t.priority,
        t.description,
        t.created_at,
        CASE WHEN t.agent_id = v_user_id THEN t.client_id ELSE t.agent_id END AS other_user_id,
        p.username,
        lm.content AS last_message_content,
        lm.created_at AS last_message_at
    FROM public.tickets AS t
    LEFT JOIN public.profiles AS p
        ON p.id = CASE WHEN t.agent_id = v_user_id THEN t.client_id ELSE t.agent_id END
    LEFT JOIN last_messages lm ON lm.ticket_id = t.id
    WHERE 
        (t.agent_id = v_user_id OR t.client_id = v_user_id)
        AND (
            v_last_message_at IS NULL 
            OR (COALESCE(lm.created_at, t.created_at), t.id) < (v_last_message_at, v_last_loaded_ticket_id)
        )
    ORDER BY COALESCE(lm.created_at, t.created_at) DESC, t.id DESC
    LIMIT 10;
END;
$function$;


REVOKE ALL ON FUNCTION public.find_conversation_for_user(uuid, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.find_conversation_for_user(uuid, timestamptz) FROM anon;
GRANT EXECUTE ON FUNCTION public.find_conversation_for_user(uuid, timestamptz) TO authenticated;


-- function to find conversation to add in the conversation list using Realtime update
CREATE OR REPLACE FUNCTION public.find_conversation_by_id(v_ticket_id uuid)
RETURNS TABLE (
    id uuid,
    category public.ticket_category,
    status public.ticket_status,
    priority public.ticket_priority,
    description text,
    created_at timestamptz,
    other_user_id uuid,
    username text,
    last_message_content text,
    last_message_at timestamptz
)
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := public.get_current_user();
BEGIN
    RETURN QUERY
    WITH last_message AS (
        SELECT m.content, m.created_at
        FROM public.messages AS m
        WHERE m.ticket_id = v_ticket_id
        ORDER BY m.created_at DESC
        LIMIT 1
    )
    SELECT
        t.id,
        t.category,
        t.status,
        t.priority,
        t.description,
        t.created_at,
        CASE WHEN t.agent_id = v_user_id THEN t.client_id ELSE t.agent_id END AS other_user_id,
        p.username,
        lm.content,
        lm.created_at
    FROM public.tickets AS t
    JOIN public.profiles AS p
        ON p.id = CASE WHEN t.agent_id = v_user_id THEN t.client_id ELSE t.agent_id END
    LEFT JOIN last_message lm ON true
    WHERE t.id = v_ticket_id
      AND (t.agent_id = v_user_id OR t.client_id = v_user_id);
END;
$function$;

REVOKE ALL ON FUNCTION public.find_conversation_by_id(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.find_conversation_by_id(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.find_conversation_by_id(uuid) TO authenticated;



-- Function to get unread data at app boot
CREATE OR REPLACE FUNCTION public.get_unread_counts()
RETURNS TABLE(ticket_id uuid, unread_count bigint)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $function$
DECLARE
  v_user_id uuid := public.get_current_user();
BEGIN
    RETURN QUERY
        SELECT 
            m.ticket_id, 
            count(*)::bigint AS unread_count
        FROM public.messages m
        JOIN public.tickets t ON t.id = m.ticket_id
        LEFT JOIN public.ticket_reads r
            ON r.ticket_id = m.ticket_id AND r.user_id = v_user_id
        WHERE (t.client_id = v_user_id OR t.agent_id = v_user_id)
            AND m.sender_id != v_user_id
            AND m.created_at > COALESCE(r.last_read_at, '-infinity'::timestamptz)
        GROUP BY m.ticket_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_unread_counts() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_unread_counts() FROM anon;
grant execute on function public.get_unread_counts() to authenticated;


-- Function to update last read for a given ticket
CREATE OR REPLACE FUNCTION public.update_ticket_last_read(v_ticket_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_user_id uuid := public.get_current_user();
BEGIN

    IF NOT EXISTS(
        SELECT 1 FROM public.tickets t 
        WHERE t.id = v_ticket_id AND (t.agent_id = v_user_id OR t.client_id = v_user_id)
    ) THEN
        RAISE EXCEPTION 'Unauthorized %', v_ticket_id
        USING ERRCODE = '42501'; -- 403 forbidden
    END IF;

    INSERT INTO public.ticket_reads 
    (ticket_id, user_id, last_read_at)
    VALUES (v_ticket_id, v_user_id, NOW())
    ON CONFLICT (ticket_id, user_id)
    DO UPDATE SET last_read_at = NOW();

END;
$function$
;

REVOKE ALL ON FUNCTION public.update_ticket_last_read(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_ticket_last_read(uuid) FROM anon;
grant execute on function public.update_ticket_last_read(uuid) to authenticated;