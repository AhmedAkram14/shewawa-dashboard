"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useCreateFactory } from "../hooks/use-factory-mutations";

export function CreateFactorySheet() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [error, setError] = useState<string | null>(null);

  const create = useCreateFactory();

  function reset() {
    setName("");
    setContact("");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setError(null);
    try {
      await create.mutateAsync({
        name: name.trim(),
        contact: contact.trim() || undefined,
      });
      reset();
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create factory");
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button size="sm" />}>+ New Factory</SheetTrigger>
      <SheetContent className="w-full sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>New Factory</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4 px-4 pb-8">
          <div className="space-y-2">
            <Label htmlFor="fac_name">Name</Label>
            <Input
              id="fac_name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Factory name"
              maxLength={100}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fac_contact">Contact (optional)</Label>
            <Input
              id="fac_contact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Phone or email"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={create.isPending} className="w-full">
            {create.isPending ? "Creating…" : "Create Factory"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
