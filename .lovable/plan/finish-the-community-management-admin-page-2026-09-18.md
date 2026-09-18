# Finish the Community Management admin page

The reporting groundwork is already in the database: two report functions exist and can return, for any date range, each community's delivered-order revenue, cost and profit, plus a member-by-member breakdown. What's missing is the page itself and the way into it.

## Current state (checked)

- The revenue report functions exist in the database.
- The Community Management page file is **not** in the project — it needs to be written again.
- There is no menu entry and no address for the page.
- No saved setting exists yet for the creator commission percentage.

## What gets built

1. **Community Management page** with:
   - Summary cards: total communities, total members, total revenue, total profit, total creator commission for the chosen period.
   - Period filter: This month, Last month, All time, and a custom start/end date range.
   - A commission percentage box (applies to profit) that an admin can edit and save; it is stored in app settings so it persists and is reused everywhere.
   - Community table: name, creator, members, orders, revenue, cost, profit, commission earned.
   - Click a community to open a detail view listing each member's orders, revenue and profit, with a download option.
   - The stray non-English label from the earlier draft gets written correctly in English.
2. **Menu entry** "Communities" in the admin sidebar and a working page address at `/admin/communities`, guarded by the same permission style used for other admin pages.
3. Verification: type check the project and open the page in the preview to confirm the figures and filters render.

## Notes

- Only delivered orders count toward revenue, as chosen earlier.
- Commission is calculated on profit (revenue minus cost), not on revenue.

## Technical details

- New file `src/pages/admin/CommunitiesPage.tsx` calling `get_community_revenue_summary(_from, _to)` and `get_community_member_revenue(_community_id, _from, _to)` via `supabase.rpc`.
- Route added in `src/App.tsx` (`/admin/communities`, `ProtectedRoute` with `read_orders`) and a nav item in `src/components/admin/AdminLayout.tsx`.
- Commission percentage persisted in `app_settings` under a new key `community_creator_commission_percent`, read on load and saved on change.
