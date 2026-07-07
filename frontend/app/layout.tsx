import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';
import ToastContainer from '@/components/ui/Toast';
import FontProvider from '@/components/ui/FontProvider';

export const metadata: Metadata = {
  title: 'Food Village POS',
  description: 'Order from your favourite booths at Food Village',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#F4F7F5',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-full bg-brand-bg text-brand-white font-body antialiased">
        <FontProvider />
        {children}
        <ToastContainer />
        <Script id="sw-register" strategy="afterInteractive">
          {`if ('serviceWorker' in navigator) { navigator.serviceWorker.register('/sw.js').catch(() => {}); }`}
        </Script>
      </body>
    </html>
  );
}
