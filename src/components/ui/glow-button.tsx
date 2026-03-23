"use client";

import React from "react";
import { cn } from "@/lib/utils";

function GlowButton({
  children,
  containerClassName,
  className,
  as: Element = "button",
  variant = "default",
  disabled = false,
  ...props
}: React.PropsWithChildren<
  {
    as?: React.ElementType;
    containerClassName?: string;
    className?: string;
    variant?: "default" | "primary" | "danger" | "ghost";
    disabled?: boolean;
  } & React.HTMLAttributes<HTMLElement>
>) {
  const variants = {
    default:
      "bg-[var(--bg-card)] text-[var(--text-primary)] border-[var(--border)] hover:border-[var(--border-focus)] hover:bg-[var(--bg-hover)]",
    primary:
      "bg-[var(--text-primary)] text-[var(--bg)] border-[var(--text-primary)] hover:opacity-90",
    danger:
      "bg-[var(--red-bg)] text-[var(--red)] border-[var(--border)] hover:border-[var(--red)]",
    ghost:
      "bg-transparent text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]",
  };

  return (
    <Element
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center rounded-[6px] border px-3.5 py-[7px] text-xs font-medium transition-all duration-150",
        variants[variant],
        disabled && "opacity-40 cursor-not-allowed",
        containerClassName,
        className
      )}
      {...props}
    >
      {children}
    </Element>
  );
}

export { GlowButton };
