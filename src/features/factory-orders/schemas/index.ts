import { z } from "zod";

export type FactoryOrderStatus = "draft" | "placed";

// ── Factories ─────────────────────────────────────────────────────────────────

export const createFactorySchema = z.object({
  name: z
    .string()
    .min(1, "Factory name is required")
    .max(100, "Name must be 100 characters or fewer"),
  contact: z.string().optional(),
});

export const updateFactorySchema = createFactorySchema.partial();

export type CreateFactoryInput = z.infer<typeof createFactorySchema>;
export type UpdateFactoryInput = z.infer<typeof updateFactorySchema>;

// ── Factory Orders ────────────────────────────────────────────────────────────

export const createFactoryOrderSchema = z.object({
  factory_id: z.string().uuid("Invalid factory"),
  listing_ids: z.array(z.string().uuid()).min(1, "Select at least one listing"),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export type CreateFactoryOrderInput = z.infer<typeof createFactoryOrderSchema>;
