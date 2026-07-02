"use client";

import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";

export function useBusinessId() {
  return useQuery({
    queryKey: ["business-id"],
    queryFn: async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("users")
        .select("business_id")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      return data.business_id as string;
    },
    staleTime: Infinity,
  });
}
