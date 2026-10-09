import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Search, Store, Phone, Mail, Package, Eye, MapPin, Wallet, User, Calendar, CheckCircle, Clock, Image as ImageIcon, Video, ShoppingBag } from "lucide-react";
import SellerProfileDetails, { type SellerProfileDetailsData } from "@/components/admin/SellerProfileDetails";
import UtilitySellerDetails from "@/components/admin/UtilitySellerDetails";
import UtilitySellerRegistrations from "@/components/admin/UtilitySellerRegistrations";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Wrench, ChevronLeft, ChevronRight } from "lucide-react";
import OrderDetailDialog from "@/components/OrderDetailDialog";

interface SellingPartner extends SellerProfileDetailsData {
  seller_type: string | null;
  is_blocked: boolean;
  service_count?: number;
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  mobile_number: string | null;
  is_approved: boolean;
  created_at: string;
  ward_number: number | null;
  local_body_id: string | null;
  date_of_birth: string | null;
  avatar_url: string | null;
  product_count?: number;
  local_body_name?: string;
  district_name?: string;
  body_type?: string;
}

interface SellerProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  is_active: boolean;
  is_approved: boolean;
  is_featured: boolean;
  is_grocery: boolean;
  coming_soon: boolean;
  image_url: string | null;
  image_url_2: string | null;
  image_url_3: string | null;
  video_url: string | null;
  category: string | null;
  mrp: number;
  purchase_rate: number;
  discount_rate: number;
  wallet_points: number | null;
  margin_percentage: number | null;
  featured_discount_type: string | null;
  featured_discount_value: number | null;
  created_at: string;
  updated_at: string;
}

interface Godown {
  id: string;
  name: string;
  godown_type: string;
}

interface WalletInfo {
  balance: number;
  transactions: { id: string; type: string; amount: number; description: string | null; created_at: string }[];
}

