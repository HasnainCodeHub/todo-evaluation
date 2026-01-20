import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'EvoTask Pro - International Task Management Platform',
    template: '%s | EvoTask Pro',
  },
  description:
    'A modern, AI-native task management platform built with Spec-Driven Development. Professional productivity tools for global teams.',
  keywords: 'task management, productivity, ai-powered, spec-driven development, international, professional tools, workflow optimization, collaboration, project management',
  authors: [{ name: 'Evolution of Todo Team' }],
  creator: 'Evolution of Todo Team',
  publisher: 'Evolution of Todo',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://evotask-pro.com',
    title: 'EvoTask Pro - International Task Management Platform',
    description: 'A modern, AI-native task management platform built with Spec-Driven Development. Professional productivity tools for global teams.',
    siteName: 'EvoTask Pro',
    images: [
      {
        url: 'https://evotask-pro.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'EvoTask Pro - International Task Management Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EvoTask Pro - International Task Management Platform',
    description: 'A modern, AI-native task management platform built with Spec-Driven Development. Professional productivity tools for global teams.',
    images: ['https://evotask-pro.com/twitter-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#8b5cf6',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" dir="ltr" className="scroll-smooth">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#8b5cf6" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="application-name" content="EvoTask Pro" />
        <meta name="msapplication-TileColor" content="#8b5cf6" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="color-scheme" content="light only" />
        <meta name="supported-color-schemes" content="light only" />
      </head>
      <body
        className="font-sans antialiased bg-surface-50 text-surface-900"
        suppressHydrationWarning
      >
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  )
}
