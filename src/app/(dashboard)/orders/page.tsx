import type { Metadata } from "next";

import { OrdersView } from "@/features/orders/components/orders-view";

export const metadata: Metadata = {
  title: "Orders — SHE WAWA",
};

export default function OrdersPage() {
  return <OrdersView />;
}
