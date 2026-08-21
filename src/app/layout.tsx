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
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  },
};

import { NotificationProvider } from '@/contexts/NotificationContext';
import { ToastContainer } from '@/components/ui/ToastContainer';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className={`${nunitoSans.className} min-h-full flex flex-col`}>
        <NotificationProvider>
          {children}
          <ToastContainer />
        </NotificationProvider>
      </body>
    </html>
  );
}
