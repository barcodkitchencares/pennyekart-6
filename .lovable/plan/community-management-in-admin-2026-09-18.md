# Community Management in Admin

Add a new **Community Management** section to the admin area that shows how much business each community brings in, the profit on it, and the commission owed to the community creator.

## What you will see

Route: `/admin/communities`, added to the admin menu next to Selling Partners.

**Top summary cards**
- Number of communities and total members
- Total community revenue (delivered orders only) for the selected period
- Total profit on that revenue
- Total creator commission at the percentage you set

**Commission setting**
- A single percentage field ("Creator commission % of profit"), saved in app settings so it applies everywhere
- Changing it instantly recalculates the commission column

**Date range**
- Quick picks: This month, Last month, Last 3 months, All time
- Custom from/to dates

**Community list**
Each row: community name, creator name and mobile, member count, orders count, revenue, profit, commission payable. Sortable by revenue. Search by community or creator name.

**Individual community view**
Click a community to open a detail panel showing:
- The same totals for that community only
- Per-member breakdown: name, mobile, joined date, orders, revenue, profit, contribution share
- Creator's own orders shown separately from members'

**Export**
CSV export of both the community list and the per-member breakdown for the selected period.

## How revenue and profit are calculated

- Only orders with status `delivered` count.
- Revenue = order totals (excluding delivery charge) for all members of the community, including the creator.
- Profit = revenue minus cost of goods. Cost comes from each product's purchase rate, matched from the items saved on the order.
- Commission = profit x your commission percentage.
- If an item's purchase rate can't be matched (deleted product), that item is counted in revenue with zero cost and flagged in the detail view so totals stay honest.

## Technical notes

- New migration with two SECURITY DEFINER functions, admin-only via `is_super_admin()` / `has_permission()`:
  - `get_community_revenue_summary(_from timestamptz, _to timestamptz)` — one row per community: id, name, creator name/mobile, member_count, order_count, revenue, cost, profit.
  - `get_community_member_revenue(_community_id uuid, _from timestamptz, _to timestamptz)` — one row per member with order_count, revenue, cost, profit, is_creator.
  - Both expand `orders.items` with `jsonb_array_elements`, join item `id` to `products.purchase_rate` and `seller_products.purchase_rate` by `source`, and subtract `delivery_charge` from order totals.
  - EXECUTE granted to `authenticated` only.
- Commission percentage stored in `app_settings` under key `community_creator_commission_percent` (default 0), edited from the new page.
- New page `src/pages/admin/CommunityManagementPage.tsx`, route in `src/App.tsx` guarded by `ProtectedRoute requirePermission="read_users"`, menu entry in `src/components/admin/AdminLayout.tsx`.
- No changes to the customer-facing community card.
