
-- Auto-assign delivery staff to orders based on customer's panchayath + ward
CREATE OR REPLACE FUNCTION public.auto_assign_delivery_staff()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _customer_lb_id uuid;
  _customer_ward int;
  _staff_user_id uuid;
BEGIN
  -- Get customer's local_body_id and ward_number
  SELECT local_body_id, ward_number INTO _customer_lb_id, _customer_ward
  FROM public.profiles
  WHERE user_id = NEW.user_id;

  IF _customer_lb_id IS NOT NULL AND _customer_ward IS NOT NULL THEN
    -- Find delivery staff assigned to this ward
    SELECT staff_user_id INTO _staff_user_id
    FROM public.delivery_staff_ward_assignments
    WHERE local_body_id = _customer_lb_id
      AND ward_number = _customer_ward
    LIMIT 1;

    IF _staff_user_id IS NOT NULL THEN
      NEW.assigned_delivery_staff_id := _staff_user_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_assign_delivery_on_order
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.auto_assign_delivery_staff();
