"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";

import {
  createProduct,
  createVariant,
  deleteVariant,
  updateProduct,
  updateVariant,
  uploadProductImage,
} from "../api/products";
import type {
  CreateProductInput,
  UpdateProductInput,
  VariantInput,
} from "../schemas";
import { productKeys } from "./use-products";

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateProductInput & { imageFile?: File }) => {
      const supabase = createClient();
      const product = await createProduct(supabase, {
        name: input.name,
        description: input.description ?? null,
      });
      if (input.imageFile) {
        const imageUrl = await uploadProductImage(
          supabase,
          product.id,
          input.imageFile,
        );
        await updateProduct(supabase, product.id, { image_url: imageUrl });
      }
      return product;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.all }),
  });
}

export function useUpdateProduct(productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Partial<Pick<UpdateProductInput, "name" | "description">> & {
        is_active?: boolean;
        image_url?: string | null;
        imageFile?: File;
      },
    ) => {
      const supabase = createClient();
      const { imageFile, ...rest } = input;
      if (imageFile) {
        const imageUrl = await uploadProductImage(
          supabase,
          productId,
          imageFile,
        );
        return updateProduct(supabase, productId, {
          ...rest,
          image_url: imageUrl,
        });
      }
      return updateProduct(supabase, productId, rest);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productKeys.all });
      qc.invalidateQueries({ queryKey: productKeys.detail(productId) });
    },
  });
}

export function useCreateVariant(productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: VariantInput) =>
      createVariant(createClient(), {
        product_id: productId,
        name: input.name,
        sku: input.sku?.trim() || null,
        cost_price: Math.round(input.cost_price_egp * 100),
        selling_price: Math.round(input.selling_price_egp * 100),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: productKeys.detail(productId) }),
  });
}

export function useUpdateVariant(productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: VariantInput }) =>
      updateVariant(createClient(), id, {
        name: input.name,
        sku: input.sku?.trim() || null,
        cost_price: Math.round(input.cost_price_egp * 100),
        selling_price: Math.round(input.selling_price_egp * 100),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: productKeys.detail(productId) }),
  });
}

export function useDeleteVariant(productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (variantId: string) => deleteVariant(createClient(), variantId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: productKeys.detail(productId) }),
  });
}
