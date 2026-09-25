# Pennyekart: Final Play Store Audit and Fixes

Work through the uploaded 32-section checklist. Keep the current design and how the business works. Fix real problems, report the rest honestly, and never mark something as tested without testing it.

## 1. Confirmed bug: deletion request status
- The database only accepts: pending, processing, completed, rejected. The admin Deletion Requests page sends "in_progress", so saving that status fails.
- Change it to "processing" only on the deletion requests page (list, filter, badge, update). Leave the utility-service "in_progress" status alone because it belongs to a different workflow.
- Test on the page: signed in as admin, move a test request through processing, notes, completed and rejected.

## 2. Account deletion and data audit
- Read the deletion database function and list every table that holds a user ID, phone, name or address (orders, service requests, wallets, communities, notifications, addresses, search history, penny prime, scratch cards, partner areas, delivery assignments).
- Where personal details are still left in kept records, add them to the anonymising step. Financial totals stay.
- Update the deletion wording and Privacy Policy so they match what the system actually does.

## 3. Privacy Policy vs what the app really collects
- Check each item in the policy against the code. Date of birth is collected at sign-up and stored, so it stays, with its reason explained.
- Remove any claim that the code doesn't support.

## 4. Permissions
- Camera: check the camera code in partner sign-up, partner photo and the permission popup. If it only uses the phone's photo picker, remove the CAMERA permission and the unused camera package. If it does open the camera, keep it behind the explanation popup.
- Location: confirm there's no background location and it's only asked from cart and the address form, with a clear message if you say no.
- Microphone: only asked when you tap the voice button. Document where the voice goes (the phone's own speech recognition).
- Notifications: startup only turns on notifications if they were allowed before and never asks. Protect against crashes if push setup (Firebase) is missing.

## 5. Android, config and release
- Check the Android manifest, Capacitor settings, app ID (kept as it is), live site address, app icon and splash screen, back button handling, and hidden debug output.
- Check that every link to the legal pages and in the footer works.

## 6. Security
- Run the database linter and security scan. Fix findings about personal data, including making sure only admins can read or update deletion requests.

## 7. Documents and report
- Rewrite the Data Safety section of PLAY_STORE_CHECKLIST.md from the actual code: what's collected, why, whether it's shared, whether it's optional, that it's encrypted in transit, and that it can be deleted.
- Final report: what was fixed, files, database changes, what was tested and the results, and what's still open.

## What only you can do
- Test on a real phone: permission popups, push notifications, the back button.
- Signed-in deletion tests for each account type, unless you give me a test login.
- A test account for Google reviewers, building the signed AAB, and filling in the Play Console forms.

## Technical details
- `src/pages/admin/DeletionRequestsPage.tsx`: STATUSES becomes processing.
- Changes to `delete_account_data` go through a migration (CREATE OR REPLACE), only if the audit finds personal data it missed.
- Camera removal touches `AndroidManifest.xml` and `package.json` (`@capacitor/camera`), and then you run `npx cap sync`.
- `src/lib/native.ts`: wrap push registration in try/catch.
