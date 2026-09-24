import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const DeletionInfo = () => (
  <div className="space-y-3 text-sm">
    <div>
      <p className="font-semibold">Deleted permanently</p>
      <ul className="list-disc pl-5 text-muted-foreground">
        <li>Name, email, mobile number, date of birth and profile photo</li>
        <li>Bank and business details, personal location</li>
        <li>Saved addresses, search history, notification history</li>
        <li>Community membership and invites, service areas</li>
        <li>Your login</li>
      </ul>
    </div>
    <div>
      <p className="font-semibold">Kept (anonymised) for legal and accounting reasons</p>
      <ul className="list-disc pl-5 text-muted-foreground">
        <li>Orders and service requests, shown as "Deleted user"</li>
        <li>Wallet and payment records</li>
        <li>Sellers' products and services are switched off, not shown to customers</li>
      </ul>
    </div>
  </div>
);

const DeleteAccountDialog = ({ triggerClassName, redirectTo = "/" }: { triggerClassName?: string; redirectTo?: string }) => {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const handleDelete = async () => {
    if (text !== "DELETE") return;
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("delete-account", { body: { confirm: "DELETE" } });
    if (error || (data as { error?: string } | null)?.error) {
      let msg = (data as { error?: string } | null)?.error;
      if (!msg && error && "context" in error) {
        try { msg = (await (error as { context: Response }).context.json()).error; } catch { /* ignore */ }
      }
      setBusy(false);
      toast.error(msg || "Account deletion failed. Nothing was deleted. Please try again.");
      return;
    }
    await supabase.auth.signOut().catch(() => {});
    toast.success("Your account has been deleted.");
    setOpen(false);
    navigate(redirectTo, { replace: true });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setText(""); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className={triggerClassName ?? "w-full gap-2 border-destructive/40 text-destructive hover:bg-destructive/10"}>
          <Trash2 className="h-4 w-4" /> Delete Account
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-destructive">Delete your account?</DialogTitle>
          <DialogDescription>This cannot be undone.</DialogDescription>
        </DialogHeader>
        <DeletionInfo />
        <div className="space-y-1">
          <label htmlFor="confirm-delete" className="text-sm font-medium">Type DELETE to confirm</label>
          <Input id="confirm-delete" value={text} onChange={(e) => setText(e.target.value)} autoComplete="off" />
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={busy || text !== "DELETE"}>
            {busy && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Delete my account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteAccountDialog;
