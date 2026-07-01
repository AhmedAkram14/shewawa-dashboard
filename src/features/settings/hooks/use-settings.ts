"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import {
  getMyBusiness,
  getMyProfile,
  updateBusiness,
  updateUserProfile,
} from "../api/settings";

export function useMyBusiness() {
  return useQuery({
    queryKey: ["settings", "business"],
    queryFn: () => getMyBusiness(createClient()),
  });
}

export function useUpdateBusiness() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      updateBusiness(createClient(), id, name),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["settings", "business"] }),
  });
}

export function useMyProfile() {
  return useQuery({
    queryKey: ["settings", "profile"],
    queryFn: () => getMyProfile(createClient()),
  });
}

export function useUpdateUserProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, full_name }: { id: string; full_name: string }) =>
      updateUserProfile(createClient(), id, full_name),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["settings", "profile"] }),
  });
}
