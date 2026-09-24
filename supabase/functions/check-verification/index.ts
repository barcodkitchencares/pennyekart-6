import { adminClient, corsHeaders, getUserId, json, sha256 } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const uid = await getUserId(req);
  if (!uid) return json({ error: "Unauthorized" }, 401);

  let code = "";
  try { code = String((await req.json())?.code ?? "").replace(/\D/g, ""); } catch { /* empty */ }
  if (code.length !== 6) return json({ error: "Enter the 6-digit code" }, 400);

  const admin = adminClient();
  const { data: row } = await admin.from("verification_codes").select("*").eq("user_id", uid).maybeSingle();
  if (!row || new Date(row.expires_at) < new Date()) {
    return json({ error: "expired" }, 400);
  }
  if (row.attempts >= 5) {
    await admin.from("verification_codes").delete().eq("user_id", uid);
    return json({ error: "expired" }, 400);
  }
  if ((await sha256(`${uid}:${code}`)) !== row.code_hash) {
    await admin.from("verification_codes").update({ attempts: row.attempts + 1 }).eq("user_id", uid);
    return json({ error: "Incorrect code. Please check your WhatsApp message." }, 400);
  }

  const { error } = await admin.from("profiles")
    .update({ is_verified: true, verified_at: new Date().toISOString() })
    .eq("user_id", uid);
  if (error) return json({ error: "Verification failed" }, 500);
  await admin.from("verification_codes").delete().eq("user_id", uid);
  return json({ ok: true });
});
