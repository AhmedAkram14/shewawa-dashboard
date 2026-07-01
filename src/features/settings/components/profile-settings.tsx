"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMyProfile, useUpdateUserProfile } from "../hooks/use-settings";

export function ProfileSettings() {
  const { data, isLoading } = useMyProfile();
  const update = useUpdateUserProfile();
  const [fullName, setFullName] = useState("");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (data) setFullName(data.full_name ?? "");
  }, [data]);

  if (isLoading)
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!data) return null;

  function handleSave() {
    const trimmed = fullName.trim();
    if (!trimmed || trimmed === (data!.full_name ?? "")) {
      setEditing(false);
      return;
    }
    update.mutate(
      { id: data!.id, full_name: trimmed },
      { onSuccess: () => setEditing(false) },
    );
  }

  return (
    <div className="space-y-3">
      {data.email && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Email
          </p>
          <p className="text-sm">{data.email}</p>
          <p className="text-xs text-muted-foreground">
            Managed by your sign-in provider — cannot be changed here.
          </p>
        </div>
      )}
      {update.isError && (
        <p className="text-xs text-destructive" role="alert">
          {(update.error as { message?: string })?.message ?? "Failed to save."}
        </p>
      )}
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Full Name
        </p>
        {editing ? (
          <div className="flex gap-2">
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") {
                  setFullName(data.full_name ?? "");
                  setEditing(false);
                }
              }}
              autoFocus
              className="h-9"
            />
            <Button
              size="sm"
              onClick={handleSave}
              disabled={update.isPending || !fullName.trim()}
            >
              Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setFullName(data.full_name ?? "");
                setEditing(false);
              }}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 rounded-md px-0 py-1 text-sm font-medium hover:underline text-left"
          >
            {data.full_name || (
              <span className="text-muted-foreground italic">Not set</span>
            )}
            <span className="text-xs text-muted-foreground">(tap to edit)</span>
          </button>
        )}
      </div>
    </div>
  );
}
