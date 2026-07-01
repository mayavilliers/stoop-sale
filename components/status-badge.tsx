import { cn } from "@/lib/utils";
import { type DisplayState, DISPLAY_STATE_LABEL } from "@/lib/listing-status";

const styles: Record<DisplayState, string> = {
  // Open now gets the loudest token in the system — the neon poster green.
  open: "bg-live text-live-ink",
  upcoming: "bg-sky text-sky-ink",
  ended: "bg-transparent text-muted border border-line",
  draft: "bg-transparent text-muted border border-dashed border-line",
};

export function StatusBadge({
  state,
  className,
}: {
  state: DisplayState;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        styles[state],
        className
      )}
    >
      {state === "open" && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-live-ink/60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-live-ink" />
        </span>
      )}
      {DISPLAY_STATE_LABEL[state]}
    </span>
  );
}
