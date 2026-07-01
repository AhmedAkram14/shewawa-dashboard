/**
 * Role model as defined in the architecture spec §7.
 * - owner : full access including Money and Settings
 * - staff : operational access, no Money/Settings
 * - viewer: read-only across all screens
 */
export type UserRole = "owner" | "staff" | "viewer";

/**
 * Supabase JSON column type — used when typing jsonb columns in DB responses.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/**
 * Utility — extract the resolved type of a Promise.
 */
export type Awaited<T> = T extends Promise<infer U> ? U : T;
