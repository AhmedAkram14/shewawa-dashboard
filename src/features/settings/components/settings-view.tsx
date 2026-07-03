"use client";

import { useState } from "react";
import { signOut } from "@/app/(auth)/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { SettingsData } from "../api/settings";
import {
  useChangePassword,
  useUpdateBusinessName,
  useUpdateProfile,
} from "../hooks/use-settings-mutations";

const ROLE_LABEL: Record<SettingsData["role"], string> = {
  owner: "Owner",
  staff: "Staff",
  viewer: "Viewer",
};

const ROLE_CLASS: Record<SettingsData["role"], string> = {
  owner: "bg-c50 text-coral-dk border-c100",
  staff: "bg-warn-bg text-warn-tx border-warn-tx/30",
  viewer: "bg-muted text-muted-foreground border-border",
};

interface Props {
  data: SettingsData;
  userId: string;
}

export function SettingsView({ data, userId }: Props) {
  return (
    <div className="space-y-4">
      <AccountSection data={data} />
      <ProfileSection data={data} userId={userId} />
      {data.role === "owner" && <BusinessSection data={data} />}
      <SecuritySection />
      <Separator />
      <form action={signOut}>
        <Button
          variant="outline"
          type="submit"
          className="w-full border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive"
        >
          Sign out
        </Button>
      </form>
    </div>
  );
}

/* ── Account (read-only) ──────────────────────────────────────────── */

function AccountSection({ data }: { data: SettingsData }) {
  const joined = new Date(data.member_since).toLocaleDateString("en-EG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <section className="overflow-hidden rounded-xl border bg-card">
      <SectionHeader title="Account" />
      <div className="divide-y">
        <Row label="Email" value={data.email} />
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm text-muted-foreground">Role</span>
          <Badge variant="outline" className={ROLE_CLASS[data.role]}>
            {ROLE_LABEL[data.role]}
          </Badge>
        </div>
        <Row label="Member since" value={joined} />
      </div>
    </section>
  );
}

/* ── Profile (editable name) ──────────────────────────────────────── */

function ProfileSection({
  data,
  userId,
}: {
  data: SettingsData;
  userId: string;
}) {
  const [name, setName] = useState(data.full_name ?? "");
  const mutation = useUpdateProfile(userId);
  const dirty = name !== (data.full_name ?? "");

  return (
    <section className="overflow-hidden rounded-xl border bg-card">
      <SectionHeader title="Profile" />
      <div className="p-4">
        <div className="space-y-1.5">
          <Label htmlFor="full-name">Display name</Label>
          <Input
            id="full-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            maxLength={80}
          />
        </div>
        <Button
          className="mt-3 w-full"
          disabled={!dirty || mutation.isPending}
          onClick={() => mutation.mutate(name)}
        >
          {mutation.isPending ? "Saving…" : "Save name"}
        </Button>
      </div>
    </section>
  );
}

/* ── Business (owner-only) ────────────────────────────────────────── */

function BusinessSection({ data }: { data: SettingsData }) {
  const [bizName, setBizName] = useState(data.business_name);
  const mutation = useUpdateBusinessName(data.business_id);
  const dirty = bizName.trim() !== data.business_name && bizName.trim() !== "";

  return (
    <section className="overflow-hidden rounded-xl border bg-card">
      <SectionHeader title="Business" />
      <div className="p-4">
        <div className="space-y-1.5">
          <Label htmlFor="biz-name">Business name</Label>
          <Input
            id="biz-name"
            value={bizName}
            onChange={(e) => setBizName(e.target.value)}
            placeholder="Business name"
            maxLength={120}
          />
        </div>
        <Button
          className="mt-3 w-full"
          disabled={!dirty || mutation.isPending}
          onClick={() => mutation.mutate(bizName)}
        >
          {mutation.isPending ? "Saving…" : "Save business name"}
        </Button>
      </div>
    </section>
  );
}

/* ── Security (change password) ───────────────────────────────────── */

function SecuritySection() {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const mutation = useChangePassword();

  const mismatch = confirm !== "" && pw !== confirm;
  const canSubmit = pw.length >= 8 && pw === confirm && !mutation.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    mutation.mutate(pw, {
      onSuccess: () => {
        setPw("");
        setConfirm("");
      },
    });
  }

  return (
    <section className="overflow-hidden rounded-xl border bg-card">
      <SectionHeader title="Security" />
      <form onSubmit={handleSubmit} className="p-4">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="new-pw">New password</Label>
            <Input
              id="new-pw"
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-pw">Confirm password</Label>
            <Input
              id="confirm-pw"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat new password"
              autoComplete="new-password"
            />
            {mismatch && (
              <p className="text-xs text-destructive">
                Passwords don&apos;t match
              </p>
            )}
          </div>
        </div>
        <Button type="submit" className="mt-3 w-full" disabled={!canSubmit}>
          {mutation.isPending ? "Updating…" : "Change password"}
        </Button>
      </form>
    </section>
  );
}

/* ── Shared sub-components ────────────────────────────────────────── */

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="border-b px-4 py-2.5">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
