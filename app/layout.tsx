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
import { ThemeProvider } from "./context/ThemeContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = "light"; // Default to light for SSR

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${theme} h-full antialiased`}
      style={{ colorScheme: theme }}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var raw = localStorage.getItem('_vk_pref_node');
                  var theme = raw === '1' ? 'dark' : (raw === '0' ? 'light' : null);
                  if (theme) {
                    document.documentElement.classList.remove('light', 'dark');
                    document.documentElement.classList.add(theme);
                    document.documentElement.setAttribute('data-theme', theme);
                    document.documentElement.style.colorScheme = theme;
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-300">
        <Toaster position="top-right" />
        <ThemeProvider initialTheme={theme}>
          <SessionGuard>
            {children}
          </SessionGuard>
        </ThemeProvider>
      </body>
    </html>
  );
}
