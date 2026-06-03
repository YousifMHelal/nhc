import type { Metadata } from 'next'
import { Cairo, Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import { ConditionalShell } from '@/components/layout/conditional-shell'
import './globals.css'

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '600', '700', '900'],
  variable: '--font-cairo',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'NHC Innovation — نظام إدارة العملاء',
  description: 'نظام إدارة علاقات العملاء للشركة الوطنية لخدمات الإسكان',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      dir="rtl"
      lang="ar"
      className={`${cairo.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <ConditionalShell>{children}</ConditionalShell>
        <Toaster
          position="bottom-left"
          richColors
          duration={3000}
          toastOptions={{
            style: { fontFamily: 'var(--font-cairo), Cairo, sans-serif' },
          }}
        />
      </body>
    </html>
  )
}
