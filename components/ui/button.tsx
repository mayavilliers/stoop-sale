import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "sticker" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  sticker:
    "bg-sticker text-sticker-ink hover:brightness-95 active:brightness-90 shadow-card",
  secondary:
    "bg-surface text-ink border border-line hover:bg-paper",
  ghost: "bg-transparent text-ink hover:bg-black/5",
  danger: "bg-transparent text-sticker border border-sticker/40 hover:bg-sticker/5",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-[15px]",
  lg: "h-12 px-5 text-base",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "sticker", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-medium transition",
        "disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";
