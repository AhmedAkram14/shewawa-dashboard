import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Product — SHE WAWA",
};

// params is a Promise in Next.js 15 App Router
export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold">Product</h1>
      <p className="text-sm text-muted-foreground">{id}</p>
      {/* Product detail and variants UI — implemented in Phase 3 */}
    </div>
  );
}
