import { FactoryOrderDetail } from "@/features/factory-orders/components/factory-order-detail";

export const metadata = { title: "Factory Order" };

export default async function FactoryOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <FactoryOrderDetail id={id} />;
}
