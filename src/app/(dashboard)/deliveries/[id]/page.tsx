import { DeliveryDetail } from "@/features/deliveries/components/delivery-detail";

export const metadata = { title: "Delivery" };

export default async function DeliveryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DeliveryDetail id={id} />;
}
