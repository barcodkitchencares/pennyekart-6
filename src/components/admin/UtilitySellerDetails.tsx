import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatServicePrice, statusLabel, type UtilityService, type UtilityRequest } from "@/lib/utilityServices";

export default function UtilitySellerDetails({ userId }: { userId: string }) {
  const [services, setServices] = useState<UtilityService[]>([]);
  const [requests, setRequests] = useState<UtilityRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true); setError(false);
      const result = await supabase.from("utility_services").select("*").eq("provider_user_id", userId).order("created_at", { ascending: false });
      const list = (result.data ?? []) as UtilityService[];
      const bookings = list.length ? await supabase.from("utility_service_requests").select("*").in("service_id", list.map(s => s.id)).order("created_at", { ascending: false }) : { data: [], error: null };
      if (active) { setServices(list); setRequests((bookings.data ?? []) as UtilityRequest[]); setError(Boolean(result.error || bookings.error)); setLoading(false); }
    };
    load();
    return () => { active = false; };
  }, [userId]);
  if (loading) return <p className="py-6 text-center text-muted-foreground">Loading services and requests…</p>;
  if (error) return <p role="alert" className="py-6 text-destructive">Unable to load utility details. Close and reopen to try again.</p>;
  const query = search.trim().toLowerCase();
  return <Tabs defaultValue="services" className="space-y-3">
    <TabsList><TabsTrigger value="services">Services ({services.length})</TabsTrigger><TabsTrigger value="requests">Requests ({requests.length})</TabsTrigger></TabsList>
    <Input aria-label="Search utility details" placeholder="Search service, customer or status" value={search} onChange={e => setSearch(e.target.value)} />
    <TabsContent value="services"><div className="max-h-[45vh] overflow-y-auto divide-y">
      {services.filter(s => `${s.name} ${s.description ?? ""}`.toLowerCase().includes(query)).map(s => <article key={s.id} className="flex gap-3 py-3">
        {s.image_url && <img src={s.image_url} alt="" className="h-14 w-14 shrink-0 rounded-md object-cover" />}
        <div className="min-w-0 flex-1"><h4 className="break-words font-medium">{s.name}</h4><p className="text-sm text-muted-foreground">{formatServicePrice(s.price, s.price_unit)}</p><p className="break-words text-sm">{s.description}</p><div className="mt-2 flex flex-wrap gap-1"><Badge variant={s.is_approved ? "default" : "secondary"}>{s.is_approved ? "Approved" : "Pending"}</Badge><Badge variant="outline">{s.is_active ? "Active" : "Inactive"}</Badge></div></div>
      </article>)}
      {!services.some(s => `${s.name} ${s.description ?? ""}`.toLowerCase().includes(query)) && <p className="py-6 text-center text-muted-foreground">No matching services</p>}
    </div></TabsContent>
    <TabsContent value="requests"><div className="mb-3 flex flex-wrap gap-2"><Badge variant="outline">{requests.filter(r => r.status === "completed").length} completed</Badge><Badge variant="outline">Completed value ₹{requests.filter(r => r.status === "completed").reduce((sum, r) => sum + Number(r.total_amount ?? r.quoted_amount ?? 0), 0).toFixed(2)}</Badge></div><div className="max-h-[45vh] overflow-y-auto divide-y">
      {requests.filter(r => `${r.contact_name} ${r.contact_phone} ${r.status} ${services.find(s => s.id === r.service_id)?.name ?? ""}`.toLowerCase().includes(query)).map(r => <article key={r.id} className="space-y-1 py-3 text-sm"><div className="flex items-start justify-between gap-2"><h4 className="min-w-0 break-words font-medium">{services.find(s => s.id === r.service_id)?.name ?? "Service"}</h4><Badge variant="secondary" className="shrink-0">{statusLabel(r.status)}</Badge></div><p>{r.contact_name} · {r.contact_phone}</p><p className="break-words text-muted-foreground">{r.address || "—"}</p><p>{r.variant_label || ""} · Qty {r.quantity ?? 1} · {r.total_amount != null ? `₹${r.total_amount}` : r.quoted_amount != null ? `₹${r.quoted_amount}` : "Not quoted"}</p><p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}{r.preferred_date ? ` · Preferred ${r.preferred_date}` : ""}</p>{r.notes && <p className="break-words">{r.notes}</p>}</article>)}
      {!requests.some(r => `${r.contact_name} ${r.contact_phone} ${r.status} ${services.find(s => s.id === r.service_id)?.name ?? ""}`.toLowerCase().includes(query)) && <p className="py-6 text-center text-muted-foreground">No matching requests</p>}
    </div></TabsContent>
  </Tabs>;
}