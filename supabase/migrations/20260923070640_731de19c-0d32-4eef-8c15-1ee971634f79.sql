ALTER TABLE public.utility_services ADD COLUMN IF NOT EXISTS requires_location boolean NOT NULL DEFAULT true;
ALTER TABLE public.utility_service_requests ADD COLUMN IF NOT EXISTS address_id uuid REFERENCES public.customer_addresses(id) ON DELETE SET NULL;
ALTER TABLE public.utility_service_requests ADD COLUMN IF NOT EXISTS latitude double precision;
ALTER TABLE public.utility_service_requests ADD COLUMN IF NOT EXISTS longitude double precision;