import { Button } from "@/components/ui/button";
import { signOut } from "@/app/(auth)/actions";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      {/* Minimal top bar — holds sign-out for Phase 1.
          Replaced by the real app header in later phases. */}
      <header className="flex h-12 shrink-0 items-center justify-end border-b px-4">
        <form action={signOut}>
          <Button variant="ghost" size="sm" type="submit">
            Sign out
          </Button>
        </form>
      </header>

      {/* Main content — padded at the bottom to leave room for the fixed
          bottom navigation bar that will be added in Phase 7. */}
      <main className="flex-1 pb-16">{children}</main>

      {/* Bottom navigation — implemented in Phase 7 */}
    </div>
  );
}
