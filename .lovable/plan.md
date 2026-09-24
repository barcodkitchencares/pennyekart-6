# Pennyekart – Play Store Compliance & Security

Existing business features (products, sellers, orders, delivery, utility services, wards, partners, agents, communities, wallets) stay unchanged unless security or compliance requires a change.

## 1. Inspection first
Before any change, review the real database relationships (foreign keys to user/profile ids, RLS policies, triggers on profiles/orders/wallets), Edge Functions, storage buckets, and the camera, location, notification and voice code. The deletion rules below are then confirmed or adjusted against what is actually found.

## 2. Delete Account (in the app)
- A "Delete Account" section on the customer profile and on the selling-partner, utility-partner and delivery-staff dashboards.
- Warning dialog lists what is deleted and what is kept. The user must type DELETE to continue.
- Success: sign out, show a message, go to the home page. Failure: show an error. The server runs everything as one transaction, so a failure changes nothing.
- Super admin accounts cannot delete themselves.

**Deleted:** profile personal fields (name, email, mobile, date of birth, photo, bank details, business details, GPS location, verification code), saved addresses, search history, notification reads, community membership and invites, scratch-card claims where not financial, utility service areas, delivery ward assignments, and the login account.
**Kept but anonymised ("Deleted user"):** orders (shipping address cleared), wallet and payment transactions, seller/delivery wallet records, service requests (contact name, phone, address and map pin cleared), Penny Prime coupon uses. These are needed for tax, accounting and reconciliation.
**Communities:** follows the existing rule. If the user created a community that still has members, deletion is blocked and they are asked to remove members first (existing "Delete community" flow). Members' own membership is simply removed.

## 3. Public page `/delete-account`
- Works without the app or sign-in. Pennyekart branding, what is deleted, what is kept, the process, and privacy contact.
- Signed in: "Delete My Account" button (same secure process).
- Not signed in: request form (name, registered mobile, optional email, optional reason) saved as a deletion request.
- Links to Privacy Policy and Terms.

## 4. Admin: Users → Deletion Requests
List of requests with status (pending, processing, completed, rejected). Admins with user permissions can view, change status and add notes. Anonymous visitors can only submit; they cannot read any request.

## 5. Privacy Policy `/privacy-policy` and Terms `/terms`
- Privacy Policy covers every topic in your brief, including Supabase hosting, Google Maps, Firebase push and WhatsApp links, retention, deletion and user rights.
- Terms: short and relevant to the marketplace, delivery, partners, wallet and services.
- Linked from login and signup pages (customer and partner), customer profile, partner dashboards, footer and the deletion page.
- Contact details: no fake email or address. The pages show a clearly marked "Contact details to be added" block that you replace before submission; this is listed as a blocker in the checklist.

## 6. Android permissions
Currently only INTERNET is declared. After confirming usage in code, add only:
- CAMERA, ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION, POST_NOTIFICATIONS.
- RECORD_AUDIO only if Penny Assistant really records voice. If it does not, the voice button is removed and no microphone permission is added.
- No background location, storage/media, contacts, SMS or phone permissions. Photos use the system picker.
- The same explanations are added for iOS.

## 7. Explaining permissions first
A small popup appears before each first system request with your exact wording, plus "Continue" and "Not now". "Not now" cancels quietly. Notifications are no longer requested at app launch. They are asked after the first order, or from "Turn on notifications" in the profile.

## 8. Security review and fixes
- Search the code for exposed keys, passwords, service keys, test accounts and sensitive console output. Anything secret moves to server-side storage.
- Check database access rules: storage-provider credentials and chatbot API keys readable by super admins only; profiles must not expose other users' bank details or verification codes.
- Verification: the code is currently generated in the browser. It moves to two server functions (send and check), and customers can no longer read their own code field.
- Run the database linter and security scan, and fix findings about personal data, sign-in, access rules and credentials. Security rules are never weakened to make something work.

## 9. Production cleanup
Remove debug console output from the production build, and remove debug/test screens and credentials. Use the name "Pennyekart" (currently "pennyekart") in the Android and app config, and check the icon and live site address.

## 10. Checklist and final report
- `PLAY_STORE_CHECKLIST.md`: URLs, Data Safety answers based on real behaviour, permissions, deletion, security and release checks, and open blockers.
- Final report with all 16 items from your brief. Nothing is reported as compliant unless it was implemented and tested.

## Testing limits
Signed-in checks are not possible in this environment for your backend. Deletion is tested by calling the server function directly on test accounts that I create for each role (customer, selling partner, utility partner, delivery staff) and then checking the database. The public request form and pages are tested in the browser. Camera, location, notifications and voice on a real phone must be tested by you after `git pull`, `npm run build` and `npx cap sync`. The report will say this clearly.

## Technical details
- Edge function `delete-account`: validates the JWT with getClaims, rejects super admins, and calls a SECURITY DEFINER SQL function `delete_my_account_data(uid)` that does the anonymise/delete work in one transaction. It then calls `auth.admin.deleteUser` with the built-in service role key. The profile row is kept but stripped where wallet/transaction foreign keys need it. Before this, auth.users FKs (`orders.user_id`, `banners.created_by`, `products.created_by/updated_by`) are checked and changed to ON DELETE SET NULL where needed.
- Migration: `account_deletion_requests` (full_name, mobile, email, reason, status, admin_notes, handled_by, handled_at) with GRANT INSERT to anon/authenticated, SELECT/UPDATE to authenticated, ALL to service_role. RLS: insert for anyone with input length checks; read/update only when `is_super_admin()` or `has_permission('read_users')`. Tighten existing policies on `storage_providers`, `chatbot_api_keys`, `profiles` after reading them.
- Edge functions `send-verification` / `check-verification` replace the logic in `VerifyAccountCard.tsx`. The code is hashed server-side, with expiry and attempt limits.
- `src/lib/permissions.ts` + `PermissionPrompt` wrap Capacitor Camera, Geolocation, PushNotifications and the mic. `initNativeApp` stops auto-registering push.
- New: `PrivacyPolicy.tsx`, `Terms.tsx`, `DeleteAccount.tsx`, `DeleteAccountSection.tsx`, `admin/DeletionRequestsPage.tsx`, `PLAY_STORE_CHECKLIST.md`. Vite `esbuild.drop` removes console output in production.

## Waiting on you
Real privacy email and business address, final Data Safety answers in Play Console, and the signed release AAB.
