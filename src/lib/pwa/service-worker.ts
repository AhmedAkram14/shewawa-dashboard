// Detects when a new service worker is waiting and coordinates the update.
// Sends SKIP_WAITING to the waiting SW; reloads once controllerchange fires.

let updateWaiting = false;
let initialized = false;
const listeners = new Set<(waiting: boolean) => void>();

function notify() {
  listeners.forEach((fn) => fn(updateWaiting));
}

export function initServiceWorkerUpdates(): void {
  if (initialized) return;
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  initialized = true;

  navigator.serviceWorker.ready.then((registration) => {
    if (registration.waiting) {
      updateWaiting = true;
      notify();
    }

    registration.addEventListener("updatefound", () => {
      const incoming = registration.installing;
      if (!incoming) return;
      incoming.addEventListener("statechange", () => {
        if (
          incoming.state === "installed" &&
          navigator.serviceWorker.controller
        ) {
          updateWaiting = true;
          notify();
        }
      });
    });
  });

  // Reload once the new SW takes control — triggered by applyUpdate()
  let reloading = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });
}

export function isUpdateWaiting(): boolean {
  return updateWaiting;
}

export function applyUpdate(): void {
  navigator.serviceWorker.ready.then((reg) => {
    reg.waiting?.postMessage({ type: "SKIP_WAITING" });
  });
}

export function subscribeUpdate(fn: (waiting: boolean) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
