


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




-- List every profile with creation date + last sign-in (from auth.users).
-- last_sign_in_at is NULL when the user never signed in.
CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE(
  id uuid,
  username text,
  role public.roles,
  created_at timestamptz,
  last_sign_in_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN

  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Forbidden'
      USING ERRCODE = '42501'; -- 403 Forbidden
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.username,
    p.role,
    p.created_at,
    u.last_sign_in_at
  FROM public.profiles AS p
  JOIN auth.users AS u ON u.id = p.id
  ORDER BY p.created_at DESC;

END;
$function$;

REVOKE ALL ON FUNCTION public.admin_list_users() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_list_users() FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;


-- Harden role updates: an admin cannot demote themselves and cannot demote
-- the last remaining admin (would lock everybody out of admin actions).
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
  v_caller_id uuid;
  v_current_role public.roles;
  v_admin_count bigint;
BEGIN

  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Forbidden'
      USING ERRCODE = '42501'; -- 403 Forbidden
  END IF;

  v_caller_id := public.get_current_user();

  SELECT p.role INTO v_current_role
  FROM public.profiles AS p
  WHERE p.id = p_profile_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile % not found', p_profile_id
      USING ERRCODE = 'P0002'; -- 404 Not Found
  END IF;

  -- no-op already has the requested role
  IF v_current_role = p_new_role THEN
    RETURN TRUE;
  END IF;

  -- cannot change your own role
  IF p_profile_id = v_caller_id THEN
    RAISE EXCEPTION 'Forbidden, cannot change your own role'
      USING ERRCODE = '42501'; -- 403 Forbidden
  END IF;

  -- cannot demote the last remaining admin
  IF v_current_role = 'admin'::public.roles AND p_new_role != 'admin'::public.roles THEN
    SELECT COUNT(*) INTO v_admin_count
    FROM public.profiles AS p
    WHERE p.role = 'admin'::public.roles;

    IF v_admin_count <= 1 THEN
      RAISE EXCEPTION 'Forbidden, cannot demote the last admin'
        USING ERRCODE = '42501'; -- 403 Forbidden
    END IF;
  END IF;

  UPDATE public.profiles
  SET role = p_new_role
  WHERE id = p_profile_id;

  RETURN TRUE;
END;
$function$;

REVOKE ALL ON FUNCTION public.update_role(uuid, public.roles) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_role(uuid, public.roles) FROM anon;
GRANT EXECUTE ON FUNCTION public.update_role(uuid, public.roles) TO authenticated;



CREATE OR REPLACE FUNCTION public.admin_delete_user(
  p_user_id uuid
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_caller_id uuid;
  v_target_role public.roles;
  v_admin_count bigint;
BEGIN

  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Forbidden'
      USING ERRCODE = '42501'; -- 403 Forbidden
  END IF;

  v_caller_id := public.get_current_user();

  IF p_user_id = v_caller_id THEN
    RAISE EXCEPTION 'Forbidden, cannot delete your own account'
      USING ERRCODE = '42501'; -- 403 Forbidden
  END IF;

  -- If the profile is already gone, v_target_role stays NULL and the
  -- last-admin check is skipped; the DELETE below raises P0002 when the
  -- auth user does not exist either.
  SELECT p.role INTO v_target_role
  FROM public.profiles AS p
  WHERE p.id = p_user_id;

  IF v_target_role = 'admin'::public.roles THEN
    SELECT COUNT(*) INTO v_admin_count
    FROM public.profiles AS p
    WHERE p.role = 'admin'::public.roles;

    IF v_admin_count <= 1 THEN
      RAISE EXCEPTION 'Forbidden, cannot delete the last admin'
        USING ERRCODE = '42501'; -- 403 Forbidden
    END IF;
  END IF;

  DELETE FROM auth.users WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User % not found', p_user_id
      USING ERRCODE = 'P0002'; -- 404 Not Found
  END IF;

  RETURN TRUE;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_delete_user(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_delete_user(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(uuid) TO authenticated;
