import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ChatbotWidget from "@/components/ChatbotWidget";
import PwaRegistration from "@/components/PwaRegistration";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";

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
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SOPE",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#EE4D2D",
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
        <PwaRegistration />
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
