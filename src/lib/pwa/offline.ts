// Tracks browser online/offline status via window events.

const listeners = new Set<(online: boolean) => void>();

if (typeof window !== "undefined") {
  window.addEventListener("online", () => listeners.forEach((fn) => fn(true)));
  window.addEventListener("offline", () =>
    listeners.forEach((fn) => fn(false)),
  );
}

export function isOnline(): boolean {
  if (typeof window === "undefined") return true;
  return navigator.onLine;
}

export function subscribeOnline(fn: (online: boolean) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
