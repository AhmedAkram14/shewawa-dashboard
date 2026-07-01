import { z } from "zod";

export type OrderStatus = "active" | "cancelled";

export const createOrderSchema = z.object({
  listing_id: z.string().uuid("Invalid listing"),
  customer_id: z.string().uuid("Invalid customer"),
  variant_id: z.string().uuid("Invalid variant"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  unit_price: z.number().int().min(0, "Price cannot be negative"),
  notes: z.string().optional(),
});

export const updateOrderSchema = z.object({
  quantity: z.number().int().min(1, "Quantity must be at least 1").optional(),
  notes: z.string().optional().nullable(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
