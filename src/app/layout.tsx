import type { Metadata } from 'next'
import { DM_Sans, Playfair_Display } from 'next/font/google'
import MotionProvider from '@/components/MotionProvider'
import AppShell from '@/components/AppShell'
import LeftSidebarWrapper from '@/components/LeftSidebarWrapper'
import './globals.css'

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
})

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Wandr — Find Your Travel Buddy',
  description: 'Connect with compatible travel buddies, post trips, and explore the world together.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${playfair.variable} h-full`}>
      <body className="antialiased">
        <MotionProvider>
          <AppShell sidebar={<LeftSidebarWrapper />}>
            {children}
          </AppShell>
        </MotionProvider>
      </body>
    </html>
  )
}
