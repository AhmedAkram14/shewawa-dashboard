import { z } from "zod";

export const customerSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  address: z.string().min(1, "Address is required").max(300),
  phone: z.string().max(30).optional(),
  notes: z.string().max(500).optional(),
});

export type CustomerInput = z.infer<typeof customerSchema>;
