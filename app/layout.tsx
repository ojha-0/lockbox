import type { Metadata, Viewport } from 'next'
import { Nunito, Open_Sans } from 'next/font/google'
import Script from 'next/script'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/sonner'
import PerformanceShim from '@/components/performance-shim'
import './globals.css'

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
})

const openSans = Open_Sans({
  subsets: ['latin'],
  variable: '--font-open-sans',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Lockbox - Digital Identity Verification',
  description: 'Secure digital identity verification platform for Nepal with government-grade security',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#4F46E5',
  width: 'device-width',
  initialScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const shouldRenderAnalytics = process.env.NODE_ENV === 'production' && !!process.env.VERCEL
  const earlyPerfPolyfill = `(function(){
    var perf = typeof window !== 'undefined' ? window.performance : null;
    if (!perf) return;
    if (typeof perf.clearMarks !== 'function') perf.clearMarks = function () {};
    if (typeof perf.clearMeasures !== 'function') perf.clearMeasures = function () {};
    if (typeof perf.mark !== 'function') perf.mark = function () {};
    if (typeof perf.measure !== 'function') perf.measure = function () {};
  })();`

  return (
    <html
      lang="en"
      className={`${nunito.variable} ${openSans.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: earlyPerfPolyfill }} />
      </head>
      <body className="font-sans antialiased bg-background text-foreground">
        <Script
          id="perf-polyfill-before-hydration"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: earlyPerfPolyfill,
          }}
        />
        <PerformanceShim />
        {children}
        <Toaster richColors position="top-right" />
        {shouldRenderAnalytics ? <Analytics /> : null}
      </body>
    </html>
  )
}

