# Pennyekart – Google Play Store Checklist

## Pennyekart contact details
- [x] Privacy contact email — pennyekart@gmail.com
- [x] Business address — Pennyekart, 1st Floor, Opposite Biotech Lab, Pookottumpadam
- [x] Contact phone — 9497589094

## URLs to enter in Play Console
- Privacy policy: https://www.pennyekart.com/privacy-policy
- Account deletion: https://www.pennyekart.com/delete-account
- Terms: https://www.pennyekart.com/terms

## Data Safety answers (match real app behaviour)
| Data | Collected | Shared | Purpose | Optional |
|---|---|---|---|---|
| Name, email, phone | Yes | No (hosting processor only) | Account, orders | Email optional |
| Address, precise location | Yes | With delivery partner for the order | Delivery | Location optional |
| Purchase history, wallet records | Yes | No | Orders, accounting | Required |
| Photos (product/profile) | Yes (partners/users who upload) | No | App functionality | Optional |
| Audio (voice input) | Processed on device/browser speech service, not stored | No | Penny Assistant | Optional |
| Device push token | Only if notifications turned on | Firebase (processor) | Order updates | Optional |
- Data encrypted in transit: Yes (HTTPS)
- Users can request deletion: Yes (in-app + web page)

## Android permissions declared
INTERNET, CAMERA, ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION, POST_NOTIFICATIONS, RECORD_AUDIO (Penny Assistant voice only).
No background location, contacts, SMS, phone or broad storage permissions.

## Before uploading
- [ ] `git pull`, `npm install`, `npm run build`, `npx cap sync android`
- [ ] Add `google-services.json` if push notifications are used
- [ ] Build signed release AAB in Android Studio (bump versionCode)
- [ ] Complete Data Safety, Content rating, Target audience, Ads declaration
- [ ] Provide a test login for Google reviewers
- [ ] Test on a real device: camera, location, notifications, microphone prompts, account deletion
