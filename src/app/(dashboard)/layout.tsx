import { BottomNav } from "@/components/bottom-nav";
import { Header } from "@/components/header";
import { DemoBanner } from "@/features/demo/components/demo-banner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <Header />
      <DemoBanner />
      <main className="flex-1 pb-20">{children}</main>
      <BottomNav />
    </div>
  );
}
