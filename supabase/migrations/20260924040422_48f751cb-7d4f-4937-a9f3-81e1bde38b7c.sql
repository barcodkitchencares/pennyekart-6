DO $$ DECLARE f text; BEGIN
  FOREACH f IN ARRAY ARRAY['auto_assign_delivery_staff()','auto_create_customer_wallet()','auto_create_partner_wallet()','cascade_partner_approval_change()','credit_order_bonus_rules()','credit_referral_bonus()','credit_seller_wallet_on_delivery()','credit_signup_bonus()','credit_wallet_points_on_delivery()','deduct_stock_on_delivery()','enforce_single_default_address()','generate_customer_id()','generate_referral_code()','handle_new_user()','mark_grocery_seller_product()','restore_stock_on_return()','sync_category_margin_to_products()','protect_profile_privileged_fields()'] LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%s FROM PUBLIC, anon, authenticated', f);
  END LOOP;
  FOREACH f IN ARRAY ARRAY['get_orders_for_seller(uuid)','get_next_purchase_number()','prune_inactive_community_members()','get_community_revenue_summary(timestamptz,timestamptz)','get_community_member_revenue(uuid,timestamptz,timestamptz)','create_community(text)','invite_to_community(text)','respond_to_community_invite(uuid,boolean)','remove_community_member(uuid)','cancel_community_invite(uuid)','delete_my_community()','get_community_members()'] LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%s FROM PUBLIC, anon', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO authenticated', f);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.get_orders_for_seller(seller_user_id uuid)
 RETURNS SETOF orders LANGUAGE sql SECURITY DEFINER SET search_path TO 'public' AS $function$
  SELECT DISTINCT o.* FROM public.orders o
  WHERE (seller_user_id = auth.uid() OR public.is_super_admin() OR public.has_permission('read_orders'))
    AND (o.seller_id = seller_user_id OR EXISTS (
      SELECT 1 FROM jsonb_array_elements(o.items) AS item
      JOIN public.seller_products sp ON sp.id = (item->>'id')::uuid
      WHERE sp.seller_id = seller_user_id))
  ORDER BY o.created_at DESC;
$function$;