import type { Metadata } from "next";

import { TodayDashboard } from "@/features/today/components/today-dashboard";

export const metadata: Metadata = {
  title: "Today — SHE WAWA",
};

export default function TodayPage() {
  return <TodayDashboard />;
}
