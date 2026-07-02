"use client";

import { Search } from "lucide-react";
import { useState } from "react";

import { signOut } from "@/app/(auth)/actions";
import { GlobalSearch } from "@/features/search/components/global-search";
import { Button } from "@/components/ui/button";

export function Header() {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />

      <header className="flex h-12 shrink-0 items-center justify-between border-b px-4">
        <span className="text-[13px] font-bold tracking-[0.18em] uppercase">
          SHE WAWA
        </span>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </Button>

          <form action={signOut}>
            <Button variant="ghost" size="sm" type="submit">
              Sign out
            </Button>
          </form>
        </div>
      </header>
    </>
  );
}
