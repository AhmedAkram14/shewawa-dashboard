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
