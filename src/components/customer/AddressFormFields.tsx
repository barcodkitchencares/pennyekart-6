import { explainPermission } from "@/lib/permissionPrompt";
import { useState } from "react";
import { Loader2, LocateFixed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export interface AddressFormValues {
  label: string;
  contact_name: string;
  contact_phone: string;
  address_line1: string;
  address_line2: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  is_default: boolean;
}

export const emptyAddressForm: AddressFormValues = {
  label: "Home",
  contact_name: "",
  contact_phone: "",
  address_line1: "",
  address_line2: "",
  landmark: "",
  city: "",
  state: "Kerala",
  pincode: "",
  latitude: null,
  longitude: null,
  is_default: false,
};

export const validateAddressForm = (form: AddressFormValues): string | null => {
  if (!form.contact_name.trim()) return "Enter a name";
  if (form.contact_phone.replace(/\D/g, "").length < 10) return "Enter a valid 10-digit phone number";
  if (!form.address_line1.trim()) return "Enter the address";
  if (form.pincode && !/^\d{6}$/.test(form.pincode)) return "Pincode must be 6 digits";
  return null;
};

export const formatAddressText = (a: {
  address_line1: string;
  address_line2?: string | null;
  landmark?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
}) => [a.address_line1, a.address_line2, a.landmark, a.city, a.state, a.pincode].filter(Boolean).join(", ");

interface Props {
  form: AddressFormValues;
  setForm: (updater: (f: AddressFormValues) => AddressFormValues) => void;
  showLabel?: boolean;
  showDefaultToggle?: boolean;
}

const AddressFormFields = ({ form, setForm, showLabel = true, showDefaultToggle = true }: Props) => {
  const [locating, setLocating] = useState(false);

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Location is not available on this device");
      return;
    }
    setLocating(true);
    explainPermission("location").then((ok) => ok && navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({ ...f, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
        setLocating(false);
        toast.success("Location captured");
      },
      () => {
        setLocating(false);
        toast.error("Please allow location access and try again");
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  return (
    <div className="space-y-3">
      {showLabel && (
        <div>
          <Label>Address type</Label>
          <Select value={form.label} onValueChange={(v) => setForm((f) => ({ ...f, label: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Home">Home</SelectItem>
              <SelectItem value="Work">Work</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Name</Label>
          <Input value={form.contact_name} onChange={(e) => setForm((f) => ({ ...f, contact_name: e.target.value }))} placeholder="Full name" />
        </div>
        <div>
          <Label>Phone</Label>
          <Input value={form.contact_phone} inputMode="numeric" maxLength={10}
            onChange={(e) => setForm((f) => ({ ...f, contact_phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
            placeholder="10-digit number" />
        </div>
      </div>
      <div>
        <Label>House / Flat, Building</Label>
        <Textarea rows={2} value={form.address_line1} onChange={(e) => setForm((f) => ({ ...f, address_line1: e.target.value }))} placeholder="House name/number, street" />
      </div>
      <div>
        <Label>Area / Locality</Label>
        <Input value={form.address_line2} onChange={(e) => setForm((f) => ({ ...f, address_line2: e.target.value }))} placeholder="Area, post office" />
      </div>
      <div>
        <Label>Landmark (optional)</Label>
        <Input value={form.landmark} onChange={(e) => setForm((f) => ({ ...f, landmark: e.target.value }))} placeholder="Near..." />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label>City</Label>
          <Input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
        </div>
        <div>
          <Label>State</Label>
          <Input value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} />
        </div>
        <div>
          <Label>Pincode</Label>
          <Input value={form.pincode} inputMode="numeric" maxLength={6}
            onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) }))} />
        </div>
      </div>

      <Button type="button" variant="outline" className="w-full" onClick={useMyLocation} disabled={locating}>
        {locating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <LocateFixed className="h-4 w-4 mr-2" />}
        {form.latitude != null ? "Update my current location" : "Use my current location"}
      </Button>
      {form.latitude != null && (
        <p className="text-xs text-muted-foreground text-center">
          Pinned: {form.latitude.toFixed(5)}, {form.longitude?.toFixed(5)}
        </p>
      )}

      {showDefaultToggle && (
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={form.is_default}
            onChange={(e) => setForm((f) => ({ ...f, is_default: e.target.checked }))} />
          Set as my default delivery address
        </label>
      )}
    </div>
  );
};

export default AddressFormFields;
