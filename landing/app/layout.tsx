import type { Metadata } from "next";
import { Inter, Geist_Mono, League_Spartan } from "next/font/google";
import "./globals.css";
import LenisProvider from "@/components/LenisProvider";

const inter = Inter({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  weight: ["100", "300", "400"],
  variable: "--font-geist-mono",
  display: "swap",
});

const leagueSpartan = League_Spartan({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-league-spartan",
  display: "swap",
});

export const metadata: Metadata = {
  title: "IntelliHire — AI-Powered Recruitment, Reimagined",
  description:
    "IntelliHire delivers precision hiring through artificial intelligence. Streamline your talent acquisition with intelligent screening, deep candidate insights, and seamless recruitment workflows — built for world-class teams.",
  keywords: ["AI recruitment", "hiring platform", "talent acquisition", "IntelliHire", "AI screening"],
  openGraph: {
    title: "IntelliHire — AI-Powered Recruitment, Reimagined",
    description: "Precision hiring through artificial intelligence. Built for world-class teams.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`grain ${inter.variable} ${geistMono.variable} ${leagueSpartan.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <LenisProvider>
          {children}
        </LenisProvider>
      </body>
    </html>
  );
}
