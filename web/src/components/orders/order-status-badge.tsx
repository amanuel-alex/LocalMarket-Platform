import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-900 border-amber-200",
  paid: "bg-sky-100 text-sky-900 border-sky-200",
  completed: "bg-emerald-100 text-emerald-900 border-emerald-200",
  cancelled: "bg-zinc-100 text-zinc-700 border-zinc-200",
  disputed: "bg-red-100 text-red-900 border-red-200",
};

export function OrderStatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase();
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
        styles[key] ?? "bg-muted text-muted-foreground border-border",
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
