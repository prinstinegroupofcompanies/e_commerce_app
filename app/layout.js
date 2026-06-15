import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { SITE_NAME } from "@/lib/brand";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata = {
  title: {
    default: `${SITE_NAME} — Multivendor marketplace`,
    template: `%s · ${SITE_NAME}`,
  },
  description: `${SITE_NAME} is a multivendor e-commerce marketplace — shop from trusted sellers with secure checkout.`,
  manifest: "/manifest.json",
  icons: {
    icon: "/markay_hall.jpeg",
    apple: "/markay_hall.jpeg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} min-h-screen font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
