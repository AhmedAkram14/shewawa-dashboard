import type { Metadata } from "next";

import { NewFactoryOrderView } from "@/features/factory-orders/components/new-factory-order-view";

export const metadata: Metadata = { title: "Send to Factory — SHE WAWA" };

export default function NewFactoryOrderPage() {
  return <NewFactoryOrderView />;
}
