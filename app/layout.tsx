import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "FLUXA CRM — Duurzame mobiliteit, slim beheerd",
  description:
    "Het CRM voor FLUXA Solutions. Beheer leases, laadpalen en klantprojecten met overzicht en snelheid.",
  icons: {
    icon: "/favicon.jpg",
    apple: "/apple-touch-icon.jpg",
  },
  openGraph: {
    title: "FLUXA CRM",
    description: "Duurzame mobiliteit, slim beheerd",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "FLUXA CRM",
      },
    ],
    type: "website",
    siteName: "FLUXA CRM",
  },
  twitter: {
    card: "summary_large_image",
    title: "FLUXA CRM",
    description: "Duurzame mobiliteit, slim beheerd",
    images: ["/og-image.png"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="nl" className={`${inter.variable} dark h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        {children}
      </body>
    </html>
  )
}
