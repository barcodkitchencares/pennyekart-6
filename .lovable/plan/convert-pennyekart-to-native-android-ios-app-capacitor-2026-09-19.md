# Convert Pennyekart to Native Android + iOS App (Capacitor)

Wrap the existing Pennyekart site in a native app shell using Capacitor. The app loads the live website, so every site update appears in the app instantly — no rebuilds needed. Native features: pull-to-refresh, camera, GPS location, and push notifications.

## What I will set up here (in the project)

1. **Capacitor core setup**
   - Install `@capacitor/core`, `@capacitor/cli`, `@capacitor/android`, `@capacitor/ios`
   - Initialize Capacitor: app ID `app.lovable.p5b3cdc4867ea449aa3d42aa99c183c55`, app name `pennyekart`
   - Configure `capacitor.config.ts` to load the live site (`server.url` → the published site URL, so the app always shows the latest version; during development it points at the sandbox preview for hot-reload)

2. **Native plugins**
   - `@capacitor/camera` — photo capture for profile pictures and product uploads
   - `@capacitor/geolocation` — the existing "Use my current GPS location" feature works natively
   - `@capacitor/push-notifications` — order/admin notifications on the phone
   - `@capacitor/app`, `@capacitor/splash-screen`, `@capacitor/status-bar` — app lifecycle, branded splash screen, themed status bar
   - Android permissions added to `AndroidManifest.xml` (camera, fine/coarse location, notifications); iOS usage descriptions added to `Info.plist`

3. **Pull-to-refresh**
   - A small Capacitor-aware component: when running inside the native app, swiping down at the top of the page reloads the web view (native-feel spinner)
   - No effect in the normal browser

4. **App detection helper**
   - A tiny utility (`Capacitor.isNativePlatform()`) so native-only behavior (push registration, pull-to-refresh) never disturbs the web app

5. **App icon & splash**
   - Use the existing Pennyekart logo as the app icon and splash screen source (final icon generation happens on your machine with `@capacitor/assets`)

## What you do on your own computer (guided steps)

The sandbox can't build APK/AAB files — that needs Android Studio (and a Mac + Xcode for iOS). After I finish the setup:

1. Export the project to GitHub and `git pull` it to your computer
2. `npm install`
3. `npx cap add android` and `npx cap add ios` (iOS needs a Mac)
4. `npm run build`, then `npx cap sync`
5. Generate icons/splash: `npx @capacitor/assets generate`
6. **Test on phone:** `npx cap run android` (or `npx cap run ios` on a Mac)
7. **Play Store upload:**
   - Open the `android` folder in Android Studio
   - Build → Generate Signed App Bundle (creates the `.aab` file Play Store requires)
   - Upload the `.aab` in your Play Console → create app listing (screenshots, description, privacy policy)
   - Submit for review (typically a few days)

## Technical notes

- No changes to existing app features — this adds a native wrapper around the current site
- `capacitor.config.ts` uses `server.cleartext` only for the dev sandbox URL; production uses https
- Supabase auth and the Vercel proxy (`/supabase/*`) work unchanged inside the native web view
- Push notifications need a Firebase project (free) — I'll include the `google-services.json` placement step in the final instructions
- iOS App Store also requires a paid Apple Developer account ($99/year) when you're ready for iPhone

## Blog guide

After setup, read the official guide for publishing details: https://lovable.dev/blog (search "Capacitor mobile app")
