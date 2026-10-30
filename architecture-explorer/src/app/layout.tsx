import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@xyflow/react/dist/style.css";
import "./globals.css";

const geist = Geist({ subsets: ["latin", "cyrillic"], variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin", "cyrillic"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: "ArchLens — обозреватель архитектур",
  description: "Интерактивная карта архитектур приложений для разработчиков",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body className={`${geist.variable} ${geistMono.variable}`}>{children}</body>
    </html>
  );
}
