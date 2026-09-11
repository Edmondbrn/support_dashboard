


CREATE OR REPLACE FUNCTION public.get_agent_ticket_stat(v_agent_id UUID)
RETURNS TABLE(status ticket_status, count BIGINT)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
AS $$
BEGIN
    
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Forbidden'
        USING ERRCODE = '42501'; -- 403 Forbidden
    END IF;
    
    RETURN QUERY
    SELECT t.status, COUNT(*)
    FROM public.tickets t
    WHERE t.agent_id = v_agent_id
    GROUP BY t.status;
END;
$$;


REVOKE ALL ON FUNCTION public.get_agent_ticket_stat(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_agent_ticket_stat(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_agent_ticket_stat(uuid) TO authenticated;