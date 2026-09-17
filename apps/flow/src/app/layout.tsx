import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

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
import { MobileViewportGuard } from '@/components/MobileViewportGuard';
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700"],
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`h-full antialiased ${inter.variable}`} style={{ colorScheme: 'light' }}>
      <body className="min-h-full flex flex-col font-sans hub-layout" style={{ colorScheme: 'light' }}>
        <MobileViewportGuard />
        <NotificationProvider>
          {children}
          <ToastContainer />
        </NotificationProvider>
      </body>
    </html>
  );
}
