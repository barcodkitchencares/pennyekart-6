import { useEffect, useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PERMISSION_TEXT, registerPermissionListener, type PermissionKind } from "@/lib/permissionPrompt";

const PermissionPrompt = () => {
  const [pending, setPending] = useState<{ kind: PermissionKind; resolve: (ok: boolean) => void } | null>(null);

  useEffect(() => {
    registerPermissionListener(setPending);
    return () => registerPermissionListener(null);
  }, []);

  const finish = (ok: boolean) => { pending?.resolve(ok); setPending(null); };
  const text = pending ? PERMISSION_TEXT[pending.kind] : null;

  return (
    <AlertDialog open={!!pending} onOpenChange={(o) => { if (!o) finish(false); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{text?.title}</AlertDialogTitle>
          <AlertDialogDescription>{text?.body}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => finish(false)}>Not now</AlertDialogCancel>
          <AlertDialogAction onClick={() => finish(true)}>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default PermissionPrompt;
