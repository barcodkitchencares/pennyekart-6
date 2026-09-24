import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { enableNotifications } from "@/lib/native";

const NotificationToggle = () => {
  const [busy, setBusy] = useState(false);
  const granted = typeof Notification !== "undefined" && Notification.permission === "granted";
  const [on, setOn] = useState(granted);
  if (on) return null;
  return (
    <Button variant="outline" className="w-full gap-2" disabled={busy} onClick={async () => {
      setBusy(true);
      const ok = await enableNotifications();
      setBusy(false);
      if (ok) { setOn(true); toast.success("Notifications turned on"); }
      else toast.info("Notifications are off. You can turn them on later in your phone settings.");
    }}>
      <Bell className="h-4 w-4" /> Turn on notifications
    </Button>
  );
};

export default NotificationToggle;
