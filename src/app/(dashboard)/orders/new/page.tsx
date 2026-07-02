import type { Metadata } from "next";

import { NewOrderView } from "@/features/orders/components/new-order-view";

export const metadata: Metadata = { title: "New Order — SHE WAWA" };

export default function NewOrderPage() {
  return <NewOrderView />;
}
