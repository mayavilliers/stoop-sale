import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "min-h-[96px] w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[15px] text-ink",
      "placeholder:text-muted/70 transition",
      "focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "h-11 w-full appearance-none rounded-xl border border-line bg-surface px-3.5 text-[15px] text-ink",
      "bg-[length:18px] bg-[right_0.75rem_center] bg-no-repeat",
      "focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10",
      className
    )}
    style={{
      backgroundImage:
        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%237a7064' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
    }}
    {...props}
  />
));
Select.displayName = "Select";

export function Checkbox({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-[15px] text-ink">
      <input
        type="checkbox"
        className="h-5 w-5 rounded-md border-line text-sticker accent-sticker focus:ring-2 focus:ring-ink/10"
        {...props}
      />
      {label}
    </label>
  );
}
