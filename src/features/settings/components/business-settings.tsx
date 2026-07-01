"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMyBusiness, useUpdateBusiness } from "../hooks/use-settings";

export function BusinessSettings() {
  const { data, isLoading } = useMyBusiness();
  const update = useUpdateBusiness();
  const [name, setName] = useState("");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (data) setName(data.name);
  }, [data]);

  if (isLoading)
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!data) return null;

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed || trimmed === data!.name) {
      setEditing(false);
      return;
    }
    update.mutate(
      { id: data!.id, name: trimmed },
      { onSuccess: () => setEditing(false) },
    );
  }

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Business Name
      </p>
      {update.isError && (
        <p className="text-xs text-destructive" role="alert">
          {(update.error as { message?: string })?.message ?? "Failed to save."}
        </p>
      )}
      {editing ? (
        <div className="flex gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") {
                setName(data.name);
                setEditing(false);
              }
            }}
            autoFocus
            className="h-9"
          />
          <Button
            size="sm"
            onClick={handleSave}
            disabled={update.isPending || !name.trim()}
          >
            Save
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setName(data.name);
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
          {data.name}
          <span className="text-xs text-muted-foreground">(tap to edit)</span>
        </button>
      )}
    </div>
  );
}
