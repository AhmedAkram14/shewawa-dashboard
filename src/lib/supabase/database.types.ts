/**
 * Hand-written database types — extended each phase.
 *
 * Generate automatically for production:
 *   npx supabase gen types typescript --project-id <ref> > src/lib/supabase/database.types.ts
 *
 * Relationships and CompositeTypes are required by @supabase/supabase-js
 * generic type machinery. Omitting them causes `data` to resolve as `never`.
 *
 * Prices (cost_price, selling_price) are stored as integers (piastres/cents).
 * PostgreSQL integer columns are returned as JS numbers by PostgREST — no
 * string-coercion issue that numeric/decimal columns have.
 */

export type Database = {
  public: {
    Tables: {
      // ── Phase 1 ────────────────────────────────────────────────────────────

      businesses: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
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
          business_id?: string;
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

      // ── Phase 2 ────────────────────────────────────────────────────────────

      products: {
        Row: {
          id: string;
          business_id: string;
          name: string;
          description: string | null;
          image_url: string | null;
          is_active: boolean;
          factory_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          name: string;
          description?: string | null;
          image_url?: string | null;
          is_active?: boolean;
          factory_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          name?: string;
          description?: string | null;
          image_url?: string | null;
          is_active?: boolean;
          factory_id?: string | null;
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
          {
            foreignKeyName: "products_factory_id_fkey";
            columns: ["factory_id"];
            isOneToOne: false;
            referencedRelation: "factories";
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
          business_id: string;
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
          business_id?: string;
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

      // ── Phase 5 ────────────────────────────────────────────────────────────

      factories: {
        Row: {
          id: string;
          business_id: string;
          name: string;
          contact: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          name: string;
          contact?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          name?: string;
          contact?: string | null;
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

      factory_orders: {
        Row: {
          id: string;
          business_id: string;
          factory_id: string;
          reference: string | null;
          status: "draft" | "placed";
          notes: string | null;
          placed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          factory_id: string;
          reference?: string | null;
          status?: string;
          notes?: string | null;
          placed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          factory_id?: string;
          reference?: string | null;
          status?: string;
          notes?: string | null;
          placed_at?: string | null;
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
          business_id: string;
          factory_order_id: string;
          listing_id: string;
          variant_id: string;
          quantity: number;
          unit_cost: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          factory_order_id: string;
          listing_id: string;
          variant_id: string;
          quantity: number;
          unit_cost: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          factory_order_id?: string;
          listing_id?: string;
          variant_id?: string;
          quantity?: number;
          unit_cost?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "factory_order_lines_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "factory_order_lines_factory_order_id_fkey";
            columns: ["factory_order_id"];
            isOneToOne: false;
            referencedRelation: "factory_orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "factory_order_lines_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "factory_order_lines_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
        ];
      };

      // ── Phase 6 ────────────────────────────────────────────────────────────

      deliveries: {
        Row: {
          id: string;
          business_id: string;
          customer_id: string;
          status:
            "pending" | "out_for_delivery" | "delivered" | "refused" | "failed";
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          customer_id: string;
          status?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          customer_id?: string;
          status?: string;
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
          {
            foreignKeyName: "deliveries_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };

      delivery_orders: {
        Row: {
          id: string;
          business_id: string;
          delivery_id: string;
          order_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          delivery_id: string;
          order_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          delivery_id?: string;
          order_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "delivery_orders_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "delivery_orders_delivery_id_fkey";
            columns: ["delivery_id"];
            isOneToOne: false;
            referencedRelation: "deliveries";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "delivery_orders_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };

      available_stock: {
        Row: {
          id: string;
          business_id: string;
          variant_id: string;
          listing_id: string | null;
          quantity: number;
          reason:
            | "factory_extra"
            | "inventory_correction"
            | "returned_item"
            | "old_stock"
            | "other";
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          variant_id: string;
          listing_id?: string | null;
          quantity: number;
          reason: string;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          variant_id?: string;
          listing_id?: string | null;
          quantity?: number;
          reason?: string;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
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
            foreignKeyName: "available_stock_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "available_stock_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
        ];
      };

      // ── Phase 4 ────────────────────────────────────────────────────────────

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
          business_id: string;
          name: string;
          address: string;
          phone?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
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

      orders: {
        Row: {
          id: string;
          business_id: string;
          listing_id: string;
          customer_id: string;
          variant_id: string;
          quantity: number;
          unit_price: number;
          notes: string | null;
          status: "active" | "cancelled";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          listing_id: string;
          customer_id: string;
          variant_id: string;
          quantity: number;
          unit_price: number;
          notes?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          listing_id?: string;
          customer_id?: string;
          variant_id?: string;
          quantity?: number;
          unit_price?: number;
          notes?: string | null;
          status?: string;
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
            foreignKeyName: "orders_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
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
            foreignKeyName: "orders_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
        ];
      };

      // ── Phase 3 ────────────────────────────────────────────────────────────

      collections: {
        Row: {
          id: string;
          business_id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "collections_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };

      listings: {
        Row: {
          id: string;
          business_id: string;
          catalog_product_id: string;
          collection_id: string | null;
          closes_on: string;
          threshold: number | null;
          factory_order_id: string | null;
          status:
            | "collecting"
            | "decision"
            | "ordered"
            | "receiving"
            | "ready_for_packing"
            | "reconciled"
            | "cancelled";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          catalog_product_id: string;
          collection_id?: string | null;
          closes_on: string;
          threshold?: number | null;
          factory_order_id?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          catalog_product_id?: string;
          collection_id?: string | null;
          closes_on?: string;
          threshold?: number | null;
          factory_order_id?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "listings_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "listings_catalog_product_id_fkey";
            columns: ["catalog_product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "listings_collection_id_fkey";
            columns: ["collection_id"];
            isOneToOne: false;
            referencedRelation: "collections";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "listings_factory_order_id_fkey";
            columns: ["factory_order_id"];
            isOneToOne: false;
            referencedRelation: "factory_orders";
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
    };

    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

// ── Convenience row types ─────────────────────────────────────────────────────

export type BusinessRow = Database["public"]["Tables"]["businesses"]["Row"];
export type UserRow = Database["public"]["Tables"]["users"]["Row"];
export type ProductRow = Database["public"]["Tables"]["products"]["Row"];
export type ProductVariantRow =
  Database["public"]["Tables"]["product_variants"]["Row"];
export type CollectionRow = Database["public"]["Tables"]["collections"]["Row"];
export type ListingRow = Database["public"]["Tables"]["listings"]["Row"];
export type CustomerRow = Database["public"]["Tables"]["customers"]["Row"];
export type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
export type FactoryRow = Database["public"]["Tables"]["factories"]["Row"];
export type FactoryOrderRow =
  Database["public"]["Tables"]["factory_orders"]["Row"];
export type FactoryOrderLineRow =
  Database["public"]["Tables"]["factory_order_lines"]["Row"];
export type DeliveryRow = Database["public"]["Tables"]["deliveries"]["Row"];
export type DeliveryOrderRow =
  Database["public"]["Tables"]["delivery_orders"]["Row"];
export type AvailableStockRow =
  Database["public"]["Tables"]["available_stock"]["Row"];
