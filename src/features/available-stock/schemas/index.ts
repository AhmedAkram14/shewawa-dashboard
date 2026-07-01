import { z } from "zod";

export const STOCK_REASONS = [
  "factory_extra",
  "inventory_correction",
  "returned_item",
  "old_stock",
  "other",
] as const;

export type StockReason = (typeof STOCK_REASONS)[number];

export const STOCK_REASON_LABELS: Record<StockReason, string> = {
  factory_extra: "Factory extra",
  inventory_correction: "Inventory correction",
  returned_item: "Returned item",
  old_stock: "Old stock",
  other: "Other",
};

export const addStockSchema = z.object({
  variant_id: z.string().uuid("Select a variant"),
  listing_id: z.string().uuid().optional(),
  quantity: z.number().int().positive("Quantity must be at least 1"),
  reason: z.enum(STOCK_REASONS, { error: "Select a reason" }),
  notes: z.string().optional(),
});

export type AddStockInput = z.infer<typeof addStockSchema>;

export const updateStockSchema = z.object({
  quantity: z.number().int().positive("Quantity must be at least 1"),
  notes: z.string().optional(),
});

export type UpdateStockInput = z.infer<typeof updateStockSchema>;
