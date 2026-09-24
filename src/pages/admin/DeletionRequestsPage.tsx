import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

type Req = {
  id: string; full_name: string; mobile: string; email: string | null; reason: string | null;
  status: string; admin_notes: string | null; handled_at: string | null; created_at: string;
};
const STATUSES = ["pending", "in_progress", "completed", "rejected"];

const DeletionRequestsPage = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<Req[]>([]);
  const [filter, setFilter] = useState("pending");
  const [edit, setEdit] = useState<Req | null>(null);
  const [status, setStatus] = useState("pending");
  const [notes, setNotes] = useState("");

  const load = async () => {
    let q = supabase.from("account_deletion_requests").select("*").order("created_at", { ascending: false });
    if (filter !== "all") q = q.eq("status", filter);
    const { data, error } = await q;
    if (error) toast.error(error.message);
    setRows((data as Req[]) ?? []);
  };
  useEffect(() => { load(); }, [filter]);

  const save = async () => {
    if (!edit) return;
    const { error } = await supabase.from("account_deletion_requests").update({
      status, admin_notes: notes.trim() || null, handled_by: user?.id ?? null,
      handled_at: status === "pending" ? null : new Date().toISOString(),
    }).eq("id", edit.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Request updated");
    setEdit(null); load();
  };

  return (
    <AdminLayout>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Deletion Requests</h1>
          <p className="text-sm text-muted-foreground">Requests from the public account deletion page. Verify the mobile number, delete the user from Users, then mark completed.</p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Date</TableHead><TableHead>Name</TableHead><TableHead>Mobile</TableHead>
            <TableHead>Email</TableHead><TableHead>Reason</TableHead><TableHead>Status</TableHead><TableHead />
          </TableRow></TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="whitespace-nowrap">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                <TableCell>{r.full_name}</TableCell>
                <TableCell>{r.mobile}</TableCell>
                <TableCell>{r.email ?? "—"}</TableCell>
                <TableCell className="max-w-xs truncate">{r.reason ?? "—"}</TableCell>
                <TableCell><Badge variant={r.status === "completed" ? "default" : "secondary"}>{r.status.replace("_", " ")}</Badge></TableCell>
                <TableCell><Button size="sm" variant="outline" onClick={() => { setEdit(r); setStatus(r.status); setNotes(r.admin_notes ?? ""); }}>Update</Button></TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">No requests</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Update request</DialogTitle></DialogHeader>
          {edit && <div className="space-y-3 text-sm">
            <p><b>{edit.full_name}</b> · {edit.mobile}</p>
            {edit.reason && <p className="text-muted-foreground">{edit.reason}</p>}
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}</SelectContent>
            </Select>
            <Textarea placeholder="Admin notes" value={notes} maxLength={1000} onChange={(e) => setNotes(e.target.value)} />
          </div>}
          <DialogFooter><Button onClick={save}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default DeletionRequestsPage;
