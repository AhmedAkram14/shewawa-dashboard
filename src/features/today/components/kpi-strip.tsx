import type { TodayKpis } from "../api/today";

function KpiChip({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex shrink-0 flex-col items-center gap-0.5 rounded-lg border bg-card px-4 py-2.5 min-w-[80px]">
      <span className="text-xl font-semibold tabular-nums">{value}</span>
      <span className="text-[10px] text-muted-foreground leading-tight text-center">
        {label}
      </span>
    </div>
  );
}

export function KpiStrip({ kpis }: { kpis: TodayKpis }) {
  return (
    <div className="flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar">
      <KpiChip value={kpis.active_orders} label="Active Orders" />
      <KpiChip value={kpis.out_for_delivery} label="Out for Delivery" />
      <KpiChip value={kpis.delivered_today} label="Delivered Today" />
      <KpiChip value={kpis.ready_to_pack} label="Ready to Pack" />
    </div>
  );
}
