import { cn } from "@/lib/utils";
import type { OrderRow } from "@/lib/api";

export type DeliveryRunStatus = "pending" | "in_progress" | "completed" | "other";

export function getDeliveryRunStatus(o: OrderRow): DeliveryRunStatus {
  const s = o.status.toLowerCase();
  if (s === "completed") return "completed";
  if (s === "paid") {
    if (o.deliveryStartedAt) return "in_progress";
    return "pending";
  }
  return "other";
}

const styles: Record<DeliveryRunStatus, string> = {
  pending: "bg-amber-100 text-amber-950 border-amber-200",
  in_progress: "bg-sky-100 text-sky-950 border-sky-200",
  completed: "bg-emerald-100 text-emerald-950 border-emerald-200",
  other: "bg-muted text-muted-foreground border-border",
};

const labels: Record<DeliveryRunStatus, string> = {
  pending: "Pending",
  in_progress: "In progress",
  completed: "Completed",
  other: "Other",
};

export function DeliveryAssignmentBadge({ order }: { order: OrderRow }) {
  const key = getDeliveryRunStatus(order);
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
        styles[key],
      )}
    >
      {labels[key]}
    </span>
  );
}
