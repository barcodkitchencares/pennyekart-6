import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Users2, IndianRupee, TrendingUp, Gift, Search, Download, Eye, Save, AlertTriangle, Crown } from "lucide-react";

const COMMISSION_KEY = "community_creator_commission_percent";

interface CommunityRow {
  community_id: string;
  community_name: string;
  creator_user_id: string;
  creator_name: string | null;
  creator_mobile: string | null;
  member_count: number;
  order_count: number;
  revenue: number;
  cost: number;
  profit: number;
  unmatched_items: number;
}

interface MemberRow {
  user_id: string;
  full_name: string | null;
  mobile_number: string | null;
  joined_at: string;
  is_creator: boolean;
  order_count: number;
  revenue: number;
  cost: number;
  profit: number;
  unmatched_items: number;
}

type RangeKey = "this_month" | "last_month" | "last_3_months" | "all" | "custom";

const money = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const toISODate = (d: Date) => d.toISOString().slice(0, 10);

function rangeBounds(key: RangeKey, fromStr: string, toStr: string): { from: string | null; to: string | null } {
  const now = new Date();
  if (key === "this_month") {
    const s = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: s.toISOString(), to: null };
  }
  if (key === "last_month") {
    const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const e = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: s.toISOString(), to: e.toISOString() };
  }
  if (key === "last_3_months") {
    const s = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    return { from: s.toISOString(), to: null };
  }
  if (key === "custom") {
    return {
      from: fromStr ? new Date(`${fromStr}T00:00:00`).toISOString() : null,
      to: toStr ? new Date(`${toStr}T23:59:59`).toISOString() : null,
    };
  }
  return { from: null, to: null };
}

