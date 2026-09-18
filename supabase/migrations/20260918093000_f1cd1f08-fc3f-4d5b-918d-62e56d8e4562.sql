CREATE OR REPLACE FUNCTION public.get_community_revenue_summary(_from timestamptz DEFAULT NULL, _to timestamptz DEFAULT NULL)
RETURNS TABLE(
  community_id uuid,
  community_name text,
  creator_user_id uuid,
  creator_name text,
  creator_mobile text,
  member_count integer,
  order_count integer,
  revenue numeric,
  cost numeric,
  profit numeric,
  unmatched_items integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH guard AS (
    SELECT public.is_super_admin() OR public.has_permission('read_users') AS ok
  ),
  mem AS (
    SELECT cm.community_id, cm.user_id
    FROM public.community_members cm
    WHERE (SELECT ok FROM guard)
  ),
  ord AS (
    SELECT m.community_id,
           o.id AS order_id,
           GREATEST(o.total - COALESCE(o.delivery_charge, 0), 0) AS net_total,
           o.items
    FROM mem m
    JOIN public.orders o ON o.user_id = m.user_id
    WHERE o.status = 'delivered'
      AND (_from IS NULL OR o.created_at >= _from)
      AND (_to IS NULL OR o.created_at <= _to)
  ),
  item_cost AS (
    SELECT ord.community_id,
           ord.order_id,
           SUM(COALESCE(p.purchase_rate, sp.purchase_rate, 0) * COALESCE((it->>'quantity')::numeric, 0)) AS cost,
           COUNT(*) FILTER (WHERE p.id IS NULL AND sp.id IS NULL) AS unmatched
    FROM ord
    CROSS JOIN LATERAL jsonb_array_elements(COALESCE(ord.items, '[]'::jsonb)) AS it
    LEFT JOIN public.products p ON p.id = NULLIF(it->>'id','')::uuid
    LEFT JOIN public.seller_products sp ON sp.id = NULLIF(it->>'id','')::uuid
    GROUP BY ord.community_id, ord.order_id
  ),
  agg AS (
    SELECT ord.community_id,
           COUNT(DISTINCT ord.order_id)::int AS order_count,
           SUM(ord.net_total) AS revenue,
           COALESCE(SUM(ic.cost), 0) AS cost,
           COALESCE(SUM(ic.unmatched), 0)::int AS unmatched_items
    FROM ord
    LEFT JOIN item_cost ic ON ic.order_id = ord.order_id AND ic.community_id = ord.community_id
    GROUP BY ord.community_id
  )
  SELECT c.id,
         c.name,
         c.creator_user_id,
         pr.full_name,
         pr.mobile_number,
         (SELECT COUNT(*) FROM public.community_members cm2 WHERE cm2.community_id = c.id)::int,
         COALESCE(a.order_count, 0),
         COALESCE(a.revenue, 0),
         COALESCE(a.cost, 0),
         COALESCE(a.revenue, 0) - COALESCE(a.cost, 0),
         COALESCE(a.unmatched_items, 0)
  FROM public.communities c
  LEFT JOIN public.profiles pr ON pr.user_id = c.creator_user_id
  LEFT JOIN agg a ON a.community_id = c.id
  WHERE (SELECT ok FROM guard)
  ORDER BY COALESCE(a.revenue, 0) DESC, c.name;
$$;

CREATE OR REPLACE FUNCTION public.get_community_member_revenue(_community_id uuid, _from timestamptz DEFAULT NULL, _to timestamptz DEFAULT NULL)
RETURNS TABLE(
  user_id uuid,
  full_name text,
  mobile_number text,
  joined_at timestamptz,
  is_creator boolean,
  order_count integer,
  revenue numeric,
  cost numeric,
  profit numeric,
  unmatched_items integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH guard AS (
    SELECT public.is_super_admin() OR public.has_permission('read_users') AS ok
  ),
  mem AS (
    SELECT cm.user_id, cm.joined_at,
           (cm.user_id = c.creator_user_id) AS is_creator
    FROM public.community_members cm
    JOIN public.communities c ON c.id = cm.community_id
    WHERE cm.community_id = _community_id
      AND (SELECT ok FROM guard)
  ),
  ord AS (
    SELECT m.user_id,
           o.id AS order_id,
           GREATEST(o.total - COALESCE(o.delivery_charge, 0), 0) AS net_total,
           o.items
    FROM mem m
    JOIN public.orders o ON o.user_id = m.user_id
    WHERE o.status = 'delivered'
      AND (_from IS NULL OR o.created_at >= _from)
      AND (_to IS NULL OR o.created_at <= _to)
  ),
  item_cost AS (
    SELECT ord.user_id,
           ord.order_id,
           SUM(COALESCE(p.purchase_rate, sp.purchase_rate, 0) * COALESCE((it->>'quantity')::numeric, 0)) AS cost,
           COUNT(*) FILTER (WHERE p.id IS NULL AND sp.id IS NULL) AS unmatched
    FROM ord
    CROSS JOIN LATERAL jsonb_array_elements(COALESCE(ord.items, '[]'::jsonb)) AS it
    LEFT JOIN public.products p ON p.id = NULLIF(it->>'id','')::uuid
    LEFT JOIN public.seller_products sp ON sp.id = NULLIF(it->>'id','')::uuid
    GROUP BY ord.user_id, ord.order_id
  ),
  agg AS (
    SELECT ord.user_id,
           COUNT(DISTINCT ord.order_id)::int AS order_count,
           SUM(ord.net_total) AS revenue,
           COALESCE(SUM(ic.cost), 0) AS cost,
           COALESCE(SUM(ic.unmatched), 0)::int AS unmatched_items
    FROM ord
    LEFT JOIN item_cost ic ON ic.order_id = ord.order_id AND ic.user_id = ord.user_id
    GROUP BY ord.user_id
  )
  SELECT m.user_id,
         pr.full_name,
         pr.mobile_number,
         m.joined_at,
         m.is_creator,
         COALESCE(a.order_count, 0),
         COALESCE(a.revenue, 0),
         COALESCE(a.cost, 0),
         COALESCE(a.revenue, 0) - COALESCE(a.cost, 0),
         COALESCE(a.unmatched_items, 0)
  FROM mem m
  LEFT JOIN public.profiles pr ON pr.user_id = m.user_id
  LEFT JOIN agg a ON a.user_id = m.user_id
  ORDER BY m.is_creator DESC, COALESCE(a.revenue, 0) DESC;
$$;

REVOKE ALL ON FUNCTION public.get_community_revenue_summary(timestamptz, timestamptz) FROM anon, public;
REVOKE ALL ON FUNCTION public.get_community_member_revenue(uuid, timestamptz, timestamptz) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_community_revenue_summary(timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_community_member_revenue(uuid, timestamptz, timestamptz) TO authenticated;