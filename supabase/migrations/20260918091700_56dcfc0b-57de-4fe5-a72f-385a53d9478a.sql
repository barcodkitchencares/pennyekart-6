DROP FUNCTION IF EXISTS public.get_community_members();
CREATE FUNCTION public.get_community_members()
RETURNS TABLE(
  user_id uuid,
  full_name text,
  mobile_number text,
  joined_at timestamptz,
  is_creator boolean,
  last_order_at timestamptz,
  days_until_removal integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _cid uuid := public.my_community_id();
BEGIN
  IF _cid IS NULL OR NOT public.is_community_creator(_cid) THEN
    RAISE EXCEPTION 'Only the community creator can view members';
  END IF;

  RETURN QUERY
  SELECT
    cm.user_id,
    p.full_name,
    p.mobile_number,
    cm.joined_at,
    (cm.user_id = c.creator_user_id) AS is_creator,
    (
      SELECT max(o.created_at)
      FROM public.orders o
      WHERE o.user_id = cm.user_id
    ) AS last_order_at,
    CASE
      WHEN cm.user_id = c.creator_user_id THEN NULL
      ELSE GREATEST(
        0,
        30 - EXTRACT(DAY FROM now() - GREATEST(
          cm.joined_at,
          COALESCE((SELECT max(o.created_at) FROM public.orders o WHERE o.user_id = cm.user_id), cm.joined_at)
        ))::int
      )
    END AS days_until_removal
  FROM public.community_members cm
  JOIN public.communities c ON c.id = cm.community_id
  LEFT JOIN public.profiles p ON p.user_id = cm.user_id
  WHERE cm.community_id = _cid
  ORDER BY cm.joined_at ASC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_community_members() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_community_members() TO authenticated;