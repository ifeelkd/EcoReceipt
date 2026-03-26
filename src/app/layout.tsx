import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "@/components/Web3Provider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "EcoReceipt | ESG Programmable Receipts",
  description: "Secure, eco-friendly digital receipts and warranty management on the blockchain.",
  icons: {
    icon: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(geist.variable, geistMono.variable)}
      suppressHydrationWarning
    >
      <body
        className={cn(
          "font-sans antialiased min-h-screen flex flex-col bg-background text-foreground"
        )}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <Web3Provider>
            {children}
            <Toaster position="top-right" expand={true} richColors />
          </Web3Provider>
        </ThemeProvider>
      </body>
    </html>
  );
}
