export type PermissionKind = "camera" | "location" | "notifications" | "microphone";

export const PERMISSION_TEXT: Record<PermissionKind, { title: string; body: string }> = {
  camera: { title: "Allow camera?", body: "Camera access is required to capture product or profile images." },
  location: { title: "Allow location?", body: "Location access helps us provide nearby products, delivery and location-based services." },
  notifications: { title: "Turn on notifications?", body: "Notifications help you receive order and service updates." },
  microphone: { title: "Allow microphone?", body: "Microphone access is required for voice input in Penny Assistant." },
};

type Pending = { kind: PermissionKind; resolve: (ok: boolean) => void };
let listener: ((p: Pending | null) => void) | null = null;

export const registerPermissionListener = (fn: typeof listener) => { listener = fn; };

const key = (k: PermissionKind) => `perm_explained_${k}`;

/**
 * Shows a short explanation before the first system permission request.
 * Resolves true on "Continue" (or if already explained), false on "Not now".
 */
export const explainPermission = (kind: PermissionKind): Promise<boolean> => {
  try { if (localStorage.getItem(key(kind)) === "1") return Promise.resolve(true); } catch { /* ignore */ }
  if (!listener) return Promise.resolve(true);
  return new Promise((resolve) => {
    listener!({
      kind,
      resolve: (ok) => {
        if (ok) { try { localStorage.setItem(key(kind), "1"); } catch { /* ignore */ } }
        resolve(ok);
      },
    });
  });
};
