import type { Metadata } from "next";

export const metadata: Metadata = { title: "Orders — SHE WAWA" };

export default function OrdersPage() {
  return (
    <div className="mx-auto max-w-lg p-4">
      <h1 className="text-2xl font-semibold leading-tight">Orders</h1>
    </div>
  );
}
