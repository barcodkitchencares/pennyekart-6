import DeleteAccountDialog from "@/components/DeleteAccountDialog";
import LegalLinks from "@/components/LegalLinks";

/** Delete Account + Privacy/Terms links, shown at the bottom of profile and partner dashboards. */
const AccountSettingsSection = ({ className }: { className?: string }) => (
  <section className={className ?? "mx-auto max-w-5xl space-y-3 p-4"}>
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <p className="text-sm font-semibold">Account</p>
      <p className="text-xs text-muted-foreground">Permanently delete your account and personal data.</p>
      <DeleteAccountDialog />
    </div>
    <LegalLinks showDelete />
  </section>
);

export default AccountSettingsSection;
