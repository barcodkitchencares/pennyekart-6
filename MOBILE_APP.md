# Pennyekart Mobile App — Build & Publish Guide

The project is now wrapped with **Capacitor**, so the same website runs as a
native Android and iOS app. The app loads the live site
(`https://www.pennyekart.com`), so every website update appears in the app
instantly — you only rebuild the app when native settings change.

Already set up in this project:

- Capacitor config (`capacitor.config.ts`) — app ID `app.lovable.p5b3cdc4867ea449aa3d42aa99c183c55`, app name `pennyekart`
- Native plugins: Camera, Geolocation, Push Notifications, App, Splash Screen, Status Bar
- Pull-to-refresh (swipe down at the top of any page reloads — native app only)
- Android hardware back-button handling
- Native bootstrap in `src/lib/native.ts` (safe no-op in the browser)

---

## 1. Get the project on your computer

1. Click **Export to GitHub** in Lovable, then clone/pull the repository
2. `npm install`

## 2. Add the native platforms

```bash
npx cap add android
npx cap add ios        # Mac only — requires Xcode
npm run build
npx cap sync
```

> Every time you `git pull` new changes: `npm install && npm run build && npx cap sync`

## 3. App icon & splash screen

```bash
npm install -D @capacitor/assets
npx @capacitor/assets generate --iconBackgroundColor '#1a120b' --splashBackgroundColor '#1a120b'
```

Place a square `assets/logo.png` (1024×1024) in the project root first — the
existing `src/assets/logo.png` works as the source.

## 4. Permissions

**Android** — `android/app/src/main/AndroidManifest.xml`, inside `<manifest>`:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

**iOS** — `ios/App/App/Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>Used to take photos for profile pictures and product images.</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>Used to set your delivery location.</string>
```

## 5. Push notifications (Firebase — free)

1. Create a project at https://console.firebase.google.com
2. Add an Android app with package `app.lovable.p5b3cdc4867ea449aa3d42aa99c183c55`
3. Download `google-services.json` → place it in `android/app/`
4. For iOS: add an iOS app in Firebase, download `GoogleService-Info.plist` →
   add it to the Xcode project, and enable the Push Notifications capability

The app already requests permission and registers the device on launch
(`src/lib/native.ts`); notification taps deep-link into the app via a `url`
field in the notification payload.

## 6. Test on a real phone

```bash
npx cap run android    # needs Android Studio + a phone/emulator
npx cap run ios        # needs a Mac with Xcode
```

For hot-reload during development, temporarily point `server.url` in
`capacitor.config.ts` at the sandbox preview URL (see the comment in that
file), then `npx cap sync`.

## 7. Play Store upload

1. Open the `android` folder in **Android Studio**
2. **Build → Generate Signed App Bundle / APK → Android App Bundle (.aab)**
   - First time: create a keystore (keep the file + passwords safe — you need
     them for every future update)
3. In **Play Console** (you already have an account):
   - Create app → upload the `.aab`
   - Fill the store listing: screenshots, description, icon
   - Complete the privacy policy, data safety, and content rating sections
4. Submit for review — typically approved within a few days

## 8. iOS App Store (when ready)

- Requires a Mac, Xcode, and an Apple Developer account ($99/year)
- Open `ios/App/App.xcworkspace` in Xcode → set your team → **Product →
  Archive** → upload to App Store Connect

---

Full walkthrough with screenshots:
https://lovable.dev/blog — search **"Capacitor mobile app"**
