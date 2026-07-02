import type { Metadata } from "next";

export const metadata: Metadata = { title: "Today — SHE WAWA" };

export default function TodayPage() {
  return (
    <div className="mx-auto max-w-lg p-4">
      <h1 className="text-2xl font-semibold leading-tight">Today</h1>
    </div>
  );
}
