import LegalPageLayout, { ContactBlock } from "@/components/LegalPageLayout";

const Terms = () => (
  <LegalPageLayout title="Terms & Conditions" description="Terms for using the Pennyekart marketplace, delivery and local services.">
    <p>By using Pennyekart you agree to these terms.</p>
    <h2>Accounts</h2>
    <ul>
      <li>Give accurate details and keep your password safe.</li>
      <li>You are responsible for activity on your account.</li>
      <li>We may suspend accounts that misuse the platform.</li>
    </ul>
    <h2>Orders and prices</h2>
    <ul>
      <li>Prices, stock and delivery charges are shown before you order and may change.</li>
      <li>Orders may be cancelled if an item is unavailable or the address is outside the service area.</li>
      <li>Delivery areas are limited to supported panchayaths/municipalities and wards.</li>
    </ul>
    <h2>Wallet and rewards</h2>
    <p>Wallet points and rewards have no cash value unless stated, and follow the usage rules shown in the app.</p>
    <h2>Utility services</h2>
    <p>Utility services are provided by independent partners. Pennyekart connects you with them and handles the request.</p>
    <h2>Partners</h2>
    <p>Selling, utility and delivery partners must follow applicable laws, list accurate products and services, and fulfil accepted orders.</p>
    <h2>Liability</h2>
    <p>To the extent allowed by law, Pennyekart is not liable for indirect losses from using the platform.</p>
    <h2>Changes</h2>
    <p>We may update these terms. Continued use means you accept the updated terms.</p>
    <h2>Contact</h2>
    <ContactBlock />
  </LegalPageLayout>
);

export default Terms;
