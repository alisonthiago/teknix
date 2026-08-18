import type { Metadata } from "next";
import { Nunito_Sans } from "next/font/google";
import "./globals.css";

const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "TEKNIX — Gestão inteligente de vendas e marketplaces",
  description: "TEKNIX — Gestão inteligente de vendas e marketplaces",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className={`${nunitoSans.className} min-h-full flex flex-col`}>{children}</body>
    </html>
  );
}
