"use client";

import { SearchButton } from "@/components/search/search-button";

export function Header() {
  return (
    <header className="shrink-0 border-b">
      <div className="mx-auto flex h-12 max-w-lg items-center justify-between px-4">
        <span className="text-[13px] font-bold tracking-[0.18em] uppercase">
          SHE WAWA
        </span>

        <div className="flex items-center gap-1">
          <SearchButton />
        </div>
      </div>
    </header>
  );
}
