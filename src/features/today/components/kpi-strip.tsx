import type { TodayKpis } from "../api/today";

function scrollTo(sectionId: string) {
  document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
}

function InteractiveChip({
  value,
  label,
  sectionId,
}: {
  value: number;
  label: string;
  sectionId: string;
}) {
  return (
    <button
      type="button"
      onClick={() => scrollTo(sectionId)}
      className="flex shrink-0 min-w-20 flex-col items-center gap-0.5 rounded-lg border bg-card px-4 py-2.5 transition-colors hover:bg-accent active:bg-accent/80"
    >
      <span className="text-xl font-semibold tabular-nums">{value}</span>
      <span className="text-center text-[10px] leading-tight text-muted-foreground">
        {label}
      </span>
    </button>
  );
}

function StaticChip({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex shrink-0 min-w-20 flex-col items-center gap-0.5 rounded-lg border bg-card px-4 py-2.5">
      <span className="text-xl font-semibold tabular-nums">{value}</span>
      <span className="text-center text-[10px] leading-tight text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

export function KpiStrip({ kpis }: { kpis: TodayKpis }) {
  return (
    <div className="flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar">
      {/* No matching dashboard section for Active Orders — non-interactive */}
      <StaticChip value={kpis.active_orders} label="Active Orders" />

      <InteractiveChip
        value={kpis.out_for_delivery}
        label="Out for Delivery"
        sectionId="out-delivery"
      />
      <InteractiveChip
        value={kpis.delivered_today}
        label="Delivered Today"
        sectionId="delivered-today"
      />
      <InteractiveChip
        value={kpis.ready_to_pack}
        label="Ready to Pack"
        sectionId="ready-packing"
      />
    </div>
  );
}
