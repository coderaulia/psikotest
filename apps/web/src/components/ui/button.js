import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/cn';
const buttonVariants = cva('inline-flex items-center justify-center rounded-full text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50', {
    variants: {
        variant: {
            default: 'bg-primary text-primary-foreground shadow-sm hover:translate-y-[-1px] hover:shadow-md',
            secondary: 'bg-white/70 text-foreground ring-1 ring-border backdrop-blur hover:bg-white',
            ghost: 'text-foreground hover:bg-white/60',
            outline: 'border border-border bg-transparent hover:bg-white/70',
        },
        size: {
            default: 'h-11 px-5',
            sm: 'h-9 px-4 text-xs',
            lg: 'h-12 px-6 text-base',
        },
    },
    defaultVariants: {
        variant: 'default',
        size: 'default',
    },
});
export const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (_jsx(Comp, { ref: ref, className: cn(buttonVariants({ variant, size }), className), ...props }));
});
Button.displayName = 'Button';
