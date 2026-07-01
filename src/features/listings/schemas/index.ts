import { z } from "zod";

// ── Products ──────────────────────────────────────────────────────────────────

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

// ── Variants ──────────────────────────────────────────────────────────────────
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
