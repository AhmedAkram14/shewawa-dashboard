import { signOut } from "@/app/(auth)/actions";
import { BottomNav } from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="flex h-12 shrink-0 items-center justify-end border-b px-4">
        <form action={signOut}>
          <Button variant="ghost" size="sm" type="submit">
            Sign out
          </Button>
        </form>
      </header>

      <main className="flex-1 pb-20">{children}</main>

      <BottomNav />
    </div>
  );
}
