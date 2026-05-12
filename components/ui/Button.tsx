import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // Eén micro-interactie-set: hover (subtiele lift waar passend), active
  // (lift terug = "indrukken"), focus-visible (accent-ring met offset, overal
  // gelijk), disabled (50% opacity, geen pointer). Reduced motion → geen
  // transform, geen transitie.
  "inline-flex items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap transition-all active:translate-y-0 focus-visible:ring-2 focus-visible:ring-(--color-accent) focus-visible:ring-offset-1 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 border border-transparent motion-reduce:transition-none motion-reduce:hover:transform-none",
  {
    variants: {
      variant: {
        primary:
          "bg-(--color-text) text-(--color-bg) hover:bg-(--color-accent) hover:-translate-y-0.5 hover:shadow-card",
        accent:
          "bg-(--color-accent) text-white hover:bg-(--color-accent)/90 hover:-translate-y-0.5 hover:shadow-glow",
        outline:
          "border-(--color-border-strong,#D8CDB6) bg-transparent text-(--color-text) hover:bg-(--color-surface) hover:border-(--color-text)",
        ghost: "text-(--color-text) hover:bg-(--color-bg-warm)",
      },
      size: {
        sm: "px-4 py-2 text-[13px]",
        md: "px-5 py-2.5 text-[14px]",
        lg: "px-6 py-3.5 text-[15px]",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /**
   * When true, renders a small spinner before the children and disables
   * the button. Use for client-side pending states (useTransition, form
   * useFormStatus). Ignored when `asChild` is true.
   */
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, loading = false, disabled, children, ...props },
    ref,
  ) => {
    if (asChild) {
      // Slot requires exactly one child element — pass children through
      // unwrapped, no spinner injection.
      return (
        <Slot ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props}>
          {children}
        </Slot>
      );
    }
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? (
          <span
            className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden
          />
        ) : null}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
