"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import {
  useCreateFactory,
  useUpdateFactory,
} from "../hooks/use-factory-mutations";
import { factorySchema } from "../schemas";
import { friendlyError } from "@/lib/db-error";
import type { FactoryRow } from "../api/factories";

interface AddProps {
  mode: "add";
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface EditProps {
  mode: "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  factory: FactoryRow;
}

type Props = AddProps | EditProps;

export function FactorySheet(props: Props) {
  const { mode, open, onOpenChange } = props;
  const factory = mode === "edit" ? props.factory : null;

  const [name, setName] = useState(factory?.name ?? "");
  const [contact, setContact] = useState(factory?.contact ?? "");
  const [notes, setNotes] = useState(factory?.notes ?? "");
  const [error, setError] = useState<string | null>(null);

  const create = useCreateFactory();
  const update = useUpdateFactory(factory?.id ?? "");
  const mutation = mode === "add" ? create : update;

  useEffect(() => {
    if (open) {
      setName(factory?.name ?? "");
      setContact(factory?.contact ?? "");
      setNotes(factory?.notes ?? "");
      setError(null);
    }
  }, [open, factory]);

  function reset() {
    setName("");
    setContact("");
    setNotes("");
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const result = factorySchema.safeParse({
      name,
      contact: contact.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }
    mutation.mutate(result.data, {
      onSuccess: () => {
        if (mode === "add") reset();
        onOpenChange(false);
      },
      onError: (err) => setError(friendlyError(err)),
    });
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o && mode === "add") reset();
        onOpenChange(o);
      }}
    >
      <SheetContent side="bottom">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <SheetHeader>
            <SheetTitle>
              {mode === "add" ? "New Factory" : "Edit Factory"}
            </SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-4 px-4">
            <div className="space-y-1.5">
              <Label htmlFor="fs-name">Name</Label>
              <Input
                id="fs-name"
                placeholder="e.g. Delta Textiles"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus={mode === "add"}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fs-contact">
                Contact{" "}
                <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="fs-contact"
                placeholder="e.g. 01012345678 or contact name"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fs-notes">
                Notes <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="fs-notes"
                placeholder="Any notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <SheetFooter>
            <Button
              type="submit"
              className="w-full"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Saving…" : "Save"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
