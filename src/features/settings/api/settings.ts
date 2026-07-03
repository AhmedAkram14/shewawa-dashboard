import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type DB = SupabaseClient<Database>;

export type SettingsData = {
  email: string;
  full_name: string | null;
  role: "owner" | "staff" | "viewer";
  business_id: string;
  business_name: string;
  member_since: string;
};

export async function getSettings(supabase: DB): Promise<SettingsData> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile, error } = await supabase
    .from("users")
    .select("full_name, role, business_id, created_at, businesses(name)")
    .eq("id", user.id)
    .single();

  if (error) throw error;

  const biz = profile.businesses as { name: string } | null;

  return {
    email: user.email ?? "",
    full_name: profile.full_name,
    role: profile.role,
    business_id: profile.business_id,
    business_name: biz?.name ?? "",
    member_since: profile.created_at,
  };
}

export async function updateProfile(
  supabase: DB,
  userId: string,
  full_name: string,
): Promise<void> {
  const { error } = await supabase
    .from("users")
    .update({ full_name: full_name.trim() || null })
    .eq("id", userId);
  if (error) throw error;
}

export async function updateBusinessName(
  supabase: DB,
  businessId: string,
  name: string,
): Promise<void> {
  const { error } = await supabase
    .from("businesses")
    .update({ name: name.trim() })
    .eq("id", businessId);
  if (error) throw error;
}

export async function changePassword(
  supabase: DB,
  newPassword: string,
): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}
