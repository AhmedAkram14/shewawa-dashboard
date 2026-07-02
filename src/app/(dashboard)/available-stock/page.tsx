import type { Metadata } from "next";

export const metadata: Metadata = { title: "Available Stock — SHE WAWA" };

export default function AvailableStockPage() {
  return (
    <div className="mx-auto max-w-lg p-4">
      <h1 className="text-2xl font-semibold leading-tight">Available Stock</h1>
    </div>
  );
}
