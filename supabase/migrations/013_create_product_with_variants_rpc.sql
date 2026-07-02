-- =============================================================================
-- create_product_with_variants(...)
--
-- Atomically inserts a Product and one-or-more ProductVariants inside a single
-- implicit PostgreSQL transaction.  Any failure (constraint violation, bad
-- price, etc.) rolls back the entire operation — the caller can never produce
-- a Product without Variants.
--
-- Parameters
--   p_name        — product name (required, 1-100 chars enforced by table CHECK)
--   p_description — optional freetext description
--   p_image_url   — optional URL; empty string is stored as NULL
--   p_is_active   — defaults to true
--   p_variants    — JSON array, each element:
--                   { "name": text, "sku": text|null,
--                     "cost_price": integer, "selling_price": integer }
--                   All prices are in piastres (integer × 100 per EGP).
--
-- Returns the newly created products row as jsonb.
--
-- Security: SECURITY INVOKER (default). RLS INSERT policies on both tables
-- check business_id = get_my_business_id(), which is satisfied because we set
-- business_id to exactly what that function returns. No privilege escalation.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.create_product_with_variants(
  p_name        text,
  p_description text    DEFAULT NULL,
  p_image_url   text    DEFAULT NULL,
  p_is_active   boolean DEFAULT true,
  p_variants    jsonb   DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_business_id uuid;
  v_product     public.products%ROWTYPE;
  v_variant     jsonb;
BEGIN
  -- Enforce the business rule at the database layer.
  -- No caller — UI or otherwise — can create a Product without Variants.
  IF jsonb_array_length(p_variants) = 0 THEN
    RAISE EXCEPTION 'A product must have at least one variant';
  END IF;

  -- Resolve the tenant; fails fast if the caller has no business association.
  SELECT public.get_my_business_id() INTO v_business_id;
  IF v_business_id IS NULL THEN
    RAISE EXCEPTION 'Could not resolve business for current user';
  END IF;

  -- Insert the product. Table CHECKs enforce name length etc.
  INSERT INTO public.products (name, description, image_url, is_active, business_id)
  VALUES (
    p_name,
    NULLIF(p_description, ''),
    NULLIF(p_image_url,   ''),
    p_is_active,
    v_business_id
  )
  RETURNING * INTO v_product;

  -- Insert each variant. If any INSERT fails the whole transaction rolls back,
  -- including the product row inserted above.
  FOR v_variant IN SELECT * FROM jsonb_array_elements(p_variants) LOOP
    INSERT INTO public.product_variants (
      product_id, name, sku, cost_price, selling_price, business_id
    ) VALUES (
      v_product.id,
      v_variant->>'name',
      NULLIF(v_variant->>'sku', ''),
      (v_variant->>'cost_price')::integer,
      (v_variant->>'selling_price')::integer,
      v_business_id
    );
  END LOOP;

  RETURN to_jsonb(v_product);
END;
$$;
