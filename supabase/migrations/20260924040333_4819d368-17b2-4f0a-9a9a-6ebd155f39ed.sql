-- 1. Keep financial records when an auth user is removed
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey,
  ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_created_by_fkey,
  ADD CONSTRAINT products_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_updated_by_fkey,
  ADD CONSTRAINT products_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.banners DROP CONSTRAINT IF EXISTS banners_created_by_fkey,
  ADD CONSTRAINT banners_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_referred_by_fkey,
  ADD CONSTRAINT profiles_referred_by_fkey FOREIGN KEY (referred_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 2. Public deletion requests
CREATE TABLE public.account_deletion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  mobile text NOT NULL,
  email text,
  reason text,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  handled_by uuid,
  handled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT adr_len CHECK (length(full_name) BETWEEN 1 AND 120 AND length(mobile) BETWEEN 10 AND 15
    AND (email IS NULL OR length(email) <= 255) AND (reason IS NULL OR length(reason) <= 1000)),
  CONSTRAINT adr_status CHECK (status IN ('pending','processing','completed','rejected'))
);
GRANT INSERT ON public.account_deletion_requests TO anon;
GRANT INSERT, SELECT, UPDATE ON public.account_deletion_requests TO authenticated;
GRANT ALL ON public.account_deletion_requests TO service_role;
ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit deletion request" ON public.account_deletion_requests
  FOR INSERT TO anon, authenticated WITH CHECK (status = 'pending' AND handled_by IS NULL AND admin_notes IS NULL);
CREATE POLICY "Admins read deletion requests" ON public.account_deletion_requests
  FOR SELECT TO authenticated USING (public.is_super_admin() OR public.has_permission('read_users'));
CREATE POLICY "Admins update deletion requests" ON public.account_deletion_requests
  FOR UPDATE TO authenticated USING (public.is_super_admin() OR public.has_permission('read_users'))
  WITH CHECK (public.is_super_admin() OR public.has_permission('read_users'));
CREATE TRIGGER update_adr_updated_at BEFORE UPDATE ON public.account_deletion_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Server-only verification codes
CREATE TABLE public.verification_codes (
  user_id uuid PRIMARY KEY,
  code_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  attempts int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.verification_codes TO service_role;
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;
UPDATE public.profiles SET verification_code = NULL, verification_code_expires_at = NULL WHERE verification_code IS NOT NULL;

-- 4. Stop users from changing privileged profile fields on themselves
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_super_admin() THEN RETURN NEW; END IF;
  IF NEW.is_super_admin IS DISTINCT FROM OLD.is_super_admin
     OR NEW.is_approved IS DISTINCT FROM OLD.is_approved
     OR NEW.is_blocked IS DISTINCT FROM OLD.is_blocked
     OR NEW.role_id IS DISTINCT FROM OLD.role_id
     OR NEW.user_type IS DISTINCT FROM OLD.user_type
     OR NEW.is_verified IS DISTINCT FROM OLD.is_verified
     OR NEW.verified_at IS DISTINCT FROM OLD.verified_at
     OR NEW.verification_code IS DISTINCT FROM OLD.verification_code
     OR NEW.verification_code_expires_at IS DISTINCT FROM OLD.verification_code_expires_at
     OR NEW.referral_code IS DISTINCT FROM OLD.referral_code
     OR NEW.customer_id IS DISTINCT FROM OLD.customer_id THEN
    RAISE EXCEPTION 'You are not allowed to change these account fields';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_protect_profile_privileged BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privileged_fields();

-- 5. Chatbot API keys: super admins only
DROP POLICY IF EXISTS "Admins can read api keys" ON public.chatbot_api_keys;
DROP POLICY IF EXISTS "Admins can insert api keys" ON public.chatbot_api_keys;
DROP POLICY IF EXISTS "Admins can update api keys" ON public.chatbot_api_keys;
CREATE POLICY "Super admin read api keys" ON public.chatbot_api_keys FOR SELECT TO authenticated USING (public.is_super_admin());
CREATE POLICY "Super admin insert api keys" ON public.chatbot_api_keys FOR INSERT TO authenticated WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admin update api keys" ON public.chatbot_api_keys FOR UPDATE TO authenticated USING (public.is_super_admin());

-- 6. Atomic account deletion (called only by the delete-account server function)
CREATE OR REPLACE FUNCTION public.delete_account_data(_uid uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _p record; _cid uuid; _mobile text; _others int;
BEGIN
  SELECT * INTO _p FROM public.profiles WHERE user_id = _uid;
  IF COALESCE(_p.is_super_admin, false) THEN RAISE EXCEPTION 'Super admin accounts cannot be deleted here'; END IF;
  _mobile := RIGHT(regexp_replace(COALESCE(_p.mobile_number,''), '\D', '', 'g'), 10);

  SELECT id INTO _cid FROM public.communities WHERE creator_user_id = _uid;
  IF _cid IS NOT NULL THEN
    SELECT count(*) INTO _others FROM public.community_members WHERE community_id = _cid AND user_id <> _uid;
    IF _others > 0 THEN RAISE EXCEPTION 'Remove all members from your community before deleting your account'; END IF;
    DELETE FROM public.community_invites WHERE community_id = _cid;
    DELETE FROM public.community_members WHERE community_id = _cid;
    DELETE FROM public.communities WHERE id = _cid;
  END IF;
  DELETE FROM public.community_members WHERE user_id = _uid;
  DELETE FROM public.community_invites WHERE invited_user_id = _uid OR (length(_mobile) = 10 AND invited_mobile = _mobile);

  UPDATE public.utility_service_requests
    SET contact_name = 'Deleted user', contact_phone = 'deleted', address = NULL, notes = NULL,
        latitude = NULL, longitude = NULL, address_id = NULL
    WHERE customer_user_id = _uid;
  UPDATE public.utility_service_requests SET address_id = NULL
    WHERE address_id IN (SELECT id FROM public.customer_addresses WHERE user_id = _uid);
  UPDATE public.orders SET shipping_address = 'Deleted user' WHERE user_id = _uid;

  DELETE FROM public.customer_addresses WHERE user_id = _uid;
  DELETE FROM public.customer_search_history WHERE customer_user_id = _uid;
  DELETE FROM public.notification_reads WHERE user_id = _uid;
  DELETE FROM public.utility_seller_areas WHERE seller_user_id = _uid;
  DELETE FROM public.delivery_staff_ward_assignments WHERE staff_user_id = _uid;
  DELETE FROM public.seller_godown_assignments WHERE seller_id = _uid;
  DELETE FROM public.verification_codes WHERE user_id = _uid;

  UPDATE public.seller_products SET is_active = false WHERE seller_id = _uid;
  UPDATE public.utility_services SET is_active = false, contact_phone = NULL, contact_whatsapp = NULL WHERE provider_user_id = _uid;
  UPDATE public.penny_prime_coupons SET is_active = false WHERE seller_id = _uid;
  UPDATE public.penny_prime_collabs SET agent_mobile = 'deleted' WHERE agent_user_id = _uid;

  -- Removes the login; profile row cascades; orders.user_id becomes NULL
  DELETE FROM auth.users WHERE id = _uid;
  RETURN jsonb_build_object('ok', true);
END; $$;
REVOKE ALL ON FUNCTION public.delete_account_data(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_account_data(uuid) TO service_role;