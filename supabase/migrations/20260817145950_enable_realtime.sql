
-- add messages table to supabase realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;



-- Function to get all the conversations for a given user about a ticket
CREATE OR REPLACE FUNCTION public.find_conversation_for_user()
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
    IF v_is_agent THEN
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
            t.client_id AS other_user_id,
            p.username,
            lm.content AS last_message_content,
            lm.created_at AS last_message_at
        FROM public.tickets AS t
        JOIN public.profiles AS p ON t.client_id = p.id
        LEFT JOIN last_messages lm ON lm.ticket_id = t.id
        WHERE t.agent_id = v_user_id
        ORDER BY COALESCE(lm.created_at, t.created_at) DESC;

    ELSE
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
            t.agent_id AS other_user_id,
            p.username,
            lm.content AS last_message_content,
            lm.created_at AS last_message_at
        FROM public.tickets AS t
        JOIN public.profiles AS p ON t.agent_id = p.id
        LEFT JOIN last_messages lm ON lm.ticket_id = t.id
        WHERE t.client_id = v_user_id
        ORDER BY COALESCE(lm.created_at, t.created_at) DESC;
    END IF;
END;
$function$;


REVOKE ALL ON FUNCTION public.find_conversation_for_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.find_conversation_for_user() FROM anon;
GRANT EXECUTE ON FUNCTION public.find_conversation_for_user() TO authenticated;