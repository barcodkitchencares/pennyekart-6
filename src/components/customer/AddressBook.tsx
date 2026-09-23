import { useState, useEffect, useCallback } from "react";
import { MapPin, Plus, Pencil, Trash2, Star, Loader2, Home, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AddressFormFields, { emptyAddressForm, validateAddressForm } from "./AddressFormFields";

interface Address {
  id: string;
  label: string;
  contact_name: string;
  contact_phone: string;
  address_line1: string;
  address_line2: string | null;
  landmark: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  latitude: number | null;
  longitude: number | null;
  is_default: boolean;
}

interface Props {
  userId?: string;
  defaultName?: string | null;
  defaultPhone?: string | null;
}

const emptyForm = emptyAddressForm;

const labelIcon = (label: string) =>
  label === "Work" ? Briefcase : label === "Home" ? Home : MapPin;

const AddressBook = ({ userId, defaultName, defaultPhone }: Props) => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("customer_addresses")
      .select("*")
      .eq("user_id", userId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) toast.error("Could not load your addresses");
    setAddresses((data as Address[]) || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const openNew = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      contact_name: defaultName || "",
      contact_phone: defaultPhone || "",
      is_default: addresses.length === 0,
    });
    setOpen(true);
  };

  const openEdit = (a: Address) => {
    setEditingId(a.id);
    setForm({
      label: a.label,
      contact_name: a.contact_name,
      contact_phone: a.contact_phone,
      address_line1: a.address_line1,
      address_line2: a.address_line2 || "",
      landmark: a.landmark || "",
      city: a.city || "",
      state: a.state || "Kerala",
      pincode: a.pincode || "",
      latitude: a.latitude,
      longitude: a.longitude,
      is_default: a.is_default,
    });
    setOpen(true);
  };


  const save = async () => {
    if (!userId) {
      toast.error("Please sign in first");
      return;
    }
    if (!form.contact_name.trim()) return toast.error("Enter a name");
    if (form.contact_phone.replace(/\D/g, "").length < 10) return toast.error("Enter a valid 10-digit phone number");
    if (!form.address_line1.trim()) return toast.error("Enter the address");
    if (form.pincode && !/^\d{6}$/.test(form.pincode)) return toast.error("Pincode must be 6 digits");

    setSaving(true);
    const payload = {
      user_id: userId,
      label: form.label,
      contact_name: form.contact_name.trim(),
      contact_phone: form.contact_phone.replace(/\D/g, "").slice(-10),
      address_line1: form.address_line1.trim(),
      address_line2: form.address_line2.trim() || null,
      landmark: form.landmark.trim() || null,
      city: form.city.trim() || null,
      state: form.state.trim() || null,
      pincode: form.pincode.trim() || null,
      latitude: form.latitude,
      longitude: form.longitude,
      is_default: form.is_default,
    };

    const { error } = editingId
      ? await supabase.from("customer_addresses").update(payload).eq("id", editingId)
      : await supabase.from("customer_addresses").insert(payload);

    setSaving(false);
    if (error) {
      toast.error(error.message || "Could not save the address");
      return;
    }
    toast.success(editingId ? "Address updated" : "Address added");
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("customer_addresses").delete().eq("id", id);
    if (error) return toast.error("Could not delete the address");
    toast.success("Address removed");
    load();
  };

  const makeDefault = async (id: string) => {
    const { error } = await supabase.from("customer_addresses").update({ is_default: true }).eq("id", id);
    if (error) return toast.error("Could not update the address");
    load();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" /> Saved Addresses
        </h3>
        <Button size="sm" onClick={openNew}>
          <Plus className="h-4 w-4 mr-1" /> Add Address
        </Button>
      </div>

      {loading ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Loading...</CardContent></Card>
      ) : addresses.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <MapPin className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="font-medium">No saved addresses yet</p>
            <p className="text-sm mt-1">Add one so checkout is faster next time</p>
            <Button size="sm" className="mt-4" onClick={openNew}>
              <Plus className="h-4 w-4 mr-1" /> Add Address
            </Button>
          </CardContent>
        </Card>
      ) : (
        addresses.map((a) => {
          const Icon = labelIcon(a.label);
          return (
            <Card key={a.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Icon className="h-4 w-4 text-primary shrink-0" />
                      <span className="font-medium">{a.label}</span>
                      {a.is_default && <Badge className="text-[10px]">Default</Badge>}
                      {a.latitude != null && (
                        <Badge variant="secondary" className="text-[10px]">Location pinned</Badge>
                      )}
                    </div>
                    <p className="text-sm mt-1.5 font-medium">{a.contact_name} · {a.contact_phone}</p>
                    <p className="text-sm text-muted-foreground mt-0.5 break-words">
                      {[a.address_line1, a.address_line2, a.landmark, a.city, a.state, a.pincode]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(a)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => remove(a.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {!a.is_default && (
                  <Button size="sm" variant="outline" className="mt-3" onClick={() => makeDefault(a.id)}>
                    <Star className="h-3.5 w-3.5 mr-1" /> Set as default
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Address" : "Add Address"}</DialogTitle>
          </DialogHeader>
          <AddressFormFields form={form} setForm={setForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingId ? "Save changes" : "Add address"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AddressBook;
