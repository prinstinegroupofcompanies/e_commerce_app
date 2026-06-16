import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { createRootMetadata } from "@/lib/site-metadata";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata = createRootMetadata();

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} min-h-screen font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
