export type Json =
  string | number | boolean | null | { [key: string]: Json } | Json[];

/**
 * Hand-written database types for the v2 domain model.
 *
 * Regenerate for production:
 *   npx supabase gen types typescript --project-id <ref> > src/lib/supabase/database.types.ts
 *
 * Relationships are required by @supabase/supabase-js generic type machinery —
 * omitting them causes `data` to resolve as `never`.
 *
 * All monetary values (unit_price, deposit_amount, cost_price, selling_price)
 * are stored as integers (piastres — smallest currency unit) to avoid
 * floating-point rounding and PostgREST numeric→string coercion.
 *
 * business_id convention (migration 019):
 *   - Every business-owned table has DEFAULT get_my_business_id() on business_id.
 *   - Insert: business_id is optional (DB fills it from JWT context).
 *   - Update: business_id is omitted entirely (immutable after insertion;
 *     enforced by RLS WITH CHECK and absent from the TypeScript Update type).
 */

export type Database = {
  public: {
    Tables: {
      // ── Infrastructure ──────────────────────────────────────────────────────

      businesses: {
        Row: {
          id: string;
          name: string;
          timezone: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          timezone?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          timezone?: string;
          created_at?: string;
        };
        Relationships: [];
      };

      users: {
        Row: {
          id: string;
          business_id: string;
          role: "owner" | "staff" | "viewer";
          full_name: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          business_id: string;
          role?: "owner" | "staff" | "viewer";
          full_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          role?: "owner" | "staff" | "viewer";
          full_name?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "users_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };

      business_counters: {
        Row: {
          business_id: string;
          order_count: number;
          factory_order_count: number;
          delivery_count: number;
        };
        Insert: {
          business_id: string;
          order_count?: number;
          factory_order_count?: number;
          delivery_count?: number;
        };
        Update: {
          order_count?: number;
          factory_order_count?: number;
          delivery_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: "business_counters_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: true;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };

      // ── Product catalog ─────────────────────────────────────────────────────

      products: {
        Row: {
          id: string;
          business_id: string;
          name: string;
          description: string | null;
          image_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id?: string;
          name: string;
          description?: string | null;
          image_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          image_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };

      product_variants: {
        Row: {
          id: string;
          product_id: string;
          business_id: string;
          name: string;
          sku: string | null;
          cost_price: number;
          selling_price: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          business_id?: string;
          name: string;
          sku?: string | null;
          cost_price?: number;
          selling_price?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          name?: string;
          sku?: string | null;
          cost_price?: number;
          selling_price?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_variants_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };

      // ── Customers ───────────────────────────────────────────────────────────

      customers: {
        Row: {
          id: string;
          business_id: string;
          name: string;
          address: string;
          phone: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id?: string;
          name: string;
          address: string;
          phone?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          address?: string;
          phone?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "customers_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };

      // ── Factories ───────────────────────────────────────────────────────────

      factories: {
        Row: {
          id: string;
          business_id: string;
          name: string;
          contact: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id?: string;
          name: string;
          contact?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          contact?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "factories_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };

      // ── Deliveries ──────────────────────────────────────────────────────────

      deliveries: {
        Row: {
          id: string;
          business_id: string;
          delivery_number: number;
          status: "pending" | "dispatched" | "completed";
          dispatched_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id?: string;
          delivery_number: number;
          status?: "pending" | "dispatched" | "completed";
          dispatched_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          delivery_number?: number;
          status?: "pending" | "dispatched" | "completed";
          dispatched_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "deliveries_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };

      // ── Factory orders ──────────────────────────────────────────────────────

      factory_orders: {
        Row: {
          id: string;
          business_id: string;
          factory_order_number: number;
          factory_id: string;
          status: "open" | "closed";
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id?: string;
          factory_order_number: number;
          factory_id: string;
          status?: "open" | "closed";
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          factory_order_number?: number;
          factory_id?: string;
          status?: "open" | "closed";
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "factory_orders_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "factory_orders_factory_id_fkey";
            columns: ["factory_id"];
            isOneToOne: false;
            referencedRelation: "factories";
            referencedColumns: ["id"];
          },
        ];
      };

      factory_order_lines: {
        Row: {
          id: string;
          factory_order_id: string;
          product_variant_id: string;
          quantity: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          factory_order_id: string;
          product_variant_id: string;
          quantity: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          factory_order_id?: string;
          product_variant_id?: string;
          quantity?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "factory_order_lines_factory_order_id_fkey";
            columns: ["factory_order_id"];
            isOneToOne: false;
            referencedRelation: "factory_orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "factory_order_lines_product_variant_id_fkey";
            columns: ["product_variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
        ];
      };

      // ── Orders ──────────────────────────────────────────────────────────────

      orders: {
        Row: {
          id: string;
          business_id: string;
          order_number: number;
          customer_id: string;
          status:
            | "pending"
            | "ready"
            | "out_for_delivery"
            | "delivered"
            | "cancelled";
          delivery_id: string | null;
          deposit_amount: number;
          delivered_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id?: string;
          order_number: number;
          customer_id: string;
          status?:
            | "pending"
            | "ready"
            | "out_for_delivery"
            | "delivered"
            | "cancelled";
          delivery_id?: string | null;
          deposit_amount?: number;
          delivered_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_number?: number;
          customer_id?: string;
          status?:
            | "pending"
            | "ready"
            | "out_for_delivery"
            | "delivered"
            | "cancelled";
          delivery_id?: string | null;
          deposit_amount?: number;
          delivered_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_delivery_id_fkey";
            columns: ["delivery_id"];
            isOneToOne: false;
            referencedRelation: "deliveries";
            referencedColumns: ["id"];
          },
        ];
      };

      order_lines: {
        Row: {
          id: string;
          order_id: string;
          product_variant_id: string;
          quantity: number;
          unit_price: number;
          allocated_quantity: number;
          factory_order_line_id: string | null;
          status: "pending" | "at_factory" | "allocated" | "cancelled";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_variant_id: string;
          quantity: number;
          unit_price: number;
          allocated_quantity?: number;
          factory_order_line_id?: string | null;
          status?: "pending" | "at_factory" | "allocated" | "cancelled";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_variant_id?: string;
          quantity?: number;
          unit_price?: number;
          allocated_quantity?: number;
          factory_order_line_id?: string | null;
          status?: "pending" | "at_factory" | "allocated" | "cancelled";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "order_lines_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_lines_product_variant_id_fkey";
            columns: ["product_variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_lines_factory_order_line_id_fkey";
            columns: ["factory_order_line_id"];
            isOneToOne: false;
            referencedRelation: "factory_order_lines";
            referencedColumns: ["id"];
          },
        ];
      };

      // ── Factory receipts ────────────────────────────────────────────────────

      factory_receipts: {
        Row: {
          id: string;
          factory_order_line_id: string;
          quantity: number;
          reversal_of: string | null;
          received_at: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          factory_order_line_id: string;
          quantity: number;
          reversal_of?: string | null;
          received_at: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          factory_order_line_id?: string;
          quantity?: number;
          reversal_of?: string | null;
          received_at?: string;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "factory_receipts_factory_order_line_id_fkey";
            columns: ["factory_order_line_id"];
            isOneToOne: false;
            referencedRelation: "factory_order_lines";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "factory_receipts_reversal_of_fkey";
            columns: ["reversal_of"];
            isOneToOne: false;
            referencedRelation: "factory_receipts";
            referencedColumns: ["id"];
          },
        ];
      };

      // ── Available stock ─────────────────────────────────────────────────────

      available_stock: {
        Row: {
          id: string;
          business_id: string;
          product_variant_id: string;
          quantity: number;
          source: "factory_surplus" | "cancellation" | "manual";
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id?: string;
          product_variant_id: string;
          quantity: number;
          source: "factory_surplus" | "cancellation" | "manual";
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_variant_id?: string;
          quantity?: number;
          source?: "factory_surplus" | "cancellation" | "manual";
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "available_stock_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "available_stock_product_variant_id_fkey";
            columns: ["product_variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
        ];
      };
    };

    Views: Record<string, never>;

    Functions: {
      get_my_business_id: {
        Args: Record<string, never>;
        Returns: string;
      };
      create_order: {
        Args: {
          p_customer_id: string;
          p_deposit_amount: number;
          p_notes: string | null;
          p_lines: Json;
        };
        Returns: string;
      };
      create_factory_order: {
        Args: {
          p_factory_id: string;
          p_notes: string | null;
          p_groups: Json;
        };
        Returns: string;
      };
      record_factory_receipts: {
        Args: {
          p_factory_order_id: string;
          p_received_at: string;
          p_notes: string | null;
          p_receipts: Json;
        };
        Returns: undefined;
      };
      update_order: {
        Args: {
          p_order_id: string;
          p_deposit_amount: number;
          p_notes: string | null;
        };
        Returns: undefined;
      };
      cancel_order: {
        Args: {
          p_order_id: string;
        };
        Returns: undefined;
      };
      create_delivery: {
        Args: {
          p_order_ids: string[];
          p_notes: string | null;
        };
        Returns: string;
      };
      dispatch_delivery: {
        Args: {
          p_delivery_id: string;
        };
        Returns: undefined;
      };
      complete_delivery: {
        Args: {
          p_delivery_id: string;
        };
        Returns: undefined;
      };
      allocate_from_stock: {
        Args: {
          p_stock_id: string;
          p_order_line_id: string;
          p_quantity: number;
        };
        Returns: undefined;
      };
      add_manual_stock: {
        Args: {
          p_product_variant_id: string;
          p_quantity: number;
          p_notes: string | null;
        };
        Returns: undefined;
      };
      get_today_summary: {
        Args: Record<string, never>;
        Returns: Json;
      };
    };

    Enums: Record<string, never>;

    CompositeTypes: Record<string, never>;
  };
};
