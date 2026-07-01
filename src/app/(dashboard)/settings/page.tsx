import { BusinessSettings } from "@/features/settings/components/business-settings";
import { ProfileSettings } from "@/features/settings/components/profile-settings";

export const metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-lg space-y-8 p-4">
      <h1 className="text-xl font-semibold">Settings</h1>

      <section className="space-y-4 rounded-lg border p-4">
        <h2 className="text-sm font-semibold">Business</h2>
        <BusinessSettings />
      </section>

      <section className="space-y-4 rounded-lg border p-4">
        <h2 className="text-sm font-semibold">Profile</h2>
        <ProfileSettings />
      </section>
    </div>
  );
}
