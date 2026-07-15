import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import localFont from 'next/font/local'
import './globals.css'
import SiteHeader from './components/SiteHeader'
import SiteFooter from './components/SiteFooter'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const gintoNord = localFont({
  src: './fonts/ABCGintoNord-Regular.woff2',
  variable: '--font-abc-ginto-nord',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Order API Documentation | Supertext',
  description:
    'Complete API reference for the Supertext Order API (professional/human translation).',
  openGraph: {
    title: 'Supertext Order API Reference',
    description: 'Complete API reference for the Supertext Order API',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${gintoNord.variable}`}>
      <body className="bg-backgrounds-backgroundLight min-h-screen flex flex-col">
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </body>
    </html>
  )
}
