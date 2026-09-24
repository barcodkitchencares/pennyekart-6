import LegalLinks from "@/components/LegalLinks";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import LegalPageLayout, { ContactBlock } from "@/components/LegalPageLayout";
import DeleteAccountDialog, { DeletionInfo } from "@/components/DeleteAccountDialog";

const DeleteAccount = () => {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [form, setForm] = useState({ full_name: "", mobile: "", email: "", reason: "" });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSignedIn(!!s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const mobile = form.mobile.replace(/\D/g, "");
    if (!form.full_name.trim() || mobile.length < 10) { toast.error("Enter your name and registered 10-digit mobile number"); return; }
    setBusy(true);
    const { error } = await supabase.from("account_deletion_requests").insert({
      full_name: form.full_name.trim().slice(0, 100),
      mobile: mobile.slice(-10),
      email: form.email.trim().slice(0, 255) || null,
      reason: form.reason.trim().slice(0, 1000) || null,
    });
    setBusy(false);
    if (error) { toast.error("Could not send your request. Please try again."); return; }
    setSent(true);
  };

  return (
    <LegalPageLayout title="Delete your Pennyekart account" description="Request deletion of your Pennyekart account and personal data.">
      <p>You can delete your Pennyekart account and personal data at any time, with or without the app installed.</p>
      <DeletionInfo />

      <h2>How to delete</h2>
      <ul>
        <li><b>In the app:</b> open Profile (customers) or your Dashboard (partners) and tap <b>Delete Account</b>, then type DELETE.</li>
        <li><b>On this page:</b> sign in and tap Delete My Account, or send a request below. Our team verifies and completes requests within 30 days.</li>
      </ul>

      {signedIn === null ? null : signedIn ? (
        <div className="rounded-lg border p-4 space-y-3">
          <p className="text-sm">You are signed in. Deleting takes effect immediately.</p>
          <DeleteAccountDialog triggerClassName="w-full sm:w-auto" />
        </div>
      ) : sent ? (
        <div className="rounded-lg border p-4 text-sm">Your request has been received. We will contact you on your registered mobile number.</div>
      ) : (
        <form onSubmit={submit} className="rounded-lg border p-4 space-y-3">
          <p className="text-sm">
            Have the app? <Link to="/customer/login" className="underline">Sign in</Link> to delete instantly. Or send a request:
          </p>
          <div className="space-y-1"><Label htmlFor="dr-name">Name</Label><Input id="dr-name" required maxLength={100} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
          <div className="space-y-1"><Label htmlFor="dr-mobile">Registered mobile number</Label><Input id="dr-mobile" required inputMode="numeric" maxLength={13} value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} /></div>
          <div className="space-y-1"><Label htmlFor="dr-email">Email (optional)</Label><Input id="dr-email" type="email" maxLength={255} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div className="space-y-1"><Label htmlFor="dr-reason">Reason (optional)</Label><Textarea id="dr-reason" maxLength={1000} rows={3} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
          <Button type="submit" variant="destructive" disabled={busy}>Request account deletion</Button>
        </form>
      )}

      <h2>Privacy contact</h2>
      <ContactBlock />
      <LegalLinks className="mt-6" />
    </LegalPageLayout>
  );
};

export default DeleteAccount;
