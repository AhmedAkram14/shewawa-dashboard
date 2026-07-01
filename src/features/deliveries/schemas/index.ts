import { z } from "zod";

export type DeliveryStatus =
  "pending" | "out_for_delivery" | "delivered" | "refused" | "failed";

export const createDeliverySchema = z.object({
  customer_id: z.string().uuid("Invalid customer"),
  order_ids: z.array(z.string().uuid()).min(1, "Select at least one order"),
  notes: z.string().optional(),
});

export type CreateDeliveryInput = z.infer<typeof createDeliverySchema>;
