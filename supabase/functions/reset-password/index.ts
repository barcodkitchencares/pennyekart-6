import { adminClient, corsHeaders, getUserId, json } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { action, mobile_number, date_of_birth, new_password, user_id } = await req.json();
    const admin = adminClient();

    // Admin sets a temporary password. Caller must be a super admin or have user-management permission.
    if (action === "reset_by_admin") {
      const caller = await getUserId(req);
      if (!caller) return json({ success: false, message: "Please sign in again." }, 401);
      const { data: cp } = await admin.from("profiles").select("is_super_admin, role_id").eq("user_id", caller).maybeSingle();
      let allowed = !!cp?.is_super_admin;
      if (!allowed && cp?.role_id) {
        const { data: perms } = await admin.from("role_permissions")
          .select("permissions!inner(name)").eq("role_id", cp.role_id).in("permissions.name", ["update_users", "read_users"]);
        allowed = (perms?.length ?? 0) > 0;
      }
      if (!allowed) return json({ success: false, message: "Not allowed." }, 403);
      if (!user_id || typeof new_password !== "string" || new_password.length < 8) {
        return json({ success: false, message: "Temporary password must be at least 8 characters." });
      }
      const { data: target } = await admin.from("profiles").select("is_super_admin").eq("user_id", user_id).maybeSingle();
      if (target?.is_super_admin && !cp?.is_super_admin) return json({ success: false, message: "Not allowed." }, 403);

      const { error } = await admin.auth.admin.updateUserById(user_id, { password: new_password });
      if (error) return json({ success: false, message: error.message });
      // User must replace the temporary password after their next login
      await admin.from("profiles").update({ password_status: "temporary" }).eq("user_id", user_id);
      return json({ success: true });
    }

    // Partner self-service recovery (mobile + date of birth). Not available for customers.
    const { data: profile } = await admin.from("profiles")
      .select("user_id, date_of_birth, user_type").eq("mobile_number", mobile_number).neq("user_type", "customer").maybeSingle();
    if (!profile || !profile.date_of_birth || profile.date_of_birth !== date_of_birth) {
      return json({ verified: false, message: "Details do not match. Please contact Pennyekart support." });
    }
    if (action === "verify") return json({ verified: true });
    if (action === "reset") {
      if (typeof new_password !== "string" || new_password.length < 8) {
        return json({ success: false, message: "Password must be at least 8 characters." });
      }
      const { error } = await admin.auth.admin.updateUserById(profile.user_id, { password: new_password });
      if (error) return json({ success: false, message: error.message });
      return json({ success: true });
    }
    return json({ error: "Invalid action" }, 400);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});
