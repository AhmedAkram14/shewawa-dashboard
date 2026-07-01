import { z } from "zod";

// ── Catalog Products ──────────────────────────────────────────────────────────

export const createProductSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or fewer"),
  description: z
    .string()
    .max(500, "Description must be 500 characters or fewer")
    .optional(),
  image_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  is_active: z.boolean().default(true),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

// ── Product Variants ──────────────────────────────────────────────────────────
// Prices are integers (piastres/cents). Multiply EGP × 100 before submitting.

export const createVariantSchema = z.object({
  product_id: z.string().uuid("Invalid product ID"),
  name: z
    .string()
    .min(1, "Variant name is required")
    .max(100, "Variant name must be 100 characters or fewer"),
  sku: z.string().max(50, "SKU must be 50 characters or fewer").optional(),
  cost_price: z
    .number()
    .int("Cost price must be a whole number (piastres)")
    .min(0, "Cost price cannot be negative"),
  selling_price: z
    .number()
    .int("Selling price must be a whole number (piastres)")
    .min(0, "Selling price cannot be negative"),
});

export const updateVariantSchema = createVariantSchema
  .omit({ product_id: true })
  .partial();

export type CreateVariantInput = z.infer<typeof createVariantSchema>;
export type UpdateVariantInput = z.infer<typeof updateVariantSchema>;

// ── Collections ───────────────────────────────────────────────────────────────

export const createCollectionSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or fewer"),
});

export const updateCollectionSchema = createCollectionSchema.partial();

export type CreateCollectionInput = z.infer<typeof createCollectionSchema>;
export type UpdateCollectionInput = z.infer<typeof updateCollectionSchema>;

// ── Listings ──────────────────────────────────────────────────────────────────

export type ListingStatus =
  | "collecting"
  | "decision"
  | "ordered"
  | "receiving"
  | "ready_for_packing"
  | "reconciled"
  | "cancelled";

export type ListingAction =
  | "end_collecting"
  | "proceed"
  | "cancel"
  | "extend"
  | "mark_receiving"
  | "mark_ready_for_packing"
  | "mark_reconciled";

export const createListingSchema = z.object({
  catalog_product_id: z.string().uuid("Invalid product"),
  collection_id: z.string().uuid("Invalid collection").optional(),
  closes_on: z.string().min(1, "Closing date is required"),
  threshold: z.number().int().min(1, "Threshold must be at least 1").optional(),
});

export const updateListingSchema = z.object({
  collection_id: z.string().uuid().optional().nullable(),
  closes_on: z.string().min(1).optional(),
  threshold: z.number().int().min(1).optional().nullable(),
});

export const extendListingSchema = z.object({
  closes_on: z.string().min(1, "New closing date is required"),
});

export type CreateListingInput = z.infer<typeof createListingSchema>;
export type UpdateListingInput = z.infer<typeof updateListingSchema>;
export type ExtendListingInput = z.infer<typeof extendListingSchema>;
