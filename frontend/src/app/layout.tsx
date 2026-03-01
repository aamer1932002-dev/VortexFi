import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://vortexfi.io'),
  title: 'VortexFi | Spin Up Yield Across Any Chain',
  description: 'One-click cross-chain yield powered by Polygon AggLayer. Deposit from any chain, earn everywhere.',
  keywords: ['DeFi', 'Polygon', 'AggLayer', 'Cross-chain', 'Yield', 'Staking'],
  authors: [{ name: 'VortexFi Team' }],
  openGraph: {
    title: 'VortexFi | Spin Up Yield Across Any Chain',
    description: 'One-click cross-chain yield powered by Polygon AggLayer',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
