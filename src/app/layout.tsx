import type { Metadata } from "next";
import "./globals.css";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import { cn } from "@/lib/utils";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-sans",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["300", "400"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "FTP by LLVR",
  description: "Creator command system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("dark", dmSans.variable, jetbrains.variable)}>
      <body>{children}</body>
    </html>
  );
}
