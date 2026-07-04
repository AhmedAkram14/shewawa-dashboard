"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { friendlyError } from "@/lib/db-error";
import { orderKeys } from "@/features/orders/hooks/use-orders";
import { todayKeys } from "@/features/today/hooks/use-today-summary";

import { callCompleteDelivery, type OrderOutcome } from "../api/deliveries";
import { deliveryKeys } from "./use-deliveries";

export function useCompleteDelivery(deliveryId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (outcomes: OrderOutcome[]) =>
      callCompleteDelivery(createClient(), deliveryId, outcomes),
    onMutate: () => ({ toastId: toast.loading("Completing delivery…") }),
    onSuccess: (_, outcomes, ctx) => {
      queryClient.invalidateQueries({ queryKey: deliveryKeys.all });
      queryClient.invalidateQueries({
        queryKey: deliveryKeys.detail(deliveryId),
      });
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: todayKeys.summary });

      const delivered = outcomes.filter(
        (o) => o.outcome === "delivered",
      ).length;
      const requeued = outcomes.filter((o) =>
        ["customer_not_home", "wrong_address", "other"].includes(o.outcome),
      ).length;
      const refused = outcomes.filter((o) =>
        ["customer_refused", "customer_cancelled"].includes(o.outcome),
      ).length;

      const parts: string[] = [];
      if (delivered > 0) parts.push(`${delivered} delivered`);
      if (requeued > 0) parts.push(`${requeued} re-queued`);
      if (refused > 0) parts.push(`${refused} refused`);

      toast.success(
        parts.length > 0
          ? `Delivery completed — ${parts.join(", ")}`
          : "Delivery completed",
        { id: ctx?.toastId },
      );
    },
    onError: (err, _, ctx) =>
      toast.error(friendlyError(err), { id: ctx?.toastId }),
  });
}
