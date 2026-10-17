import type { Metadata } from "next";
import "./globals.css";
import { ClientShell } from "../components/ClientShell";

export const metadata: Metadata = {
  title: "Lapiez Garhwa | Genuine Laptops, Computers & CCTV Deals",
  description: "Official Lapiez technology showroom in Garhwa, Jharkhand. Deals in 100% genuine laptops (HP, Dell, Lenovo, ASUS), custom PC rigs, CP-PLUS & Hikvision CCTV systems, printers, SSDs & original spare parts with 18% GST invoice & same-day delivery.",
  keywords: [
    "Lapiez Garhwa",
    "Lapiez Chiniya Road",
    "laptop shop in garhwa",
    "second hand laptop garhwa",
    "cctv camera garhwa",
    "computer repair garhwa",
    "cp plus cctv garhwa",
    "custom gaming pc garhwa",
    "lapiez computer solutions",
    "Jharkhand laptop store"
  ],
  authors: [{ name: "Lapiez Garhwa" }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Lapiez',
  },
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/favicon.ico', sizes: '32x32' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: "Lapiez Garhwa | Best Deals on Laptops, Desktops & CCTV",
    description: "100% Original Products, 18% GST Invoicing, Direct Brand Warranty & Showroom Counter in Garhwa.",
    url: "https://www.lapiez.com",
    siteName: "Lapiez",
    locale: "en_IN",
    type: "website",
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <script src="https://accounts.google.com/gsi/client" async defer></script>
      </head>
      <body className="min-h-full flex flex-col bg-[#F1F3F6] text-[#111827]">
        <ClientShell>
          {children}
        </ClientShell>
      </body>
    </html>
  );
}
