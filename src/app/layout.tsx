import type { Metadata } from 'next'
import { Cairo } from 'next/font/google'
import { ConditionalShell } from '@/components/layout/conditional-shell'
import './globals.css'

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-sans',
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
      className={`${cairo.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <ConditionalShell>{children}</ConditionalShell>
      </body>
    </html>
  )
}
