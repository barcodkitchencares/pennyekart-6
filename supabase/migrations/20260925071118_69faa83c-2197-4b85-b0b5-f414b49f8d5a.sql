ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password_status text NOT NULL DEFAULT 'migrated';
UPDATE public.profiles SET password_status = 'legacy' WHERE user_type = 'customer';

CREATE OR REPLACE FUNCTION public.protect_profile_privileged_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_super_admin() OR coalesce(current_setting('app.bypass_profile_guard', true), '') = 'on' THEN RETURN NEW; END IF;
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
     OR NEW.customer_id IS DISTINCT FROM OLD.customer_id
     OR NEW.password_status IS DISTINCT FROM OLD.password_status THEN
    RAISE EXCEPTION 'You are not allowed to change these account fields';
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.start_account_verification()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _code text := (floor(random()*900000)+100000)::int::text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  PERFORM set_config('app.bypass_profile_guard', 'on', true);
  UPDATE public.profiles SET verification_code = _code, verification_code_expires_at = now() + interval '10 minutes' WHERE user_id = auth.uid();
  RETURN _code;
END; $$;

CREATE OR REPLACE FUNCTION public.confirm_account_verification(_code text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _ok boolean;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  SELECT (verification_code = _code AND verification_code_expires_at > now()) INTO _ok FROM public.profiles WHERE user_id = auth.uid();
  IF NOT coalesce(_ok, false) THEN RETURN false; END IF;
  PERFORM set_config('app.bypass_profile_guard', 'on', true);
  UPDATE public.profiles SET is_verified = true, verified_at = now(), verification_code = NULL, verification_code_expires_at = NULL WHERE user_id = auth.uid();
  RETURN true;
END; $$;
REVOKE EXECUTE ON FUNCTION public.start_account_verification() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.confirm_account_verification(text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.start_account_verification() TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_account_verification(text) TO authenticated;

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;
ALTER TABLE public.orders ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_referred_by_fkey;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_referred_by_fkey FOREIGN KEY (referred_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_created_by_fkey;
ALTER TABLE public.products ADD CONSTRAINT products_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_updated_by_fkey;
ALTER TABLE public.products ADD CONSTRAINT products_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.banners DROP CONSTRAINT IF EXISTS banners_created_by_fkey;
ALTER TABLE public.banners ADD CONSTRAINT banners_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.anonymize_user_data(_uid uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _cid uuid;
BEGIN
  UPDATE public.orders SET shipping_address = 'Deleted user' WHERE user_id = _uid;
  UPDATE public.utility_service_requests SET contact_name = 'Deleted user', contact_phone = '0000000000', address = NULL, latitude = NULL, longitude = NULL, address_id = NULL, customer_user_id = NULL WHERE customer_user_id = _uid;
  DELETE FROM public.customer_addresses WHERE user_id = _uid;
  DELETE FROM public.customer_search_history WHERE customer_user_id = _uid;
  DELETE FROM public.notification_reads WHERE user_id = _uid;
  SELECT id INTO _cid FROM public.communities WHERE creator_user_id = _uid;
  IF _cid IS NOT NULL THEN
    DELETE FROM public.community_invites WHERE community_id = _cid;
    DELETE FROM public.community_members WHERE community_id = _cid;
    DELETE FROM public.communities WHERE id = _cid;
  END IF;
  DELETE FROM public.community_members WHERE user_id = _uid;
  DELETE FROM public.community_invites WHERE invited_user_id = _uid;
  DELETE FROM public.delivery_staff_ward_assignments WHERE staff_user_id = _uid;
  UPDATE public.seller_products SET is_active = false WHERE seller_id = _uid;
  UPDATE public.utility_services SET is_active = false WHERE provider_user_id = _uid;
END; $$;
REVOKE EXECUTE ON FUNCTION public.anonymize_user_data(uuid) FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.anonymize_user_data(uuid) TO service_role;