import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
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
  title: "ViceKanBan",
  description: "Modern, fast, and simple Kanban tool for developer teams.",
  icons: {
    icon: "/icons/icon_vice.png",
    shortcut: "/icons/icon_vice.png",
    apple: "/icons/icon_vice.png",
  },
};

import SessionGuard from "./components/SessionGuard";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Toaster position="top-right" />
        <SessionGuard>
          {children}
        </SessionGuard>
      </body>
    </html>
  );
}
