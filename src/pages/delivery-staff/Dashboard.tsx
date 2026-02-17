import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Package, MapPin, Clock, LogOut, Wallet, CheckCircle2, Truck } from "lucide-react";
import logo from "@/assets/logo.png";

interface Order {
  id: string;
  status: string;
  total: number;
  shipping_address: string | null;
  created_at: string;
  items: any;
  user_id: string | null;
}

const STATUS_FLOW = ["pending", "accepted", "pickup", "shipped", "delivered"];

const DeliveryStaffDashboard = () => {
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [assignedWards, setAssignedWards] = useState<{ local_body_name: string; ward_number: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    const [ordersRes, walletRes, wardsRes, lbRes] = await Promise.all([
      supabase.from("orders").select("*").eq("assigned_delivery_staff_id", user.id).order("created_at", { ascending: false }),
      supabase.from("delivery_staff_wallets").select("*").eq("staff_user_id", user.id).maybeSingle(),
      supabase.from("delivery_staff_ward_assignments").select("*").eq("staff_user_id", user.id),
      supabase.from("locations_local_bodies").select("id, name"),
    ]);

    setOrders((ordersRes.data as Order[]) ?? []);
    setWalletBalance(walletRes.data?.balance ?? 0);

    const lbs = lbRes.data ?? [];
    const wards = (wardsRes.data ?? []).map((w: any) => {
      const lb = lbs.find((l) => l.id === w.local_body_id);
      return { local_body_name: lb?.name ?? "", ward_number: w.ward_number };
    });
    setAssignedWards(wards);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const getNextStatus = (current: string) => {
    const idx = STATUS_FLOW.indexOf(current);
    if (idx === -1 || idx >= STATUS_FLOW.length - 1) return null;
    return STATUS_FLOW[idx + 1];
  };

  const updateOrderStatus = async (order: Order, newStatus: string) => {
    const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", order.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    // If delivered, credit wallet
    if (newStatus === "delivered") {
      await creditWallet(order);
    }

    toast({ title: `Order ${newStatus}` });
    fetchData();
  };

  const creditWallet = async (order: Order) => {
    if (!user) return;
    // Ensure wallet exists
    let { data: wallet } = await supabase
      .from("delivery_staff_wallets")
      .select("*")
      .eq("staff_user_id", user.id)
      .maybeSingle();

    if (!wallet) {
      const { data: newWallet } = await supabase
        .from("delivery_staff_wallets")
        .insert({ staff_user_id: user.id, balance: 0 })
        .select()
        .single();
      wallet = newWallet;
    }

    if (!wallet) return;

    const deliveryAmount = 30; // Fixed delivery fee
    // Credit transaction
    await supabase.from("delivery_staff_wallet_transactions").insert({
      wallet_id: wallet.id,
      staff_user_id: user.id,
      order_id: order.id,
      amount: deliveryAmount,
      type: "credit",
      description: `Delivery fee for order ${order.id.slice(0, 8)}`,
    });

    // Update balance
    await supabase
      .from("delivery_staff_wallets")
      .update({ balance: (wallet.balance ?? 0) + deliveryAmount })
      .eq("id", wallet.id);
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "delivered": return "default";
      case "accepted": return "secondary";
      case "shipped": return "outline";
      case "pickup": return "outline";
      default: return "secondary";
    }
  };

  const pendingCount = orders.filter((o) => o.status !== "delivered").length;
  const deliveredToday = orders.filter((o) => o.status === "delivered" && new Date(o.created_at).toDateString() === new Date().toDateString()).length;

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Pennyekart" className="h-8" />
          <span className="font-semibold text-foreground">Delivery Dashboard</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{profile?.full_name}</span>
          <Button variant="outline" size="sm" onClick={signOut}><LogOut className="h-4 w-4" /></Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl p-4 space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Welcome, {profile?.full_name}!</h1>

        <div className="grid gap-4 sm:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
              <Package className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">{pendingCount}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Delivered Today</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">{deliveredToday}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Wallet</CardTitle>
              <Wallet className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">₹{walletBalance}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">My Wards</CardTitle>
              <MapPin className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {assignedWards.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {assignedWards.map((w, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{w.local_body_name} W{w.ward_number}</Badge>
                  ))}
                </div>
              ) : <p className="text-sm text-muted-foreground">No wards assigned</p>}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Truck className="h-5 w-5" /> My Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : orders.length === 0 ? (
              <p className="text-muted-foreground">No orders assigned yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((o) => {
                      const next = getNextStatus(o.status);
                      return (
                        <TableRow key={o.id}>
                          <TableCell className="font-mono text-xs">{o.id.slice(0, 8)}…</TableCell>
                          <TableCell>₹{o.total}</TableCell>
                          <TableCell className="text-sm max-w-[200px] truncate">{o.shipping_address ?? "—"}</TableCell>
                          <TableCell>
                            <Badge variant={statusColor(o.status) as any}>{o.status}</Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(o.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {next ? (
                              <Button size="sm" onClick={() => updateOrderStatus(o, next)}>
                                {next === "accepted" ? "Accept" :
                                 next === "pickup" ? "Pickup" :
                                 next === "shipped" ? "Ship" :
                                 next === "delivered" ? "Delivered" : next}
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">Done</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default DeliveryStaffDashboard;
