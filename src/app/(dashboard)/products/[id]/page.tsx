import type { Metadata } from "next";

export const metadata: Metadata = { title: "Product — SHE WAWA" };

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="mx-auto max-w-lg p-4">
      <p className="text-sm text-muted-foreground">{id}</p>
    </div>
  );
}
