import type { Metadata } from "next";
import "./globals.css";
import { DM_Sans, Space_Mono, Syne } from "next/font/google";
import { cn } from "@/lib/utils";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
});

const syne = Syne({
  subsets: ["latin"],
  weight: ["800"],
  variable: "--font-display",
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
    <html lang="en" className={cn("dark", dmSans.variable, spaceMono.variable, syne.variable)}>
      <body>{children}</body>
    </html>
  );
}
