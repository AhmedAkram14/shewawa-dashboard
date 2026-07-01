"use client";

import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/types";

export function useUserRole() {
  return useQuery({
    queryKey: ["user-role"],
    queryFn: async (): Promise<UserRole> => {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("users")
        .select("role")
        .single();

      if (error) throw error;
      if (!data) throw new Error("No user profile found");
      return data.role as UserRole;
    },
    staleTime: 5 * 60 * 1000,
  });
}
