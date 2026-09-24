import { adminClient, corsHeaders, getUserId, json, sha256 } from "../_shared/auth.ts";

const TTL_MIN = 10;
const norm = (v: string | null | undefined) => (v ?? "").replace(/\D/g, "").slice(-10);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const uid = await getUserId(req);
  if (!uid) return json({ error: "Unauthorized" }, 401);

  let mobile = "";
  try { mobile = norm((await req.json())?.mobile); } catch { /* empty */ }
  if (mobile.length !== 10) return json({ error: "Enter a valid 10-digit mobile number" }, 400);

  const admin = adminClient();
  const { data: p } = await admin.from("profiles").select("mobile_number, is_verified").eq("user_id", uid).maybeSingle();
  if (!p) return json({ error: "Profile not found" }, 404);
  if (p.is_verified) return json({ error: "Already verified" }, 400);
  if (norm(p.mobile_number) !== mobile) return json({ error: "mismatch" }, 400);

  // Basic rate limit: one new code per 60 seconds
  const { data: existing } = await admin.from("verification_codes").select("created_at").eq("user_id", uid).maybeSingle();
  if (existing && Date.now() - new Date(existing.created_at).getTime() < 60_000) {
    return json({ error: "Please wait a minute before requesting a new code." }, 429);
  }

  const code = String(100000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 900000));
  const { error } = await admin.from("verification_codes").upsert({
    user_id: uid,
    code_hash: await sha256(`${uid}:${code}`),
    expires_at: new Date(Date.now() + TTL_MIN * 60_000).toISOString(),
    attempts: 0,
    created_at: new Date().toISOString(),
  });
  if (error) return json({ error: "Could not start verification" }, 500);

  // Delivered through the user's own WhatsApp (wa.me link opened by the app)
  return json({ code, ttl_minutes: TTL_MIN });
});
