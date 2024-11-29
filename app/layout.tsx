import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { ResponsiveWrapper } from "@/components/layout/responsive-wrapper";
import { cn } from "@/lib/utils";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "OmniDoc - Smart PDF Editor",
  description: "AI-powered PDF editor for smart document interaction",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full">
      <body className={cn(
        geistSans.variable,
        geistMono.variable,
        "antialiased bg-background text-foreground h-full"
      )}>
        <ResponsiveWrapper>
          <div className="relative flex min-h-screen flex-col h-full">
            <Header />
            <main className="flex-1 h-[calc(100vh-4rem)]">{children}</main>
          </div>
        </ResponsiveWrapper>
      </body>
    </html>
  );
}
