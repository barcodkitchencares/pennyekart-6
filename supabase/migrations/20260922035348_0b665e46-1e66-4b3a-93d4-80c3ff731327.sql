CREATE TABLE public.customer_addresses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  label text NOT NULL DEFAULT 'Home',
  contact_name text NOT NULL,
  contact_phone text NOT NULL,
  address_line1 text NOT NULL,
  address_line2 text,
  landmark text,
  city text,
  state text,
  pincode text,
  local_body_id uuid REFERENCES public.locations_local_bodies(id),
  ward_number integer,
  latitude double precision,
  longitude double precision,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_addresses TO authenticated;
GRANT ALL ON public.customer_addresses TO service_role;

ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own addresses"
  ON public.customer_addresses FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all addresses"
  ON public.customer_addresses FOR SELECT TO authenticated
  USING (public.is_super_admin() OR public.has_permission('read_users'));

CREATE INDEX idx_customer_addresses_user ON public.customer_addresses(user_id);

CREATE TRIGGER update_customer_addresses_updated_at
  BEFORE UPDATE ON public.customer_addresses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.enforce_single_default_address()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_default THEN
    UPDATE public.customer_addresses
      SET is_default = false
      WHERE user_id = NEW.user_id AND id <> NEW.id AND is_default;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_single_default_address
  AFTER INSERT OR UPDATE OF is_default ON public.customer_addresses
  FOR EACH ROW WHEN (NEW.is_default) EXECUTE FUNCTION public.enforce_single_default_address();