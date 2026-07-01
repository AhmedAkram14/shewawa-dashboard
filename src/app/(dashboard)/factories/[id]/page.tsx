import { FactoryDetail } from "@/features/factory-orders/components/factory-detail";

export const metadata = { title: "Factory" };

export default async function FactoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <FactoryDetail id={id} />;
}
