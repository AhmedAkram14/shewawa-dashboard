import { FactoryOrdersList } from "@/features/factory-orders/components/factory-orders-list";

export const metadata = { title: "Factory Orders" };

export default function FactoryOrdersPage() {
  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <h1 className="text-xl font-semibold">Factory Orders</h1>
      <FactoryOrdersList />
    </div>
  );
}
