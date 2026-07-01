import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

type Client = SupabaseClient<Database>;

export type BusinessSettings = {
  id: string;
  name: string;
};

export type UserProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
};

export async function getMyBusiness(client: Client): Promise<BusinessSettings> {
  const { data, error } = await client
    .from("businesses")
    .select("id, name")
    .single();
  if (error) throw error;
  return data;
}

export async function updateBusiness(
  client: Client,
  id: string,
  name: string,
): Promise<void> {
  const { error } = await client
    .from("businesses")
    .update({ name })
    .eq("id", id);
  if (error) throw error;
}

export async function getMyProfile(client: Client): Promise<UserProfile> {
  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();
  if (authError || !user) throw authError ?? new Error("Not authenticated");

  const { data, error } = await client
    .from("users")
    .select("id, full_name")
    .eq("id", user.id)
    .single();
  if (error) throw error;
  const row = data as { id: string; full_name: string | null };
  return { id: row.id, full_name: row.full_name, email: user.email ?? null };
}

export async function updateUserProfile(
  client: Client,
  id: string,
  full_name: string,
): Promise<void> {
  const { error } = await client
    .from("users")
    .update({ full_name })
    .eq("id", id);
  if (error) throw error;
}
