import type { Metadata } from "next";

import { ExploreDemoSection } from "@/features/demo/components/explore-demo-section";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in — SHE WAWA",
};

export default function LoginPage() {
  const demoEnabled =
    !!process.env.DEMO_ACCOUNT_EMAIL && !!process.env.DEMO_ACCOUNT_PASSWORD;

  return (
    <div className="w-full max-w-sm space-y-6">
      <LoginForm />
      {demoEnabled && <ExploreDemoSection />}
    </div>
  );
}
