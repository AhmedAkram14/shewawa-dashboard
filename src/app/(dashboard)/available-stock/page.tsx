import { AvailableStockTable } from "@/features/available-stock/components/available-stock-table";
import { AddStockSheet } from "@/features/available-stock/components/add-stock-sheet";

export const metadata = { title: "Available Stock" };

export default function AvailableStockPage() {
  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Available Stock</h1>
        <AddStockSheet />
      </div>
      <AvailableStockTable />
    </div>
  );
}
