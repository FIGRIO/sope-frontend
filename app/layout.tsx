import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ChatbotWidget from "@/components/ChatbotWidget";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SOPE - Mua sắm thông minh",
  description: "Trải nghiệm mua sắm mượt mà cùng trợ lý AI và hệ thống gợi ý 24/7.",
  manifest: "/manifest.json",
  themeColor: "#EE4D2D",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SOPE",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
};

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
      {/* Đã thêm suppressHydrationWarning vào thẻ body để fix lỗi Hydration */}
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        {children}
        <ChatbotWidget />
      </body>
    </html>
  );
}