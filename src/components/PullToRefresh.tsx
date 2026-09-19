import { useEffect, useRef, useState } from "react";
import { Loader2, ArrowDown } from "lucide-react";
import { isNativeApp } from "@/lib/native";

const TRIGGER_PX = 90;
const MAX_PULL_PX = 140;

/**
 * Native-app-only pull-to-refresh. When the app runs inside the Capacitor
 * shell, swiping down from the top of a scrolled-to-top page pulls down a
 * spinner and reloads the web view on release. Renders nothing in browsers.
 */
const PullToRefresh = () => {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const active = useRef(false);

  useEffect(() => {
    if (!isNativeApp()) return;

    const onTouchStart = (e: TouchEvent) => {
      if (refreshing) return;
      if (window.scrollY <= 0 && e.touches.length === 1) {
        startY.current = e.touches[0].clientY;
        active.current = true;
      } else {
        active.current = false;
        startY.current = null;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!active.current || startY.current === null || refreshing) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy > 0 && window.scrollY <= 0) {
        // Resistance curve so the pull feels native.
        setPull(Math.min(MAX_PULL_PX, dy * 0.5));
        if (dy > 10) e.preventDefault();
      } else {
        setPull(0);
      }
    };

    const onTouchEnd = () => {
      if (!active.current) return;
      active.current = false;
      startY.current = null;
      setPull((current) => {
        if (current >= TRIGGER_PX * 0.5 && !refreshing) {
          setRefreshing(true);
          // Small delay so the spinner is visible before reload.
          setTimeout(() => window.location.reload(), 350);
          return TRIGGER_PX * 0.5;
        }
        return 0;
      });
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [refreshing]);

  if (!isNativeApp()) return null;

  const visible = pull > 0 || refreshing;
  const height = refreshing ? TRIGGER_PX * 0.5 : pull;
  const ready = pull >= TRIGGER_PX * 0.5;

  return (
    <div
      className="fixed inset-x-0 top-0 z-[90] flex items-end justify-center overflow-hidden pointer-events-none transition-[height] duration-150"
      style={{ height: visible ? height : 0 }}
      aria-hidden
    >
      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-card shadow-md border">
        {refreshing ? (
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        ) : (
          <ArrowDown
            className={`h-5 w-5 text-primary transition-transform ${ready ? "rotate-180" : ""}`}
          />
        )}
      </div>
    </div>
  );
};

export default PullToRefresh;
