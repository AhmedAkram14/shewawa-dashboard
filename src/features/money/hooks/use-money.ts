"use client";

import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import { getMoneySnapshot } from "../api/money";

export function useMoneySnapshot() {
  return useQuery({
    queryKey: ["money"],
    queryFn: () => getMoneySnapshot(createClient()),
  });
}
