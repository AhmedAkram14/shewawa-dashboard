export function getErrorMessage(
  err: unknown,
  fallback = "Something went wrong.",
): string {
  if (err instanceof Error) return err.message;
  if (err !== null && typeof err === "object" && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  return fallback;
}
