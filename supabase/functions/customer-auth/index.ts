import { createClient } from "npm:@supabase/supabase-js@2";
import { adminClient, corsHeaders, getUserId, json } from "../_shared/auth.ts";

const norm = (v: unknown) => String(v ?? "").replace(/\D/g, "").slice(-10);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* empty */ }
  const admin = adminClient();

  // TEMPORARY migration path: accounts created with the old shared password.
  // The old password lives only on the server and is used only for accounts still marked "legacy".
  if (body.action === "legacy_login") {
    const mobile = norm(body.mobile);
    if (mobile.length !== 10) return json({ error: "Enter a valid 10-digit mobile number" }, 400);
    const email = `${mobile}@pennyekart.in`;

    const { data: p } = await admin.from("profiles")
      .select("password_status, user_type").eq("email", email).maybeSingle();
    if (!p) return json({ status: "not_registered" });
    if (p.user_type !== "customer" || p.password_status !== "legacy") return json({ status: "password_required" });

    const legacy = Deno.env.get("LEGACY_CUSTOMER_PASSWORD");
    if (!legacy) return json({ error: "Login temporarily unavailable" }, 500);
    const anon = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { auth: { persistSession: false } });
    const { data, error } = await anon.auth.signInWithPassword({ email, password: legacy });
    if (error || !data.session) return json({ status: "password_required" });
    return json({ status: "ok", access_token: data.session.access_token, refresh_token: data.session.refresh_token });
  }

  // Signed-in user sets their own password → account becomes "migrated"
  if (body.action === "set_password") {
    const uid = await getUserId(req);
    if (!uid) return json({ error: "Please sign in again" }, 401);
    const password = String(body.password ?? "");
    if (password.length < 8 || password.length > 72) return json({ error: "Password must be 8–72 characters" }, 400);
    if (password === Deno.env.get("LEGACY_CUSTOMER_PASSWORD")) return json({ error: "Choose a different password" }, 400);
    const { data: p } = await admin.from("profiles").select("mobile_number").eq("user_id", uid).maybeSingle();
    if (p?.mobile_number && norm(p.mobile_number) === norm(password)) return json({ error: "Do not use your mobile number as password" }, 400);

    const { error } = await admin.auth.admin.updateUserById(uid, { password });
    if (error) return json({ error: "Could not update password" }, 500);
    await admin.from("profiles").update({ password_status: "migrated" }).eq("user_id", uid);
    return json({ ok: true });
  }

  return json({ error: "Invalid action" }, 400);
});
