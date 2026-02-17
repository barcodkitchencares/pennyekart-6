
-- Allow delivery staff to read orders assigned to them
DROP POLICY IF EXISTS "Users can read own orders" ON public.orders;
CREATE POLICY "Users can read own orders"
ON public.orders
FOR SELECT
USING (
  auth.uid() = user_id
  OR auth.uid() = seller_id
  OR auth.uid() = assigned_delivery_staff_id
  OR is_super_admin()
  OR has_permission('read_orders')
);

-- Allow delivery staff to update orders assigned to them (status changes)
DROP POLICY IF EXISTS "Authorized can update orders" ON public.orders;
CREATE POLICY "Authorized can update orders"
ON public.orders
FOR UPDATE
USING (
  auth.uid() = assigned_delivery_staff_id
  OR is_super_admin()
  OR has_permission('update_orders')
);

-- Allow delivery staff to insert wallet transactions for themselves
CREATE POLICY "Staff can insert own transactions"
ON public.delivery_staff_wallet_transactions
FOR INSERT
WITH CHECK (auth.uid() = staff_user_id);

-- Allow delivery staff to insert own wallet
CREATE POLICY "Staff can insert own wallet"
ON public.delivery_staff_wallets
FOR INSERT
WITH CHECK (auth.uid() = staff_user_id);

-- Allow delivery staff to update own wallet balance
CREATE POLICY "Staff can update own wallet"
ON public.delivery_staff_wallets
FOR UPDATE
USING (auth.uid() = staff_user_id);
