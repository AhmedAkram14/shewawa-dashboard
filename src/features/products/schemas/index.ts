import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  description: z.string().max(500).optional(),
});

export const updateProductSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  description: z.string().max(500).optional(),
});

const priceField = z.coerce
  .number({ error: "Must be a number" })
  .min(0, "Must be 0 or more");

export const variantSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  sku: z.string().max(80).optional(),
  cost_price_egp: priceField,
  selling_price_egp: priceField,
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type VariantInput = z.infer<typeof variantSchema>;
