import type { Metadata } from "next";
import "./globals.css";
import { DM_Sans, IBM_Plex_Mono, Bungee } from "next/font/google";
import { cn } from "@/lib/utils";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-mono",
});

const bungee = Bungee({
  subsets: ["latin"],
  weight: "400",
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
    <html lang="en" className={cn("dark", dmSans.variable, ibmPlexMono.variable, bungee.variable)}>
      <body>{children}</body>
    </html>
  );
}
