import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-[#F5F1E8] text-[#121212] [&_svg]:text-[#121212] border border-[#121212]/15 hover:bg-[#F5F1E8]/90 shadow-sm hover:shadow-md",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-border bg-background text-foreground hover:bg-[#F5F1E8] hover:text-[#121212] hover:[&_svg]:text-[#121212]",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "text-foreground hover:bg-secondary hover:text-foreground",
        link: "text-foreground underline-offset-4 hover:underline",
        gold: "bg-[#F5F1E8] text-[#121212] [&_svg]:text-[#121212] border border-[#121212]/15 shadow-md hover:shadow-lg hover:bg-[#F5F1E8]/90",
        warm: "bg-[#F5F1E8] text-[#121212] [&_svg]:text-[#121212] border border-[#121212]/15 hover:bg-[#F5F1E8]/90 shadow-sm",
        cozy: "bg-card border border-input text-foreground hover:bg-[#F5F1E8] hover:text-[#121212] hover:[&_svg]:text-[#121212] shadow-sm",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-12 rounded-xl px-8 text-base",
        xl: "h-14 rounded-xl px-10 text-lg",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
