import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "@/components/Web3Provider";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EcoReceipt | ESG Programmable Receipts",
  description: "Secure, eco-friendly digital receipts and warranty management on the blockchain.",
};

import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)} suppressHydrationWarning={true}>
      <body className={inter.className} suppressHydrationWarning={true}>
        <Web3Provider>
          {children}
          <Toaster position="top-right" expand={true} richColors />
        </Web3Provider>
      </body>
    </html>
  );
}
