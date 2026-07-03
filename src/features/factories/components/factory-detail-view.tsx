"use client";

import { ArrowLeft, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { useFactory } from "../hooks/use-factories";
import type { FactoryRow } from "../api/factories";
import { FactorySheet } from "./factory-sheet";

interface Props {
  id: string;
  initialData: FactoryRow;
}

export function FactoryDetailView({ id, initialData }: Props) {
  const router = useRouter();
  const { data: factory } = useFactory(id, initialData);
  const [editOpen, setEditOpen] = useState(false);

  if (!factory) return null;

  return (
    <div className="mx-auto max-w-lg space-y-5 p-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft />
        </Button>
        <div className="flex flex-1 items-center justify-between">
          <h1 className="text-2xl font-semibold leading-tight">
            {factory.name}
          </h1>
          <Button variant="ghost" size="icon" onClick={() => setEditOpen(true)}>
            <Pencil />
          </Button>
        </div>
      </div>

      <section className="rounded-lg border divide-y">
        <div className="p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Contact
          </p>
          <p className="mt-1 text-sm">
            {factory.contact ?? (
              <span className="text-muted-foreground">—</span>
            )}
          </p>
        </div>
        <div className="p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Notes
          </p>
          <p className="mt-1 text-sm">
            {factory.notes ?? <span className="text-muted-foreground">—</span>}
          </p>
        </div>
      </section>

      <Separator />

      <p className="text-xs text-muted-foreground">
        Added {new Date(factory.created_at).toLocaleDateString("en-EG")}
      </p>

      <FactorySheet
        mode="edit"
        open={editOpen}
        onOpenChange={setEditOpen}
        factory={factory}
      />
    </div>
  );
}
