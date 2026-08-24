import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/lib/providers";

// Inter is the Vite admin's typeface — keep both apps visually equal.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "AR-E Admin",
    template: "%s · AR-E Admin",
  },
  description: "Shein Shop Management Admin Panel",
  applicationName: "AR-E Admin",
  manifest: "/manifest.webmanifest",
  // Icons are auto-wired by the app/ file conventions
  // (favicon.ico, icon.svg, icon.png, apple-icon.png).
  appleWebApp: {
    capable: true,
    title: "AR-E Admin",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#e8772e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
