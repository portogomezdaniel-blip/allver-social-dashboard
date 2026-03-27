"use client";

import { useState, useEffect } from "react";

interface ToastProps {
  message: string | null;
  onDone: () => void;
}

export function Toast({ message, onDone }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onDone, 300);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [message, onDone]);

  if (!message) return null;

  return (
    <div
      className="fixed bottom-5 left-1/2 z-[200] transition-all duration-300"
      style={{
        transform: `translateX(-50%) translateY(${visible ? "0" : "60px"})`,
        opacity: visible ? 1 : 0,
      }}
    >
      <div
        className="px-5 py-2.5 rounded-[8px] text-[10px]"
        style={{
          fontFamily: "var(--font-mono)",
          background: "rgba(30,32,28,0.95)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.12)",
          color: "var(--olive)",
        }}
      >
        {message}
      </div>
    </div>
  );
}
