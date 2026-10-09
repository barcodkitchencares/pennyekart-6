import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface SellerProfileDetailsData {
  full_name: string | null; email: string | null; mobile_number: string | null;
  date_of_birth: string | null; created_at: string; local_body_name?: string;
  district_name?: string; ward_number: number | null; company_name?: string | null;
  business_address?: string | null; business_city?: string | null; business_state?: string | null;
  business_pincode?: string | null; business_phone?: string | null; business_email?: string | null;
  gst_number?: string | null; bank_account_name?: string | null; bank_account_number?: string | null; bank_ifsc?: string | null;
}

export default function SellerProfileDetails({ partner }: { partner: SellerProfileDetailsData }) {
  const fields = (rows: [string, string | null | undefined][]) => <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">{rows.map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="break-words text-sm font-medium">{value || "—"}</dd></div>)}</dl>;
  return <Tabs defaultValue="profile">
    <TabsList><TabsTrigger value="profile">Profile</TabsTrigger><TabsTrigger value="business">Business & bank</TabsTrigger></TabsList>
    <TabsContent value="profile" className="pt-3">{fields([
      ["Full name", partner.full_name], ["Email", partner.email], ["Mobile", partner.mobile_number],
      ["Date of birth", partner.date_of_birth], ["Joined", new Date(partner.created_at).toLocaleDateString()],
      ["Local body", partner.local_body_name], ["Ward", partner.ward_number?.toString()], ["District", partner.district_name],
    ])}</TabsContent>
    <TabsContent value="business" className="pt-3">{fields([
      ["Company", partner.company_name], ["GST number", partner.gst_number], ["Business address", partner.business_address],
      ["City", partner.business_city], ["State", partner.business_state], ["Pincode", partner.business_pincode],
      ["Business phone", partner.business_phone], ["Business email", partner.business_email],
      ["Account holder", partner.bank_account_name], ["Account number", partner.bank_account_number], ["IFSC", partner.bank_ifsc],
    ])}</TabsContent>
  </Tabs>;
}