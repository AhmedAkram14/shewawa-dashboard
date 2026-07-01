import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in — SHE WAWA",
};

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm space-y-6 text-center">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">SHE WAWA</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to your account to continue
        </p>
      </div>
      {/* Authentication UI — implemented in Phase 2 */}
    </div>
  );
}
