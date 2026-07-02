import { z } from "zod";

export const orderLineSchema = z.object({
  product_variant_id: z.string().uuid(),
  quantity: z.number().int().min(1, "Must be at least 1"),
  unit_price: z.number().int().min(0),
});

export const createOrderSchema = z.object({
  customer_id: z.string().uuid("Select a customer"),
  deposit_amount_egp: z.coerce.number().min(0).default(0),
  notes: z.string().max(500).optional(),
  lines: z.array(orderLineSchema).min(1, "Add at least one item"),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type OrderLineInput = z.infer<typeof orderLineSchema>;
