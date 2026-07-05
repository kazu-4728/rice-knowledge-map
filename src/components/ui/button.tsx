import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * 田んぼOS共通のボタン優先度3層+アラート系。
 * - primary   : 最優先アクション（緑塗り）。1画面に1〜2個までを目安にする
 * - secondary : 第二アクション（緑の縁取り）
 * - tertiary  : 第三・補助アクション（グレーの縁取り）
 * - alert     : 要対応・警告アクション（琥珀塗り。緑と混同しない差し色）
 * 角丸はAGENTS.mdの「余白・角丸のあるスマホアプリUI」方針を維持する。
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-bold transition-colors active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-green-700 text-white shadow-sm hover:bg-green-800",
        secondary:
          "border-2 border-green-700 bg-white text-green-700 hover:bg-green-50",
        tertiary:
          "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
        alert: "bg-amber-500 text-white shadow-sm hover:bg-amber-600",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-green-700 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-4 py-2",
        sm: "h-9 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-2xl px-8",
        icon: "h-11 w-11 rounded-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
