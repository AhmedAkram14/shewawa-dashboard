import type { Metadata } from "next";

import { CustomerList } from "@/features/customers/components/customer-list";

export const metadata: Metadata = {
  title: "Customers — SHE WAWA",
};

export default function CustomersPage() {
  return <CustomerList />;
}
