import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: `${SITE_NAME} Calendar`,
  description: SITE_DESCRIPTION,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full justify-center px-3 py-8 font-sans sm:px-5 sm:py-10 lg:px-8">
        {children}
      </body>
    </html>
  );
}
