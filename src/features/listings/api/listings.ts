import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  Database,
  ProductRow,
  CollectionRow,
  ListingRow,
} from "@/lib/supabase/database.types";
import type {
  CreateListingInput,
  UpdateListingInput,
  ListingStatus,
  ListingAction,
} from "../schemas";

type Client = SupabaseClient<Database>;

// ── Joined types returned by this API ─────────────────────────────────────────

export type ListingWithRelations = Omit<ListingRow, "status"> & {
  status: ListingStatus;
  products: ProductRow;
  collections: CollectionRow | null;
};

export type ListingSummary = Omit<ListingRow, "status"> & {
  status: ListingStatus;
  products: { name: string; is_active: boolean };
  collections: { name: string } | null;
};

// ── Queries ───────────────────────────────────────────────────────────────────

export async function getListings(client: Client): Promise<ListingSummary[]> {
  const { data, error } = await client
    .from("listings")
    .select("*, products(name, is_active), collections(name)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as ListingSummary[];
}

export async function getListingsByStatus(
  client: Client,
  status: ListingStatus,
): Promise<ListingSummary[]> {
  const { data, error } = await client
    .from("listings")
    .select("*, products(name, is_active), collections(name)")
    .eq("status", status)
    .order("closes_on", { ascending: true });

  if (error) throw error;
  return (data ?? []) as unknown as ListingSummary[];
}

export async function getListing(
  client: Client,
  id: string,
): Promise<ListingWithRelations> {
  const { data, error } = await client
    .from("listings")
    .select("*, products(*), collections(*)")
    .eq("id", id)
    .single();

  if (error) throw error;
  if (!data) throw new Error("Listing not found");
  return data as unknown as ListingWithRelations;
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export async function createListing(
  client: Client,
  input: CreateListingInput,
): Promise<ListingRow> {
  const { data: businessId, error: rpcError } =
    await client.rpc("get_my_business_id");
  if (rpcError) throw rpcError;
  if (!businessId) throw new Error("Could not resolve business");

  const { data, error } = await client
    .from("listings")
    .insert({
      business_id: businessId,
      catalog_product_id: input.catalog_product_id,
      collection_id: input.collection_id ?? null,
      closes_on: input.closes_on,
      threshold: input.threshold ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error("Insert returned no data");
  return data;
}

export async function updateListing(
  client: Client,
  id: string,
  input: UpdateListingInput,
): Promise<ListingRow> {
  const { data, error } = await client
    .from("listings")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error("Update returned no data");
  return data;
}

// ── Status transitions ────────────────────────────────────────────────────────
// Enforces the frozen lifecycle state machine.
// Invalid transitions throw rather than silently failing.

const VALID_TRANSITIONS: Record<
  ListingStatus,
  Partial<Record<ListingAction, ListingStatus>>
> = {
  collecting: { end_collecting: "decision" },
  decision: {
    proceed: "ordered",
    cancel: "cancelled",
    extend: "collecting",
  },
  ordered: { mark_receiving: "receiving" },
  receiving: { mark_ready_for_packing: "ready_for_packing" },
  ready_for_packing: { mark_reconciled: "reconciled" },
  reconciled: {},
  cancelled: {},
};

export async function transitionListingStatus(
  client: Client,
  id: string,
  action: ListingAction,
  options?: { closes_on?: string },
): Promise<ListingRow> {
  const { data: current, error: fetchError } = await client
    .from("listings")
    .select("status")
    .eq("id", id)
    .single();

  if (fetchError) throw fetchError;
  if (!current) throw new Error("Listing not found");

  const currentStatus = current.status as ListingStatus;
  const nextStatus = VALID_TRANSITIONS[currentStatus]?.[action];

  if (!nextStatus) {
    throw new Error(
      `Invalid transition: cannot "${action}" from "${currentStatus}"`,
    );
  }

  if (action === "extend" && !options?.closes_on) {
    throw new Error("closes_on is required for the extend action");
  }

  // Build a typed update payload — Supabase rejects Record<string, unknown>
  const update =
    action === "extend"
      ? { status: nextStatus, closes_on: options!.closes_on }
      : { status: nextStatus };

  const { data, error } = await client
    .from("listings")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error("Update returned no data");
  return data;
}
