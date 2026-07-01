"use client";

import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import { getVariants } from "../api/variants";

export function useVariants(productId: string) {
  return useQuery({
    queryKey: ["listings", productId, "variants"],
    queryFn: () => getVariants(createClient(), productId),
    enabled: !!productId,
  });
}
