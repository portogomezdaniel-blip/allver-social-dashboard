"use client";

import React, { useState } from "react";
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
    variant?: "default" | "danger" | "ghost";
    disabled?: boolean;
  } & React.HTMLAttributes<HTMLElement>
>) {
  const [hovered, setHovered] = useState(false);
  const isHovered = hovered && !disabled;

  const borderColor =
    variant === "danger"
      ? isHovered
        ? "border-[#8B2020]"
        : "border-[#1E2916]"
      : isHovered
        ? "border-[#4A7C2F]"
        : "border-[#1E2916]";

  const textColor =
    variant === "danger"
      ? isHovered
        ? "text-[#CC4444]"
        : "text-[#6B6B6B]"
      : variant === "ghost"
        ? isHovered
          ? "text-[#C8C8C8]"
          : "text-[#6B6B6B]"
        : isHovered
          ? "text-[#6AAF3D]"
          : "text-[#C8C8C8]";

  const glowColor =
    variant === "danger"
      ? "rgba(139, 32, 32, 0.12)"
      : "rgba(74, 124, 47, 0.12)";

  return (
    <Element
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={disabled}
      className={cn(
        "relative flex h-min w-fit flex-col flex-nowrap content-center items-center justify-center overflow-visible rounded-full border bg-[#0D1008] p-px transition-all duration-300",
        borderColor,
        disabled && "opacity-40 cursor-not-allowed",
        containerClassName
      )}
      {...props}
    >
      <div
        className={cn(
          "z-10 w-auto rounded-full bg-[#131A0E] px-6 py-2.5 text-xs tracking-[0.15em] uppercase transition-colors duration-300",
          textColor,
          className
        )}
      >
        {children}
      </div>
      <div
        className={cn(
          "absolute inset-0 z-0 rounded-full opacity-0 transition-opacity duration-300",
          isHovered && "opacity-100"
        )}
        style={{
          background: `radial-gradient(75% 181% at 50% 50%, ${glowColor} 0%, transparent 100%)`,
        }}
      />
      <div className="absolute inset-[1px] z-[1] rounded-full bg-[#131A0E]" />
    </Element>
  );
}

export { GlowButton };
