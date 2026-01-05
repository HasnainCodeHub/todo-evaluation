import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from '../components/auth/AuthProvider'

export const metadata: Metadata = {
  title: {
    default: 'Evolution of Todo - AI-Native Task Management',
    template: '%s | Evolution of Todo',
  },
  description: 'A modern, AI-native task management platform built with Spec-Driven Development. Cloud-first architecture, secure authentication, and beautiful design.',
  keywords: ['todo', 'task management', 'productivity', 'ai-native', 'spec-driven', 'cloud-first', 'next.js', 'fastapi'],
  authors: [{ name: 'Evolution of Todo Team' }],
  creator: 'Evolution of Todo',
  publisher: 'Evolution of Todo',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Evolution of Todo',
    title: 'Evolution of Todo - AI-Native Task Management',
    description: 'A modern, AI-native task management platform built with Spec-Driven Development.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Evolution of Todo - AI-Native Task Management',
    description: 'A modern, AI-native task management platform built with Spec-Driven Development.',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafafa' },
    { media: '(prefers-color-scheme: dark)', color: '#18181b' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
