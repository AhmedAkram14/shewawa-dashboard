import type { Metadata } from "next";

export const metadata: Metadata = { title: "Products — SHE WAWA" };

export default function ProductsPage() {
  return (
    <div className="mx-auto max-w-lg p-4">
      <h1 className="text-2xl font-semibold leading-tight">Products</h1>
    </div>
  );
}
