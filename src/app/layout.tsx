import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { SpeedInsights } from "@vercel/speed-insights/next"

export const metadata: Metadata = {
  title: 'Mahmoud.AI',
  description: 'A personal homepage for Mahmoud El Ozairy',
  icons: {
    icon: [
      {
        url: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWZpbGUtdGV4dCI+PHBhdGggZD0iTTE1IDJINlYyMmgxMnoiLz48cGF0aCBkPSJNMTEgMVY4aDZ6IiBmaWxsPSJnb2xkIi8+PHBhdGggZD0iTTcgN2g0Ii8+PHBhdGggZD0iTTcgMTFoOCIvPjxwYXRoIGQ9Ik03IDE1aDQiLz48cGF0aCBkPSJNMTEgMVY4aDYiIHN0cm9rZT0iYmxhY2siLz48L3N2Zz4=',
        type: 'image/svg+xml',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&family=Inter:wght@400;700;900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        {children}
        <Toaster />
        <SpeedInsights />
      </body>
    </html>
  );
}
