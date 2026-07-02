import type { Metadata } from "next";

export const metadata: Metadata = { title: "Customers — SHE WAWA" };

export default function CustomersPage() {
  return (
    <div className="mx-auto max-w-lg p-4">
      <h1 className="text-2xl font-semibold leading-tight">Customers</h1>
    </div>
  );
}
