import { CustomerDetail } from "@/features/customers/components/customer-detail";

export const metadata = { title: "Customer" };

export default async function CustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CustomerDetail id={id} />;
}
