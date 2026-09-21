# Verify the four key screens at phone size

Check that the screens you care about work correctly at phone dimensions, the same size they will appear inside the Android app.

## What I will check

1. **Home** — banners, categories, product rows and the bottom bar all fit and load.
2. **Admin dashboard** — signed in as an admin account, page loads without errors.
3. **/utility-services** — the categories → suppliers → services drill-down opens correctly.
4. **/customer/profile** — profile, verification badge, My Community and the addresses tab load.

## How

- Sign in inside the preview using a test session, then visit each screen at a phone-sized window (roughly 390x844).
- Capture a screenshot of each screen and read any errors the page reports.
- Report exactly what loads, what looks wrong, and anything that breaks.

## Fixes

If a screen fails to load or is visibly broken at phone size, I will note it and propose the fix before changing anything. No code changes are part of this check.

## Note on the app itself

Installing on your phone and producing the Play Store file has to happen on your own computer with Android Studio — the sandbox has no device access and cannot build Android packages. The steps are already written up in MOBILE_APP.md in the project, and I can walk you through them whenever you are ready.
