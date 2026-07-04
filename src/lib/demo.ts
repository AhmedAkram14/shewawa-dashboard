export const DEMO_EMAIL = process.env.NEXT_PUBLIC_DEMO_EMAIL ?? "";

export function isDemoUser(email: string | null | undefined): boolean {
  return !!DEMO_EMAIL && email === DEMO_EMAIL;
}
