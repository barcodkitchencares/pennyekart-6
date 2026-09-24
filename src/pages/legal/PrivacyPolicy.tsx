import LegalPageLayout, { ContactBlock } from "@/components/LegalPageLayout";

const PrivacyPolicy = () => (
  <LegalPageLayout title="Privacy Policy" description="How Pennyekart collects, uses, shares and deletes your personal information.">
    <p>This policy explains what information Pennyekart ("we") collects when you use our website and Android app, why we collect it, and your choices.</p>

    <h2>Information we collect</h2>
    <ul>
      <li><b>Account and login:</b> name, mobile number, email, password (stored encrypted by our login provider), date of birth, panchayath/municipality and ward.</li>
      <li><b>Location:</b> your device location only when you tap to use it, to set a delivery pin or find nearby services. We do not track location in the background.</li>
      <li><b>Camera and photos:</b> images you choose to take or upload for products or your profile photo.</li>
      <li><b>Microphone:</b> only while you use voice input in Penny Assistant. Speech is converted to text by your device/browser speech service; we do not store audio recordings.</li>
      <li><b>Notifications:</b> a device token, if you turn on notifications, to send order and service updates.</li>
      <li><b>Orders and delivery:</b> items ordered, amounts, delivery address, contact name and phone.</li>
      <li><b>Seller, utility and delivery partners:</b> business name, GST number, business address and contact, bank account details for settlements, service areas.</li>
      <li><b>Service requests:</b> the service chosen, contact details and address.</li>
      <li><b>Wallet and rewards:</b> wallet balance and transaction history. We do not store card or UPI details.</li>
      <li><b>Usage:</b> search terms and notification reads, used to improve the catalogue.</li>
    </ul>

    <h2>How we use it</h2>
    <ul>
      <li>To create your account, process orders, deliver items and provide services.</li>
      <li>To pay partners and keep financial records.</li>
      <li>To send order, delivery and service updates.</li>
      <li>To keep the platform secure and prevent fraud.</li>
    </ul>

    <h2>Sharing</h2>
    <ul>
      <li>With the seller, utility partner or delivery staff handling your order — only what they need (name, phone, address).</li>
      <li>Service providers: Supabase (database, login, file storage), Google Maps (maps and location pins), Firebase Cloud Messaging (notifications), image storage providers.</li>
      <li>WhatsApp: when you tap a WhatsApp button, the WhatsApp app opens and its own privacy policy applies.</li>
      <li>When required by law.</li>
    </ul>
    <p>We do not sell your personal information.</p>

    <h2>Storage and security</h2>
    <p>Data is stored on secure cloud servers with encrypted connections. Access is restricted by user role and database access rules.</p>

    <h2>Retention</h2>
    <p>We keep your data while your account is active. Order, service and payment records are kept (anonymised after account deletion) as long as tax and accounting laws require.</p>

    <h2>Deleting your data</h2>
    <p>You can delete your account from your profile or dashboard, or at <a className="underline" href="/delete-account">/delete-account</a>.</p>

    <h2>Your rights</h2>
    <p>You can view and edit your profile, turn off notifications, deny location/camera/microphone access, and request deletion of your data.</p>

    <h2>Children</h2>
    <p>Pennyekart is not intended for children under 13.</p>

    <h2>Contact</h2>
    <ContactBlock />
  </LegalPageLayout>
);

export default PrivacyPolicy;
