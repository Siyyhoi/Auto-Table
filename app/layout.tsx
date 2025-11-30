import type { Metadata } from "next";
import Sidebar from "../compunets/slidebar";
import { Prompt, Kanit } from "next/font/google";
import "./globals.css";

const promptFont = Prompt({
  subsets: ['latin', 'thai'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-prompt',
  display: 'swap',
});

const kanitFont = Kanit({
  subsets: ['latin', 'thai'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-kanit',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "ระบบจัดตารางเรียนออนไลน์",
  description: "จัดการตารางเรียนของคุณอย่างมีประสิทธิภาพ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className={`${promptFont.variable} ${kanitFont.variable} font-prompt antialiased`}>
        <Sidebar />
        {children}
      </body>
    </html>
  );
}