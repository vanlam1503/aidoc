import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva("inline-flex items-center justify-center gap-2 rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 disabled:pointer-events-none disabled:opacity-50", {
  variants: {
    variant: {
      default: "bg-emerald-900 text-white hover:bg-emerald-800",
      outline: "border border-[var(--line)] bg-[var(--paper)] hover:bg-[var(--bg)]",
      ghost: "hover:bg-[var(--bg)]",
    },
    size: { default: "h-9 px-4 py-2", sm: "h-8 rounded-md px-3", icon: "h-9 w-9" },
  },
  defaultVariants: { variant: "default", size: "default" },
});

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ className, variant = "default", size = "default", ...props }, ref) {
  return <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
});
