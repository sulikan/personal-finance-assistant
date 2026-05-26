import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Provider from "@/components/Provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#2563eb",
};

export const metadata: Metadata = {
  title: "Personal Finance Assistant",
  description: "Aplikasi pencatat keuangan pribadi",
  manifest: "/manifest.json",
  icons: [{ rel: "icon", url: "/favicon.svg", type: "image/svg+xml" }],
  appleWebApp: { capable: true, statusBarStyle: "default", title: "FinanceApp" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen">
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