function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const esc = (v: string | number) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [headers.map(esc).join(","), ...rows.map(r => r.map(esc).join(","))].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function CommunityManagementPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<CommunityRow[]>([]);
  const [search, setSearch] = useState("");
  const [rangeKey, setRangeKey] = useState<RangeKey>("this_month");
  const [customFrom, setCustomFrom] = useState(toISODate(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));
  const [customTo, setCustomTo] = useState(toISODate(new Date()));
  const [commission, setCommission] = useState("0");
  const [savingCommission, setSavingCommission] = useState(false);

  const [detail, setDetail] = useState<CommunityRow | null>(null);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  const bounds = useMemo(() => rangeBounds(rangeKey, customFrom, customTo), [rangeKey, customFrom, customTo]);
  const pct = Math.max(0, Math.min(100, parseFloat(commission) || 0));

  const loadCommission = useCallback(async () => {
    const { data } = await supabase.from("app_settings").select("value").eq("key", COMMISSION_KEY).maybeSingle();
    if (data?.value != null) setCommission(String(data.value));
  }, []);

  const loadRows = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase.rpc as unknown as (
      fn: string,
      args: Record<string, unknown>
    ) => Promise<{ data: CommunityRow[] | null; error: { message: string } | null }>)(
      "get_community_revenue_summary",
      { _from: bounds.from, _to: bounds.to }
    );
    if (error) toast({ title: "Could not load communities", description: error.message, variant: "destructive" });
    setRows((data || []).map(r => ({ ...r, revenue: Number(r.revenue), cost: Number(r.cost), profit: Number(r.profit) })));
    setLoading(false);
  }, [bounds, toast]);

  useEffect(() => { loadCommission(); }, [loadCommission]);
  useEffect(() => { loadRows(); }, [loadRows]);

  const saveCommission = async () => {
    setSavingCommission(true);
    const { data: existing } = await supabase.from("app_settings").select("id").eq("key", COMMISSION_KEY).maybeSingle();
    const value = String(pct);
    const res = existing?.id
      ? await supabase.from("app_settings").update({ value }).eq("key", COMMISSION_KEY)
      : await supabase.from("app_settings").insert({ key: COMMISSION_KEY, value, description: "Community creator commission as % of profit" });
    setSavingCommission(false);
    if (res.error) toast({ title: "Could not save", description: res.error.message, variant: "destructive" });
    else toast({ title: "Commission percentage saved" });
  };

  const openDetail = async (row: CommunityRow) => {
    setDetail(row);
    setMembersLoading(true);
    const { data, error } = await (supabase.rpc as unknown as (
      fn: string,
      args: Record<string, unknown>
    ) => Promise<{ data: MemberRow[] | null; error: { message: string } | null }>)(
      "get_community_member_revenue",
      { _community_id: row.community_id, _from: bounds.from, _to: bounds.to }
    );
    if (error) toast({ title: "Could not load members", description: error.message, variant: "destructive" });
    setMembers((data || []).map(m => ({ ...m, revenue: Number(m.revenue), cost: Number(m.cost), profit: Number(m.profit) })));
    setMembersLoading(false);
  };

  const filtered = rows.filter(r => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      r.community_name.toLowerCase().includes(q) ||
      (r.creator_name || "").toLowerCase().includes(q) ||
      (r.creator_mobile || "").includes(q)
    );
  });

  const totals = filtered.reduce(
    (acc, r) => ({
      members: acc.members + r.member_count,
      revenue: acc.revenue + r.revenue,
      profit: acc.profit + r.profit,
      orders: acc.orders + r.order_count,
    }),
    { members: 0, revenue: 0, profit: 0, orders: 0 }
  );

  const detailTotals = members.reduce(
    (acc, m) => ({ revenue: acc.revenue + m.revenue, profit: acc.profit + m.profit, orders: acc.orders + m.order_count }),
    { revenue: 0, profit: 0, orders: 0 }
  );

  const exportList = () =>
    downloadCsv(
      `communities-revenue-${toISODate(new Date())}.csv`,
      ["Community", "Creator", "Mobile", "Members", "Orders", "Revenue", "Cost", "Profit", `Commission (${pct}%)`],
      filtered.map(r => [r.community_name, r.creator_name || "", r.creator_mobile || "", r.member_count, r.order_count, r.revenue.toFixed(2), r.cost.toFixed(2), r.profit.toFixed(2), ((r.profit * pct) / 100).toFixed(2)])
    );

  const exportMembers = () =>
    detail &&
    downloadCsv(
      `community-${detail.community_name}-members-${toISODate(new Date())}.csv`,
      ["Name", "Mobile", "Joined", "Role", "Orders", "Revenue", "Cost", "Profit", "Share %"],
      members.map(m => [
        m.full_name || "",
        m.mobile_number || "",
        new Date(m.joined_at).toLocaleDateString("en-IN"),
        m.is_creator ? "Creator" : "Member",
        m.order_count,
        m.revenue.toFixed(2),
        m.cost.toFixed(2),
        m.profit.toFixed(2),
        detailTotals.revenue > 0 ? ((m.revenue / detailTotals.revenue) * 100).toFixed(1) : "0",
      ])
    );

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold">Community Management</h1>
          <p className="text-sm text-muted-foreground">Delivered-order revenue, profit and creator commission per community.</p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="flex flex-wrap items-end gap-3 pt-6">
            <div className="min-w-[180px] space-y-1">
              <Label className="text-xs">Period</Label>
              <Select value={rangeKey} onValueChange={v => setRangeKey(v as RangeKey)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="this_month">This month</SelectItem>
                  <SelectItem value="last_month">Last month</SelectItem>
                  <SelectItem value="last_3_months">Last 3 months</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                  <SelectItem value="custom">Custom range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {rangeKey === "custom" && (
              <>
                <div className="space-y-1">
                  <Label className="text-xs">From</Label>
                  <Input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">To</Label>
                  <Input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} />
                </div>
              </>
            )}
            <div className="space-y-1">
              <Label className="text-xs">Creator commission (% of profit)</Label>
              <div className="flex gap-2">
                <Input type="number" min="0" max="100" step="0.1" value={commission} onChange={e => setCommission(e.target.value)} className="w-28" />
                <Button onClick={saveCommission} disabled={savingCommission} size="icon" variant="secondary">
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="ml-auto flex items-end gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search community or creator" value={search} onChange={e => setSearch(e.target.value)} className="w-56 pl-8" />
              </div>
              <Button variant="outline" onClick={exportList}><Download className="mr-2 h-4 w-4" />CSV</Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Communities", value: String(filtered.length), sub: `${totals.members} members`, icon: Users2, tone: "text-primary" },
            { label: "Revenue", value: money(totals.revenue), sub: `${totals.orders} delivered orders`, icon: IndianRupee, tone: "text-emerald-600" },
            { label: "Profit", value: money(totals.profit), sub: "revenue minus cost", icon: TrendingUp, tone: "text-blue-600" },
            { label: "Creator commission", value: money((totals.profit * pct) / 100), sub: `${pct}% of profit`, icon: Gift, tone: "text-amber-600" },
          ].map(c => (
            <Card key={c.label}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{c.label}</p>
                    <p className="text-xl font-bold">{c.value}</p>
                    <p className="text-xs text-muted-foreground">{c.sub}</p>
                  </div>
                  <c.icon className={`h-8 w-8 ${c.tone}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* List */}
        <Card>
          <CardHeader><CardTitle className="text-base">Communities</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            {loading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
            ) : filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No communities found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Community</TableHead>
                    <TableHead>Creator</TableHead>
                    <TableHead className="text-center">Members</TableHead>
                    <TableHead className="text-center">Orders</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Profit</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(r => (
                    <TableRow key={r.community_id}>
                      <TableCell className="font-medium">
                        {r.community_name}
                        {r.unmatched_items > 0 && (
                          <Badge variant="outline" className="ml-2 gap-1 text-[10px]">
                            <AlertTriangle className="h-3 w-3" />{r.unmatched_items} item(s) без cost
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{r.creator_name || "—"}</div>
                        <div className="text-xs text-muted-foreground">{r.creator_mobile || ""}</div>
                      </TableCell>
                      <TableCell className="text-center">{r.member_count}</TableCell>
                      <TableCell className="text-center">{r.order_count}</TableCell>
                      <TableCell className="text-right font-medium">{money(r.revenue)}</TableCell>
                      <TableCell className="text-right text-blue-600">{money(r.profit)}</TableCell>
                      <TableCell className="text-right font-semibold text-amber-600">{money((r.profit * pct) / 100)}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={() => openDetail(r)}>
                          <Eye className="mr-1 h-4 w-4" />View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail */}
      <Dialog open={!!detail} onOpenChange={o => !o && setDetail(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{detail?.community_name}</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Revenue</p>
                  <p className="text-lg font-bold">{money(detailTotals.revenue)}</p>
                  <p className="text-xs text-muted-foreground">{detailTotals.orders} delivered orders</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Profit</p>
                  <p className="text-lg font-bold text-blue-600">{money(detailTotals.profit)}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Creator commission ({pct}%)</p>
                  <p className="text-lg font-bold text-amber-600">{money((detailTotals.profit * pct) / 100)}</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Member breakdown</p>
                <Button size="sm" variant="outline" onClick={exportMembers}><Download className="mr-2 h-4 w-4" />CSV</Button>
              </div>

              {membersLoading ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-center">Orders</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="text-right">Profit</TableHead>
                        <TableHead className="text-right">Share</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {members.map(m => (
                        <TableRow key={m.user_id} className={m.is_creator ? "bg-amber-500/5" : ""}>
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-sm font-medium">
                              {m.is_creator && <Crown className="h-3.5 w-3.5 text-amber-600" />}
                              {m.full_name || "—"}
                            </div>
                            <div className="text-xs text-muted-foreground">{m.mobile_number || ""}</div>
                          </TableCell>
                          <TableCell className="text-xs">{new Date(m.joined_at).toLocaleDateString("en-IN")}</TableCell>
                          <TableCell className="text-center">{m.order_count}</TableCell>
                          <TableCell className="text-right">{money(m.revenue)}</TableCell>
                          <TableCell className="text-right text-blue-600">{money(m.profit)}</TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">
                            {detailTotals.revenue > 0 ? `${((m.revenue / detailTotals.revenue) * 100).toFixed(1)}%` : "0%"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
