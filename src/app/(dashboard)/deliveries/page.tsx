import { DeliveriesList } from "@/features/deliveries/components/deliveries-list";

export const metadata = { title: "Deliveries" };

export default function DeliveriesPage() {
  return (
    <div className="mx-auto max-w-lg p-4">
      <DeliveriesList />
    </div>
  );
}
