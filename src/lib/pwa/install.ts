// Captures the beforeinstallprompt event and manages install state.
// The event must be preventDefault'd immediately; we replay it on demand.

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "pwa-install-dismissed";

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => fn());
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    notify();
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    localStorage.setItem(DISMISSED_KEY, "installed");
    notify();
  });
}

export function canInstall(): boolean {
  if (typeof window === "undefined") return false;
  if (localStorage.getItem(DISMISSED_KEY)) return false;
  return deferredPrompt !== null;
}

export async function triggerInstall(): Promise<
  "accepted" | "dismissed" | "unavailable"
> {
  if (!deferredPrompt) return "unavailable";
  await deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  notify();
  return outcome;
}

export function dismissInstall(): void {
  localStorage.setItem(DISMISSED_KEY, "dismissed");
  deferredPrompt = null;
  notify();
}

export function subscribeInstall(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
