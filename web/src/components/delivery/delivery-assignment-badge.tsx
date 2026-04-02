import { cn } from "@/lib/utils";
import type { DeliveryAssignment } from "@/lib/api";

export function deliveryAssignmentLabel(a: DeliveryAssignment) {
  if (a.status === "completed") return { key: "completed", label: "Completed" };
  if (a.deliveryStartedAt) return { key: "in_progress", label: "In progress" };
  if (a.status === "paid") return { key: "pending", label: "Pending" };
  return { key: "awaiting", label: "Awaiting payment" };
}

export function DeliveryAssignmentBadge({ assignment }: { assignment: DeliveryAssignment }) {
  const { key, label } = deliveryAssignmentLabel(assignment);
  const tones: Record<string, string> = {
    completed: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100",
    in_progress: "border-sky-200 bg-sky-50 text-sky-900 dark:bg-sky-950/40 dark:text-sky-100",
    pending: "border-amber-200 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100",
    awaiting: "border-violet-200 bg-violet-50 text-violet-900 dark:bg-violet-950/40 dark:text-violet-100",
  };
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
        tones[key] ?? tones.awaiting,
      )}
    >
      {label}
    </span>
  );
}
