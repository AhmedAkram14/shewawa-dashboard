"use client";

import { InstallBanner } from "./install-banner";
import { OfflineScreen } from "./offline-screen";
import { UpdateBanner } from "./update-banner";

export function PwaProvider() {
  return (
    <>
      <UpdateBanner />
      <InstallBanner />
      <OfflineScreen />
    </>
  );
}
