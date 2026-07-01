import type { Metadata } from "next";

import { ListingsList } from "@/features/listings/components/listings-list";

export const metadata: Metadata = {
  title: "Listings — SHE WAWA",
};

export default function ListingsPage() {
  return <ListingsList />;
}
