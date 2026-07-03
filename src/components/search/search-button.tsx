"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SearchOverlay } from "./search-overlay";

export function SearchButton() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Portal requires document — only available after hydration
  useEffect(() => setMounted(true), []);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Search"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4" />
      </Button>

      {mounted &&
        open &&
        createPortal(
          <SearchOverlay onClose={() => setOpen(false)} />,
          document.body,
        )}
    </>
  );
}
