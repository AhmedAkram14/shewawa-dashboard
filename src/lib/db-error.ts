/**
 * Translates raw Supabase/Postgres errors into user-facing messages.
 * Add new constraint names here as the schema grows.
 */

const CONSTRAINT_MESSAGES: Record<string, string> = {
  // Factory orders
  factory_orders_one_open_per_factory:
    "This factory already has an open factory order. Close it first, or add these items to the existing order.",

  // Orders
  orders_business_id_order_number_key:
    "An order with this number already exists.",

  // Deliveries
  deliveries_business_id_delivery_number_key:
    "A delivery with this number already exists.",

  // Factory orders number
  factory_orders_business_id_factory_order_number_key:
    "A factory order with this number already exists.",

  // Products
  products_business_id_name_key: "A product with this name already exists.",

  // Customers
  customers_business_id_phone_key:
    "A customer with this phone number already exists.",

  // Factories
  factories_business_id_name_key: "A factory with this name already exists.",
};

// Postgres error codes → generic fallback messages
const CODE_MESSAGES: Record<string, string> = {
  "23505": "This record already exists.",
  "23503": "A related record could not be found.",
  "23502": "A required field is missing.",
  "23514": "The value doesn't meet the required format.",
  "42501": "You don't have permission to perform this action.",
};

export function friendlyError(err: unknown): string {
  if (!(err instanceof Error)) return "Something went wrong.";

  const message = err.message;
  const code = (err as { code?: string }).code;

  for (const [constraint, friendly] of Object.entries(CONSTRAINT_MESSAGES)) {
    if (message.includes(constraint)) return friendly;
  }

  if (code && CODE_MESSAGES[code]) return CODE_MESSAGES[code];

  return message;
}
