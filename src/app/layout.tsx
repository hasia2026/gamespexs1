import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AssistantWidget from "@/components/AssistantWidget";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GAMESPEXS — Command Center",
  description: "Game research & operations platform: game library, research engine, field operations, sponsors, and institutional programs.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        {children}
        <AssistantWidget />
      </body>
    </html>
  );
}
