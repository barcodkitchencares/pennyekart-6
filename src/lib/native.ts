import { Capacitor } from "@capacitor/core";

/**
 * True only when running inside the native Android/iOS shell.
 * Everything native must be gated behind this so the web app is untouched.
 */
export const isNativeApp = () => Capacitor.isNativePlatform();

export const nativePlatform = (): "android" | "ios" | "web" =>
  Capacitor.getPlatform() as "android" | "ios" | "web";

/**
 * One-time native bootstrap. Safe to call on the web — it no-ops there.
 *
 * - Themed status bar
 * - Hides the native splash screen once React has mounted
 * - Android hardware back button: navigates back in history, or moves the
 *   app to the background when already at the top level
 * - Push notifications: requests permission and registers the device.
 *   The FCM token arrives in the "registration" listener — wire it to a
 *   profile field here when you're ready to target devices server-side.
 */
export const initNativeApp = async () => {
  if (!isNativeApp()) return;

  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({ style: Style.Dark });
    if (Capacitor.getPlatform() === "android") {
      await StatusBar.setBackgroundColor({ color: "#1a120b" });
      await StatusBar.setOverlaysWebView({ overlay: false });
    }
  } catch {
    // status bar plugin unavailable — ignore
  }

  try {
    const { SplashScreen } = await import("@capacitor/splash-screen");
    // Give the web splash a moment, then drop the native one.
    setTimeout(() => SplashScreen.hide().catch(() => {}), 800);
  } catch {
    // ignore
  }

  try {
    const { App } = await import("@capacitor/app");
    await App.addListener("backButton", ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        App.minimizeApp();
      }
    });
  } catch {
    // ignore
  }

  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");
    const perm = await PushNotifications.requestPermissions();
    if (perm.receive === "granted") {
      await PushNotifications.register();
    }
    await PushNotifications.addListener("registration", (token) => {
      // Device push token — ready to be stored against the user's profile
      // when server-side push targeting is added.
      console.log("[push] device token registered", token.value.slice(0, 12) + "…");
    });
    await PushNotifications.addListener("registrationError", (err) => {
      console.warn("[push] registration failed", err.error);
    });
    await PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
      const url = (action.notification.data as { url?: string } | undefined)?.url;
      if (url && url.startsWith("/")) {
        window.location.href = url;
      }
    });
  } catch {
    // push unavailable (e.g. missing google-services.json yet) — ignore
  }
};
