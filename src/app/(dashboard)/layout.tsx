export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      {/* Main content — padded at the bottom to leave room for the fixed
          bottom navigation bar that will be added in Phase 7. */}
      <main className="flex-1 pb-16">{children}</main>

      {/* Bottom navigation — implemented in Phase 7 */}
    </div>
  );
}
