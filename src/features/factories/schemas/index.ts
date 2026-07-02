import { z } from "zod";

export const factorySchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  contact: z.string().max(120).optional(),
  notes: z.string().max(500).optional(),
});

export type FactoryInput = z.infer<typeof factorySchema>;
