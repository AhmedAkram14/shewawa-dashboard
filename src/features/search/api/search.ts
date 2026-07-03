import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type DB = SupabaseClient<Database>;

export type CustomerResult = {
  id: string;
  name: string;
  phone: string | null;
};

export type OrderResult = {
  id: string;
  order_number: number;
  status: string;
  customers: { name: string } | null;
};

export type FactoryOrderResult = {
  id: string;
  factory_order_number: number;
  status: string;
  factories: { name: string } | null;
};

export type FactoryResult = {
  id: string;
  name: string;
  contact: string | null;
};

export type ProductResult = {
  id: string;
  name: string;
};

export type SearchResults = {
  customers: CustomerResult[];
  orders: OrderResult[];
  factoryOrders: FactoryOrderResult[];
  factories: FactoryResult[];
  products: ProductResult[];
};

export async function searchAll(
  supabase: DB,
  query: string,
): Promise<SearchResults> {
  const trimmed = query.trim();
  const q = `%${trimmed}%`;
  const numericQuery = /^\d+$/.test(trimmed) ? parseInt(trimmed, 10) : null;

  const [customersRes, ordersRes, factoryOrdersRes, factoriesRes, productsRes] =
    await Promise.all([
      supabase
        .from("customers")
        .select("id, name, phone")
        .or(`name.ilike.${q},phone.ilike.${q}`)
        .limit(6),

      numericQuery !== null
        ? supabase
            .from("orders")
            .select("id, order_number, status, customers(name)")
            .eq("order_number", numericQuery)
            .limit(6)
        : Promise.resolve({ data: [], error: null }),

      numericQuery !== null
        ? supabase
            .from("factory_orders")
            .select("id, factory_order_number, status, factories(name)")
            .eq("factory_order_number", numericQuery)
            .limit(6)
        : Promise.resolve({ data: [], error: null }),

      supabase
        .from("factories")
        .select("id, name, contact")
        .or(`name.ilike.${q},contact.ilike.${q}`)
        .limit(6),

      supabase.from("products").select("id, name").ilike("name", q).limit(6),
    ]);

  return {
    customers: (customersRes.data ?? []) as CustomerResult[],
    orders: (ordersRes.data ?? []) as OrderResult[],
    factoryOrders: (factoryOrdersRes.data ?? []) as FactoryOrderResult[],
    factories: (factoriesRes.data ?? []) as FactoryResult[],
    products: (productsRes.data ?? []) as ProductResult[],
  };
}
