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
    className={cn("group border-b border-(--color-border) transition-all", className)}
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
        "group flex flex-1 cursor-pointer items-center justify-between gap-6 py-6 text-left font-serif text-[21px] text-(--color-text) transition-colors hover:text-(--color-accent)",
        className,
      )}
      {...props}
    >
      {children}
      <span
        className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-(--color-border-strong,#D8CDB6) text-(--color-muted) transition-all duration-300 group-data-[state=open]:rotate-45 group-data-[state=open]:border-(--color-accent) group-data-[state=open]:bg-(--color-accent) group-data-[state=open]:text-white"
        aria-hidden
      >
        <Plus className="h-4 w-4" strokeWidth={2} />
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
    className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden text-[15.5px] leading-[1.65] text-(--color-muted)"
    {...props}
  >
    <div className={cn("max-w-[60ch] pb-7", className)}>{children}</div>
  </AccordionPrimitive.Content>
));
AccordionContent.displayName = "AccordionContent";
