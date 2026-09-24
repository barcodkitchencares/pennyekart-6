import { adminClient, corsHeaders, getUserId, json } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const uid = await getUserId(req);
  if (!uid) return json({ error: "Please sign in again to delete your account." }, 401);

  let body: { confirm?: unknown } = {};
  try { body = await req.json(); } catch { /* empty */ }
  if (body.confirm !== "DELETE") return json({ error: "Type DELETE to confirm." }, 400);

  const admin = adminClient();

  // Remove the profile photo if it is stored in our own storage
  const { data: profile } = await admin.from("profiles").select("avatar_url").eq("user_id", uid).maybeSingle();

  // Runs as one database transaction: anonymise, delete, then remove the login
  const { error } = await admin.rpc("delete_account_data", { _uid: uid });
  if (error) {
    const known = /community|Super admin/i.test(error.message);
    return json({ error: known ? error.message : "Account deletion failed. Nothing was deleted. Please try again." }, 400);
  }

  const url = profile?.avatar_url as string | undefined;
  const marker = "/storage/v1/object/public/";
  if (url && url.includes(marker)) {
    const [bucket, ...rest] = url.split(marker)[1].split("/");
    await admin.storage.from(bucket).remove([rest.join("/")]).catch(() => {});
  }

  return json({ ok: true });
});
