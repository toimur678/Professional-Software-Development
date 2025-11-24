import './globals.css'
import { Inter } from 'next/font/google'
import Navigation from '@/components/Navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'EcoWisely - Carbon Footprint Tracker',
  description: 'Track and reduce your carbon footprint with smart recommendations',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  themeColor: '#22c55e',
  manifest: '/manifest.json',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${inter.className} safe-area-top safe-area-bottom`}>
        <div className="min-h-screen pb-nav">
          {children}
        </div>
        <Navigation />
      </body>
    </html>
  )
}
