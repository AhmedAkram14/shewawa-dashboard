"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import {
  createListing,
  updateListing,
  transitionListingStatus,
} from "../api/listings";
import type {
  CreateListingInput,
  UpdateListingInput,
  ListingAction,
} from "../schemas";

export function useCreateListing() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateListingInput) =>
      createListing(createClient(), input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["listings-list"] });
    },
  });
}

export function useUpdateListing() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateListingInput }) =>
      updateListing(createClient(), id, input),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["listings-list"] });
      qc.invalidateQueries({ queryKey: ["listings-list", id] });
    },
  });
}

export function useTransitionListingStatus() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      action,
      closes_on,
    }: {
      id: string;
      action: ListingAction;
      closes_on?: string;
    }) => transitionListingStatus(createClient(), id, action, { closes_on }),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["listings-list"] });
      qc.invalidateQueries({ queryKey: ["listings-list", id] });
    },
  });
}