const SellingPartnersPage = () => {
  const [partners, setPartners] = useState<SellingPartner[]>([]);
  const [search, setSearch] = useState("");
  const [section, setSection] = useState<"normal" | "utility" | null>(null);
  const [status, setStatus] = useState("all");
  const [body, setBody] = useState("all");
  const [ward, setWard] = useState("all");
  const [page, setPage] = useState(1);
  const [loadError, setLoadError] = useState(false);
  const [coverage, setCoverage] = useState<{ seller_user_id: string; local_body_id: string; ward_number: number | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPartner, setSelectedPartner] = useState<SellingPartner | null>(null);
  const [partnerProducts, setPartnerProducts] = useState<SellerProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [godowns, setGodowns] = useState<Godown[]>([]);
  const [assignedGodowns, setAssignedGodowns] = useState<string[]>([]);
  const [godownPartner, setGodownPartner] = useState<SellingPartner | null>(null);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [walletPartner, setWalletPartner] = useState<SellingPartner | null>(null);
  const [settleAmount, setSettleAmount] = useState("");
  const [detailPartner, setDetailPartner] = useState<SellingPartner | null>(null);
  const [detailProduct, setDetailProduct] = useState<SellerProduct | null>(null);
  const [productImageIdx, setProductImageIdx] = useState(0);
  const [ordersPartner, setOrdersPartner] = useState<SellingPartner | null>(null);
  const [partnerOrders, setPartnerOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderCustomers, setOrderCustomers] = useState<Record<string, { full_name: string | null; mobile_number: string | null }>>({});
  const [detailOrder, setDetailOrder] = useState<any | null>(null);
  const { toast } = useToast();

  const fetchPartners = async () => {
    setLoading(true);
    const [profilesRes, productsRes, localBodiesRes, districtsRes, servicesRes, areasRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_type", "selling_partner"),
      supabase.from("seller_products").select("seller_id"),
      supabase.from("locations_local_bodies").select("id, name, body_type, district_id"),
      supabase.from("locations_districts").select("id, name"),
      supabase.from("utility_services").select("provider_user_id"),
      supabase.from("utility_seller_areas").select("seller_user_id, local_body_id, ward_number"),
    ]);

    setLoadError(Boolean(profilesRes.error || productsRes.error || servicesRes.error || areasRes.error));
    setCoverage(areasRes.data ?? []);
    const serviceCounts: Record<string, number> = {};
    (servicesRes.data ?? []).forEach(s => { if (s.provider_user_id) serviceCounts[s.provider_user_id] = (serviceCounts[s.provider_user_id] || 0) + 1; });
    const productCounts: Record<string, number> = {};
    (productsRes.data ?? []).forEach((p) => {
      productCounts[p.seller_id] = (productCounts[p.seller_id] || 0) + 1;
    });

    const localBodiesMap: Record<string, { name: string; body_type: string; district_id: string }> = {};
    (localBodiesRes.data ?? []).forEach((lb) => {
      localBodiesMap[lb.id] = { name: lb.name, body_type: lb.body_type, district_id: lb.district_id };
    });

    const districtsMap: Record<string, string> = {};
    (districtsRes.data ?? []).forEach((d) => {
      districtsMap[d.id] = d.name;
    });

    const enriched = ((profilesRes.data ?? []) as unknown as SellingPartner[]).map((p) => {
      const lb = p.local_body_id ? localBodiesMap[p.local_body_id] : null;
      return {
        ...p,
        product_count: productCounts[p.user_id] || 0,
        service_count: serviceCounts[p.user_id] || 0,
        local_body_name: lb?.name ?? null,
        body_type: lb?.body_type ?? null,
        district_name: lb ? districtsMap[lb.district_id] ?? null : null,
      };
    });

    setPartners(enriched as SellingPartner[]);
    setLoading(false);
  };

  const fetchGodowns = async () => {
    const { data } = await supabase.from("godowns").select("id, name, godown_type").eq("godown_type", "area").eq("is_active", true);
    if (data) setGodowns(data);
  };

  useEffect(() => { fetchPartners(); fetchGodowns(); }, []);

  const toggleApproval = async (userId: string, current: boolean) => {
    const newApproved = !current;
    const { error } = await supabase.from("profiles").update({ is_approved: newApproved }).eq("user_id", userId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    // Cascade approval status to all partner products (belt-and-suspenders with DB trigger)
    const { error: prodError } = await supabase
      .from("seller_products")
      .update({ is_approved: newApproved })
      .eq("seller_id", userId);
    if (prodError) {
      toast({ title: "Warning", description: "Partner updated but failed to sync products: " + prodError.message, variant: "destructive" });
    }
    toast({ title: newApproved ? "Partner & all products approved" : "Partner & all products unapproved" });
    fetchPartners();
  };

  const toggleProductApproval = async (productId: string, current: boolean) => {
    const { error } = await supabase.from("seller_products").update({ is_approved: !current }).eq("id", productId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: !current ? "Product approved" : "Product unapproved" });
      if (selectedPartner) viewProducts(selectedPartner);
    }
  };

  const toggleProductFeatured = async (productId: string, current: boolean) => {
    const { error } = await supabase.from("seller_products").update({ is_featured: !current }).eq("id", productId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: !current ? "Product featured" : "Product unfeatured" });
      if (selectedPartner) viewProducts(selectedPartner);
    }
  };

  const viewProducts = async (partner: SellingPartner) => {
    setSelectedPartner(partner);
    setProductsLoading(true);
    const { data } = await supabase.from("seller_products").select("*").eq("seller_id", partner.user_id);
    setPartnerProducts((data ?? []) as SellerProduct[]);
    setProductsLoading(false);
  };

  const openOrders = async (partner: SellingPartner) => {
    setOrdersPartner(partner);
    setOrdersLoading(true);
    setPartnerOrders([]);
    const { data } = await supabase.from("orders").select("*").eq("seller_id", partner.user_id).order("created_at", { ascending: false });
    const list = (data ?? []) as any[];
    setPartnerOrders(list);
    const ids = Array.from(new Set(list.map(o => o.user_id).filter(Boolean) as string[]));
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("user_id, full_name, mobile_number").in("user_id", ids);
      const map: Record<string, { full_name: string | null; mobile_number: string | null }> = {};
      (profs ?? []).forEach((p: any) => { map[p.user_id] = p; });
      setOrderCustomers(map);
    }
    setOrdersLoading(false);
  };

  const openGodownAssignment = async (partner: SellingPartner) => {
    setGodownPartner(partner);
    const { data } = await supabase.from("seller_godown_assignments").select("godown_id").eq("seller_id", partner.user_id);
    setAssignedGodowns((data ?? []).map(d => d.godown_id));
  };

  const toggleGodownAssignment = async (godownId: string, assigned: boolean) => {
    if (!godownPartner) return;
    if (assigned) {
      await supabase.from("seller_godown_assignments").delete().eq("seller_id", godownPartner.user_id).eq("godown_id", godownId);
      setAssignedGodowns(prev => prev.filter(id => id !== godownId));
    } else {
      await supabase.from("seller_godown_assignments").insert({ seller_id: godownPartner.user_id, godown_id: godownId });
      setAssignedGodowns(prev => [...prev, godownId]);
    }
    toast({ title: assigned ? "Godown removed" : "Godown assigned" });
  };

  const openWallet = async (partner: SellingPartner) => {
    setWalletPartner(partner);
    setSettleAmount("");
    setWalletInfo(null);
    let { data: wallet } = await supabase.from("seller_wallets").select("*").eq("seller_id", partner.user_id).maybeSingle();
    // Auto-create wallet if it doesn't exist
    if (!wallet) {
      const { data: newWallet } = await supabase
        .from("seller_wallets")
        .insert({ seller_id: partner.user_id, balance: 0 })
        .select()
        .single();
      wallet = newWallet;
    }
    if (!wallet) {
      setWalletInfo({ balance: 0, transactions: [] });
      return;
    }
    const { data: txns } = await supabase.from("seller_wallet_transactions").select("*").eq("wallet_id", wallet.id).order("created_at", { ascending: false }).limit(50);
    setWalletInfo({ balance: wallet.balance, transactions: (txns ?? []) as any[] });
  };

  const handleSettle = async () => {
    if (!walletPartner || !settleAmount) return;
    const amount = parseFloat(settleAmount);
    if (isNaN(amount) || amount <= 0) return;

    const { data: wallet } = await supabase.from("seller_wallets").select("*").eq("seller_id", walletPartner.user_id).maybeSingle();
    if (!wallet || wallet.balance < amount) {
      toast({ title: "Insufficient balance", variant: "destructive" });
      return;
    }

    const { error: txnError } = await supabase.from("seller_wallet_transactions").insert({
      wallet_id: wallet.id,
      seller_id: walletPartner.user_id,
      type: "settlement",
      amount: -amount,
      description: `Settlement of ₹${amount}`,
    });
    if (txnError) { toast({ title: "Error", description: txnError.message, variant: "destructive" }); return; }

    await supabase.from("seller_wallets").update({ balance: wallet.balance - amount }).eq("id", wallet.id);
    toast({ title: `₹${amount} settled successfully` });
    openWallet(walletPartner);
  };

  useEffect(() => { setPage(1); }, [search, section, status, body, ward]);
  const sectionPartners = partners.filter(p => section === "utility" ? p.seller_type === "utility" : p.seller_type !== "utility");
  const bodyOptions = Array.from(new Map(partners.filter(p => p.local_body_id).map(p => [p.local_body_id, p.local_body_name || "Unknown local body"])).entries());
  const wardOptions = Array.from(new Set([...partners.filter(p => p.local_body_id === body).map(p => p.ward_number), ...coverage.filter(a => a.local_body_id === body).map(a => a.ward_number)].filter((w): w is number => w != null))).sort((a,b) => a-b);
  const filtered = sectionPartners.filter(p => {
    const q = search.trim().toLowerCase();
    if (q && ![p.full_name, p.email, p.mobile_number, p.company_name, p.local_body_name].some(v => v?.toLowerCase().includes(q))) return false;
    if (status === "approved" && (!p.is_approved || p.is_blocked)) return false;
    if (status === "pending" && p.is_approved) return false;
    if (status === "blocked" && !p.is_blocked) return false;
    const areas = coverage.filter(a => a.seller_user_id === p.user_id);
    if (body !== "all" && p.local_body_id !== body && !areas.some(a => a.local_body_id === body)) return false;
    if (ward !== "all" && !(p.local_body_id === body && p.ward_number === Number(ward)) && !areas.some(a => a.local_body_id === body && (a.ward_number == null || a.ward_number === Number(ward)))) return false;
    return true;
  });
  const pages = Math.max(1, Math.ceil(filtered.length / 10));
  const currentPage = Math.min(page, pages);
  const visiblePartners = filtered.slice((currentPage - 1) * 10, currentPage * 10);
  const openDirectory = (kind: "normal" | "utility") => { setSection(kind); setSearch(""); setStatus("all"); setBody("all"); setWard("all"); setPage(1); };
  const partnerActions = (p: SellingPartner) => <div className="flex flex-wrap gap-1">
    <Button variant="outline" size="sm" onClick={() => setDetailPartner(p)}><User />Details</Button>
    {p.seller_type !== "utility" && <>
      <Button variant="ghost" size="icon" onClick={() => viewProducts(p)} title="Products" aria-label={`Products for ${p.full_name}`}><Package /></Button>
      <Button variant="ghost" size="icon" onClick={() => openOrders(p)} title="Orders" aria-label={`Orders for ${p.full_name}`}><ShoppingBag /></Button>
      <Button variant="ghost" size="icon" onClick={() => openGodownAssignment(p)} title="Assign godowns" aria-label={`Godowns for ${p.full_name}`}><MapPin /></Button>
      <Button variant="ghost" size="icon" onClick={() => openWallet(p)} title="Wallet" aria-label={`Wallet for ${p.full_name}`}><Wallet /></Button>
    </>}
  </div>;

  const PartnerTable = ({ items, loading: isLoading }: { items: SellingPartner[]; loading: boolean }) => (
    <>
    <div className="space-y-3 md:hidden">{isLoading ? <p className="py-6 text-muted-foreground">Loading…</p> : items.length === 0 ? <p className="py-6 text-muted-foreground">No matching partners</p> : items.map(p => <article key={p.id} className="rounded-lg border bg-card p-4 space-y-3"><div className="flex justify-between gap-2"><div className="min-w-0"><h3 className="break-words font-semibold">{p.full_name || "Unnamed"}</h3><p className="break-words text-sm text-muted-foreground">{p.company_name}</p></div><Badge variant={p.is_blocked ? "destructive" : p.is_approved ? "default" : "secondary"}>{p.is_blocked ? "Blocked" : p.is_approved ? "Approved" : "Pending"}</Badge></div><p className="break-words text-sm">{p.mobile_number || p.email || "—"}</p><p className="text-sm text-muted-foreground">{p.local_body_name || "No local body"}{p.ward_number ? ` · Ward ${p.ward_number}` : ""} · {p.seller_type === "utility" ? `${p.service_count} services` : `${p.product_count} products`}</p>{partnerActions(p)}{p.seller_type !== "utility" && <label className="flex items-center gap-2 text-sm"><Switch aria-label={`Approve ${p.full_name}`} checked={p.is_approved} onCheckedChange={() => toggleApproval(p.user_id, p.is_approved)} />Approved</label>}</article>)}</div>
    <div className="admin-table-wrap hidden md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Panchayath / Ward</TableHead>
            <TableHead>{section === "utility" ? "Services" : "Products"}</TableHead>
            <TableHead>Status</TableHead>
            {section !== "utility" && <TableHead>Approved</TableHead>}
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
          ) : items.length === 0 ? (
            <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No selling partners found</TableCell></TableRow>
          ) : items.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-medium">{p.full_name ?? "—"}</TableCell>
              <TableCell>
                <div className="space-y-1">
                  {p.email && <div className="flex items-center gap-1.5 text-sm"><Mail className="h-3.5 w-3.5 text-muted-foreground" />{p.email}</div>}
                  {p.mobile_number && <div className="flex items-center gap-1.5 text-sm"><Phone className="h-3.5 w-3.5 text-muted-foreground" />{p.mobile_number}</div>}
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-0.5 text-sm">
                  {p.local_body_name ? (
                    <>
                      <div className="font-medium">{p.local_body_name}</div>
                      <div className="text-muted-foreground text-xs">
                        {p.body_type && <span className="capitalize">{p.body_type}</span>}
                        {p.ward_number && <span> · Ward {p.ward_number}</span>}
                        {p.district_name && <span> · {p.district_name}</span>}
                      </div>
                    </>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="gap-1"><Package className="h-3 w-3" />{section === "utility" ? p.service_count : p.product_count}</Badge>
              </TableCell>
              <TableCell><Badge variant={p.is_blocked ? "destructive" : p.is_approved ? "default" : "secondary"}>{p.is_blocked ? "Blocked" : p.is_approved ? "Approved" : "Pending"}</Badge></TableCell>
              {section !== "utility" && <TableCell><Switch aria-label={`Approve ${p.full_name}`} checked={p.is_approved} onCheckedChange={() => toggleApproval(p.user_id, p.is_approved)} /></TableCell>}
              <TableCell>
                {partnerActions(p)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
    </>
  );

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="flex items-center gap-2 text-2xl font-bold"><Store className="h-6 w-6 text-primary" />{section ? section === "utility" ? "Utility Sellers" : "Normal Sellers" : "Selling Partners"}</h1>
          {section && <Button variant="outline" size="sm" onClick={() => setSection(null)}><ArrowLeft />Back to sellers</Button>}
        </div>
        {loadError && <div role="alert" className="flex items-center gap-3 text-sm text-destructive">Unable to load all partner details.<Button variant="outline" size="sm" onClick={fetchPartners}>Retry</Button></div>}
        {!section ? <div className="grid gap-4 sm:grid-cols-2" aria-label="Seller types">{(["normal", "utility"] as const).map(kind => {
          const list = partners.filter(p => kind === "utility" ? p.seller_type === "utility" : p.seller_type !== "utility");
          const Icon = kind === "utility" ? Wrench : Store;
          return <Button key={kind} variant="outline" onClick={() => openDirectory(kind)} className="h-auto min-h-[180px] items-start justify-start whitespace-normal p-6 text-left"><div className="w-full space-y-5"><div className="flex items-center justify-between"><Icon className="text-primary" /><ArrowRight className="text-muted-foreground" /></div><div><h2 className="text-lg font-semibold">{kind === "utility" ? "Utility Sellers" : "Normal Sellers"}</h2><p className="mt-1 text-3xl font-bold">{loading ? "…" : list.length}</p></div><div className="flex flex-wrap gap-2"><Badge variant="secondary">{list.filter(p => !p.is_approved).length} pending</Badge><Badge variant="outline">{list.filter(p => p.is_approved).length} approved</Badge></div></div></Button>;
        })}</div> : <>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input aria-label="Search sellers" placeholder="Name, company, phone or email" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>
            <Select value={status} onValueChange={setStatus}><SelectTrigger aria-label="Seller status"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="pending">Pending approval</SelectItem><SelectItem value="approved">Approved</SelectItem><SelectItem value="blocked">Blocked</SelectItem></SelectContent></Select>
            <Select value={body} onValueChange={v => { setBody(v); setWard("all"); }}><SelectTrigger aria-label="Local body"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All local bodies</SelectItem>{bodyOptions.map(([id,name]) => id && <SelectItem key={id} value={id}>{name}</SelectItem>)}</SelectContent></Select>
            <Select value={ward} onValueChange={setWard} disabled={body === "all"}><SelectTrigger aria-label="Ward"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All wards</SelectItem>{wardOptions.map(w => <SelectItem key={w} value={String(w)}>Ward {w}</SelectItem>)}</SelectContent></Select>
          </div>
          <div className="flex justify-between items-center gap-2 text-sm"><span className="text-muted-foreground">{filtered.length} matching partners</span><Button size="sm" variant="ghost" onClick={() => { setSearch(""); setStatus("all"); setBody("all"); setWard("all"); }}>Clear filters</Button></div>
          <PartnerTable items={visiblePartners} loading={loading} />
          <div className="flex items-center justify-between gap-2 text-sm"><span className="text-muted-foreground">Page {currentPage} of {pages}</span><div className="flex gap-2"><Button variant="outline" size="icon" aria-label="Previous page" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}><ChevronLeft /></Button><Button variant="outline" size="icon" aria-label="Next page" disabled={currentPage >= pages} onClick={() => setPage(currentPage + 1)}><ChevronRight /></Button></div></div>
        </>}
      </div>

      {/* View Details Dialog */}
      <Dialog open={!!detailPartner} onOpenChange={() => setDetailPartner(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="break-words">{detailPartner?.full_name || "Partner"} — Details</DialogTitle></DialogHeader>
          {detailPartner && <Tabs defaultValue="details">
            <TabsList className="max-w-full overflow-x-auto justify-start"><TabsTrigger value="details">Details</TabsTrigger>{detailPartner.seller_type === "utility" && <><TabsTrigger value="activity">Services & requests</TabsTrigger><TabsTrigger value="coverage">Areas & status</TabsTrigger></>}</TabsList>
            <TabsContent value="details"><SellerProfileDetails partner={detailPartner} />{detailPartner.seller_type !== "utility" && <div className="mt-5 flex flex-wrap gap-2"><Button variant="outline" onClick={() => { setDetailPartner(null); viewProducts(detailPartner); }}><Package />Products</Button><Button variant="outline" onClick={() => { setDetailPartner(null); openOrders(detailPartner); }}><ShoppingBag />Orders</Button><Button variant="outline" onClick={() => { setDetailPartner(null); openGodownAssignment(detailPartner); }}><MapPin />Godowns</Button><Button variant="outline" onClick={() => { setDetailPartner(null); openWallet(detailPartner); }}><Wallet />Wallet</Button></div>}</TabsContent>
            {detailPartner.seller_type === "utility" && <><TabsContent value="activity"><UtilitySellerDetails userId={detailPartner.user_id} /></TabsContent><TabsContent value="coverage"><UtilitySellerRegistrations sellerUserId={detailPartner.user_id} onUpdated={fetchPartners} /></TabsContent></>}
          </Tabs>}
        </DialogContent>
      </Dialog>

      {/* Products Dialog */}
      <Dialog open={!!selectedPartner} onOpenChange={() => setSelectedPartner(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Products by {selectedPartner?.full_name ?? "Partner"}</DialogTitle></DialogHeader>
          {productsLoading ? (
            <p className="text-center py-4 text-muted-foreground">Loading...</p>
          ) : partnerProducts.length === 0 ? (
            <p className="text-center py-4 text-muted-foreground">No products listed</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>MRP</TableHead>
                  <TableHead>Purchase</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Featured</TableHead>
                  <TableHead>Approved</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partnerProducts.map((prod) => (
                  <TableRow key={prod.id}>
                    <TableCell>
                      <button
                        type="button"
                        className="flex items-center gap-2 text-left hover:opacity-80"
                        onClick={() => { setDetailProduct(prod); setProductImageIdx(0); }}
                        title="View full product details"
                      >
                        {prod.image_url ? (
                          <img src={prod.image_url} alt="" className="h-8 w-8 rounded object-cover" />
                        ) : (
                          <span className="h-8 w-8 rounded bg-muted flex items-center justify-center"><ImageIcon className="h-4 w-4 text-muted-foreground" /></span>
                        )}
                        <div>
                          <p className="font-medium underline-offset-2 hover:underline">{prod.name}</p>
                          {prod.category && <p className="text-xs text-muted-foreground">{prod.category}</p>}
                        </div>
                      </button>
                    </TableCell>
                    <TableCell>₹{prod.mrp}</TableCell>
                    <TableCell className="text-muted-foreground">₹{prod.purchase_rate}</TableCell>
                    <TableCell className="text-muted-foreground">₹{prod.discount_rate}</TableCell>
                    <TableCell className="font-medium">₹{prod.price}</TableCell>
                    <TableCell>{prod.stock}</TableCell>
                    <TableCell><Switch checked={prod.is_featured} onCheckedChange={() => toggleProductFeatured(prod.id, prod.is_featured)} /></TableCell>
                    <TableCell><Switch checked={prod.is_approved} onCheckedChange={() => toggleProductApproval(prod.id, prod.is_approved)} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>

      {/* Product Detail Dialog */}
      <Dialog open={!!detailProduct} onOpenChange={() => setDetailProduct(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {detailProduct && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" /> {detailProduct.name}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Image gallery */}
                {(() => {
                  const images = [detailProduct.image_url, detailProduct.image_url_2, detailProduct.image_url_3].filter(Boolean) as string[];
                  return (
                    <div className="space-y-2">
                      {images.length > 0 ? (
                        <>
                          <div className="aspect-video w-full overflow-hidden rounded-lg border bg-muted flex items-center justify-center">
                            <img src={images[productImageIdx]} alt={detailProduct.name} className="max-h-full max-w-full object-contain" />
                          </div>
                          {images.length > 1 && (
                            <div className="flex gap-2">
                              {images.map((img, i) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => setProductImageIdx(i)}
                                  className={`h-16 w-16 overflow-hidden rounded border-2 ${i === productImageIdx ? "border-primary" : "border-transparent opacity-70"}`}
                                >
                                  <img src={img} alt="" className="h-full w-full object-cover" />
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="aspect-video w-full rounded-lg border bg-muted flex flex-col items-center justify-center text-muted-foreground">
                          <ImageIcon className="h-8 w-8 mb-1" />
                          <span className="text-sm">No images</span>
                        </div>
                      )}
                      {detailProduct.video_url && (
                        <a
                          href={detailProduct.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                        >
                          <Video className="h-4 w-4" /> Watch product video
                        </a>
                      )}
                    </div>
                  );
                })()}

                {/* Status badges */}
                <div className="flex flex-wrap gap-2">
                  <Badge variant={detailProduct.is_approved ? "default" : "secondary"}>{detailProduct.is_approved ? "Approved" : "Not Approved"}</Badge>
                  <Badge variant="outline">{detailProduct.is_active ? "Active" : "Inactive"}</Badge>
                  {detailProduct.is_featured && <Badge variant="default">Featured</Badge>}
                  {detailProduct.coming_soon && <Badge variant="secondary">Coming Soon</Badge>}
                  {detailProduct.is_grocery && <Badge variant="outline">Grocery</Badge>}
                  <Badge variant={detailProduct.stock > 0 ? "outline" : "destructive"}>{detailProduct.stock > 0 ? `In Stock (${detailProduct.stock})` : "Out of Stock"}</Badge>
                </div>

                {/* Description */}
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Description</p>
                  <p className="text-sm whitespace-pre-wrap">{detailProduct.description || "—"}</p>
                </div>

                {/* Pricing & details */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                  <DetailItem label="Selling Price" value={`₹${detailProduct.price}`} />
                  <DetailItem label="MRP" value={`₹${detailProduct.mrp}`} />
                  <DetailItem label="Purchase Rate" value={`₹${detailProduct.purchase_rate}`} />
                  <DetailItem label="Discount" value={`₹${detailProduct.discount_rate}`} />
                  <DetailItem label="Stock" value={detailProduct.stock.toString()} />
                  <DetailItem label="Category" value={detailProduct.category} />
                  <DetailItem label="Wallet Points" value={detailProduct.wallet_points != null ? detailProduct.wallet_points.toString() : null} />
                  <DetailItem label="Margin %" value={detailProduct.margin_percentage != null ? `${detailProduct.margin_percentage}%` : null} />
                  <DetailItem label="Featured Discount" value={detailProduct.featured_discount_type ? `${detailProduct.featured_discount_type}: ${detailProduct.featured_discount_value ?? "—"}` : null} />
                  <DetailItem label="Added" value={new Date(detailProduct.created_at).toLocaleDateString()} />
                  <DetailItem label="Last Updated" value={new Date(detailProduct.updated_at).toLocaleDateString()} />
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Godown Assignment Dialog */}
      <Dialog open={!!godownPartner} onOpenChange={() => setGodownPartner(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assign Godowns — {godownPartner?.full_name}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground mb-4">Select which area godowns this partner can deliver to</p>
          {godowns.length === 0 ? (
            <p className="text-muted-foreground">No area godowns available</p>
          ) : (
            <div className="space-y-3">
              {godowns.map(g => {
                const assigned = assignedGodowns.includes(g.id);
                return (
                  <div key={g.id} className="flex items-center gap-3 p-2 rounded-lg border">
                    <Checkbox checked={assigned} onCheckedChange={() => toggleGodownAssignment(g.id, assigned)} />
                    <span className="font-medium">{g.name}</span>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Wallet Dialog */}
      <Dialog open={!!walletPartner} onOpenChange={() => setWalletPartner(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Wallet — {walletPartner?.full_name}</DialogTitle></DialogHeader>
          {walletInfo && (
            <div className="space-y-4">
              <div className="text-center p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">Balance</p>
                <p className="text-3xl font-bold">₹{walletInfo.balance.toFixed(2)}</p>
              </div>
              <div className="flex gap-2">
                <Input type="number" placeholder="Amount to settle" value={settleAmount} onChange={e => setSettleAmount(e.target.value)} />
                <Button onClick={handleSettle} disabled={!settleAmount || parseFloat(settleAmount) <= 0}>Settle</Button>
              </div>
              {walletInfo.transactions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Recent Transactions</h4>
                  {walletInfo.transactions.map(t => (
                    <div key={t.id} className="flex justify-between items-center text-sm p-2 border rounded">
                      <div>
                        <p className="font-medium">{t.description || t.type}</p>
                        <p className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString()}</p>
                      </div>
                      <span className={t.amount >= 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                        {t.amount >= 0 ? "+" : ""}₹{Math.abs(t.amount).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Seller Orders Dialog */}
      <Dialog open={!!ordersPartner} onOpenChange={() => setOrdersPartner(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><ShoppingBag className="h-5 w-5 text-primary" /> Orders — {ordersPartner?.full_name ?? "Partner"}</DialogTitle></DialogHeader>
          {ordersLoading ? (
            <p className="text-center py-4 text-muted-foreground">Loading...</p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-lg bg-muted p-3 text-center"><p className="text-xs text-muted-foreground">Total Orders</p><p className="text-xl font-bold">{partnerOrders.length}</p></div>
                <div className="rounded-lg bg-muted p-3 text-center"><p className="text-xs text-muted-foreground">Delivered</p><p className="text-xl font-bold">{partnerOrders.filter(o => o.status === "delivered").length}</p></div>
                <div className="rounded-lg bg-muted p-3 text-center"><p className="text-xs text-muted-foreground">Open</p><p className="text-xl font-bold">{partnerOrders.filter(o => !["delivered", "cancelled", "return_requested", "return_confirmed"].includes(o.status)).length}</p></div>
                <div className="rounded-lg bg-muted p-3 text-center"><p className="text-xs text-muted-foreground">Delivered Value</p><p className="text-xl font-bold">₹{partnerOrders.filter(o => o.status === "delivered").reduce((s, o) => s + Number(o.total || 0), 0).toFixed(2)}</p></div>
              </div>
              {partnerOrders.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground">No orders yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {partnerOrders.map((o) => {
                      const cust = o.user_id ? orderCustomers[o.user_id] : undefined;
                      return (
                        <TableRow key={o.id} className="cursor-pointer" onClick={() => setDetailOrder(o)}>
                          <TableCell className="font-mono text-xs">{o.id.slice(0, 8)}…</TableCell>
                          <TableCell className="text-xs">
                            <div className="font-medium">{cust?.full_name ?? "—"}</div>
                            <div className="text-muted-foreground">{cust?.mobile_number ?? ""}</div>
                          </TableCell>
                          <TableCell className="text-xs">{Array.isArray(o.items) ? o.items.length : 0}</TableCell>
                          <TableCell>₹{o.total}</TableCell>
                          <TableCell><Badge variant={o.status === "delivered" ? "default" : o.status === "cancelled" ? "destructive" : "secondary"} className="capitalize">{o.status.replace(/_/g, " ")}</Badge></TableCell>
                          <TableCell className="text-xs">{new Date(o.created_at).toLocaleDateString()}</TableCell>
                          <TableCell><Eye className="h-4 w-4 text-muted-foreground" /></TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <OrderDetailDialog order={detailOrder} open={!!detailOrder} onOpenChange={(v) => { if (!v) setDetailOrder(null); }} />
    </AdminLayout>
  );
};

const DetailItem = ({ label, value, capitalize }: { label: string; value?: string | null; capitalize?: boolean }) => (
  <div>
    <p className="text-muted-foreground text-xs">{label}</p>
    <p className={`break-words font-medium ${capitalize ? "capitalize" : ""}`}>{value ?? "—"}</p>
  </div>
);

export default SellingPartnersPage;
