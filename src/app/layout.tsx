import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { Barlow_Condensed } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });
const barlow = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-heading",
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
    <html lang="en" className={cn("dark", geist.variable, barlow.variable)}>
      <body>{children}</body>
    </html>
  );
}
