# Play Store Compliance: Privacy, Account Deletion, Permissions, Security

No changes to products, sellers, orders, delivery, services, wards or partner features.

## 1. Delete Account (in the app)
- New "Delete Account" section at the bottom of the customer profile, and on the selling-partner, utility-partner and delivery-staff dashboards.
- Confirmation dialog explains what gets deleted and what is kept, and asks the user to type DELETE before continuing.
- On success: sign out, show a success message, go to the home page. On failure: show an error message.

**What gets deleted:** profile details (name, email, mobile, date of birth, photo, bank and business details, location), saved addresses, search history, community membership and invites, notification history, and the login account.
**What is kept but anonymised:** orders, wallet/payment transactions and service requests stay for tax and accounting, with name, phone and address replaced by "Deleted user".
- If the user created a community, it is handed over or deleted (same rule as the existing delete-community option).
- Super admin accounts cannot delete themselves this way.

## 2. Privacy Policy page (`/privacy-policy`)
- Public page covering every topic you listed: data collected, login, location, camera, notifications, orders and delivery, sellers/partners, storage and protection, sharing with service providers (Supabase hosting, Google Maps, Firebase push, WhatsApp links), retention, user rights, how to delete, and privacy contact.
- Links added to: login/signup pages, customer profile, partner dashboards, and the site footer.
- Contact email and business address are placeholders (e.g. privacy@pennyekart.com). You will need to send me the real ones.

## 3. Public deletion request page (`/delete-account`)
- Works without the app and without signing in. Shows Pennyekart branding and explains what is deleted and what is kept.
- If signed in: a button to delete the account right away (same process as in section 1).
- If not signed in: a form (name, registered mobile, optional email, reason) that saves a request for admins. Admins see these requests in a new "Deletion Requests" list under Users and mark them done.
- Also add a "Terms" link and an "Account deletion" link to the footer.

## 4. Android permissions
Currently only INTERNET is declared. Add only what the app uses:
- CAMERA (product/profile photos), ACCESS_FINE_LOCATION + ACCESS_COARSE_LOCATION (delivery address pin), POST_NOTIFICATIONS (order updates).
- Do not add background location, contacts, SMS, phone, microphone-in-background or storage-wide permissions. Photo picking uses the system picker, so no storage permission is needed.
- Voice assistant uses the microphone: RECORD_AUDIO is added only because the Penny Assistant voice button needs it. Tell me if you'd rather remove voice input instead.

## 5. Explaining permissions first
- A small explanation popup appears right before each first request, using the wording you gave (camera, location, notifications, microphone). "Continue" asks the system; "Not now" cancels.
- Notification permission is no longer requested at app launch. It is requested after the user's first order or from a "Turn on notifications" option in the profile.

## 6. Security review and fixes
- Scan the code for exposed keys, passwords and service keys; move anything sensitive to server-side storage.
- Known risk areas to check and fix: the storage-provider credentials and chatbot API keys held in database tables (make sure only super admins can read them, never customers); `profiles` RLS (customers must not read other users' bank details or verification codes); the verification code is currently created in the browser, so move code creation and checking to a server function so it can't be read or skipped.
- Run the database linter and security scan; fix findings related to personal data.

## 7. Release readiness
- Remove debug console output from the production build and hide any test/debug screens.
- Check that the app name "Pennyekart", icon, and live site address are used everywhere in the app config.
- Add a `PLAY_STORE_CHECKLIST.md` with the Data Safety answers matching the app's real behaviour, and final checks you need to do in the Play Console.

## Technical details
- Edge function `delete-account`: verifies the caller's JWT, anonymises `orders.shipping_address`, `utility_service_requests` contact fields and profile PII, deletes `customer_addresses`, `customer_search_history`, `notification_reads`, community rows, then `auth.admin.deleteUser` using the function's built-in service role key (never sent to the browser). Profile row kept but stripped where FKs from wallets/transactions need it.
- Migration: `account_deletion_requests` table (name, mobile, email, reason, status, handled_by) with GRANTs; anon may insert only, admins (`is_super_admin()` / `has_permission('read_users')`) may read/update. Tighten RLS on `storage_providers`, `chatbot_api_keys`, and `profiles` sensitive columns after reviewing current policies.
- Edge functions `send-verification` / `check-verification` replace the client-side code generation in `VerifyAccountCard.tsx`.
- `src/lib/permissions.ts` + `PermissionPrompt` component wrap Capacitor Camera, Geolocation, PushNotifications; `initNativeApp` stops auto-registering push.
- New pages: `PrivacyPolicy.tsx`, `DeleteAccount.tsx`, `Terms.tsx`; component `DeleteAccountSection.tsx`; admin `DeletionRequestsPage.tsx`.
- After changes you run `git pull` and `npx cap sync`.

## What stays for you
- Real privacy contact email and address.
- Filling in the Data Safety form in Play Console using the checklist.
- Building the signed release AAB in Android Studio.
