"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import {
  changePassword,
  updateBusinessName,
  updateProfile,
} from "../api/settings";

export function useUpdateProfile(userId: string) {
  return useMutation({
    mutationFn: (full_name: string) =>
      updateProfile(createClient(), userId, full_name),
    onSuccess: () => toast.success("Name updated"),
    onError: (e) => toast.error(e.message),
  });
}

export function useUpdateBusinessName(businessId: string) {
  return useMutation({
    mutationFn: (name: string) =>
      updateBusinessName(createClient(), businessId, name),
    onSuccess: () => toast.success("Business name updated"),
    onError: (e) => toast.error(e.message),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (password: string) => changePassword(createClient(), password),
    onSuccess: () => toast.success("Password changed"),
    onError: (e) => toast.error(e.message),
  });
}
