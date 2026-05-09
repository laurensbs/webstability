"use client";

import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { Plus } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

export const Accordion = AccordionPrimitive.Root;

export const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn(
      "group border-b border-(--color-border) transition-colors duration-300 data-[state=open]:border-(--color-accent)/30",
      className,
    )}
    {...props}
  />
));
AccordionItem.displayName = "AccordionItem";

export const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        // group + relative voor de Plus-icon-staat. Trigger zelf shift
        // 4px naar rechts op hover voor tactiele feedback.
        "group/trigger relative flex flex-1 cursor-pointer items-center justify-between gap-6 py-6 text-left font-serif text-[21px] text-(--color-text) transition-all duration-300 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] hover:text-(--color-accent) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent) data-[state=open]:text-(--color-accent)",
        className,
      )}
      {...props}
    >
      {/* De vraag-tekst — bij hover schuift 'ie 4px naar rechts. */}
      <span className="block transition-transform duration-300 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] group-hover/trigger:translate-x-1 group-data-[state=open]/trigger:translate-x-0">
        {children}
      </span>

      {/* Plus → X via 45° rotate. Cream-soft border default, terracotta
          fill in open-state met lichte glow. */}
      <span
        aria-hidden
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-(--color-border-strong,#D8CDB6) text-(--color-muted) transition-all duration-400 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] group-hover/trigger:border-(--color-accent)/50 group-hover/trigger:text-(--color-accent) group-data-[state=open]/trigger:rotate-[225deg] group-data-[state=open]/trigger:border-(--color-accent) group-data-[state=open]/trigger:bg-(--color-accent) group-data-[state=open]/trigger:text-white group-data-[state=open]/trigger:shadow-[0_4px_16px_-2px_rgba(201,97,79,0.45)]"
      >
        <Plus className="h-4 w-4" strokeWidth={2.2} />
      </span>
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
));
AccordionTrigger.displayName = "AccordionTrigger";

export const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    // Outer: height-tween via Radix' eigen accordion-down/up keyframe.
    // Inner: opacity + Y-translate via custom wb-accordion-content keyframe
    // zodat de tekst niet enkel uitvouwt maar ook zacht binnenrolt.
    className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden"
    {...props}
  >
    <div
      className={cn(
        "max-w-[60ch] pb-7 text-[15.5px] leading-[1.65] text-(--color-muted)",
        "data-[state=open]:wb-accordion-fade-in",
        "group-data-[state=closed]:opacity-0 group-data-[state=open]:opacity-100",
        "group-data-[state=closed]:translate-y-1 group-data-[state=open]:translate-y-0",
        "transition-all duration-400 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]",
        className,
      )}
    >
      {children}
    </div>
  </AccordionPrimitive.Content>
));
AccordionContent.displayName = "AccordionContent";
