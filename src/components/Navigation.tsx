'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, Store, Home, LogOut } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { ConnectKitButton } from 'connectkit';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ConnectButton } from '@/components/ConnectButton';
import { motion } from 'framer-motion';

export function Navigation() {
  const pathname = usePathname();

  const isBusiness = pathname.startsWith('/business');
  const isPersonal = pathname.startsWith('/personal');
  const isHome = pathname === '/';

  const accentColor = isBusiness ? 'blue' : 'emerald';

  return (
    <>
      {/* Desktop & Mobile Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-2 md:px-6 py-3 md:py-4">
        <div className="max-w-7xl mx-auto nav-glass rounded-2xl shadow-xl flex items-center justify-between px-3 md:px-6 h-14 md:h-16">

          <Link href="/" className="flex items-center gap-2 group">
            <motion.div
              className={cn(
                "w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center text-white shadow-lg overflow-hidden",
                isHome 
                  ? "bg-transparent shadow-none" 
                  : isBusiness
                    ? "bg-blue-500 shadow-blue-500/20"
                    : "bg-emerald-500 shadow-emerald-500/20"
              )}
              whileHover={{ scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            >
              {isHome ? (
                <Image 
                  src="/favicon.ico" 
                  alt="EcoReceipt Logo" 
                  width={40} 
                  height={40}
                  className="w-full h-full object-contain"
                />
              ) : isBusiness ? (
                <Store className="w-4 h-4 md:w-5 md:h-5" strokeWidth={1.5} />
              ) : (
                <Shield className="w-4 h-4 md:w-5 md:h-5" strokeWidth={1.5} />
              )}
            </motion.div>
            <span className="text-base md:text-xl font-black tracking-tighter">
              {isBusiness ? 'ECO BUSINESS' : isPersonal ? 'ECO VAULT' : 'ECO RECEIPT'}
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-bold uppercase tracking-widest">
            {!isHome && (
              <Link
                href="/"
                className="flex items-center gap-1.5 transition-all text-muted-foreground hover:text-primary opacity-70 hover:opacity-100"
              >
                <Home className="w-3.5 h-3.5" strokeWidth={1.5} />
                Switch Portal
              </Link>
            )}
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <ConnectButton />
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      {!isHome && (
        <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm">
          <div className="nav-glass rounded-[2.5rem] shadow-2xl flex items-center justify-around p-2.5">
            <Link
              href="/"
              className="flex flex-col items-center gap-1 py-2 px-5 rounded-2xl transition-all min-h-[44px] text-muted-foreground hover:bg-white/10 dark:hover:bg-white/5"
            >
              <LogOut className="w-4 h-4 rotate-180" strokeWidth={1.5} />
              <span className="text-[8px] font-black uppercase tracking-widest">Exit</span>
            </Link>

            {isPersonal && (
              <Link
                href="/personal"
                className="flex flex-col items-center gap-1 py-2 px-5 rounded-2xl transition-all min-h-[44px] bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
              >
                <Shield className="w-4 h-4" strokeWidth={1.5} />
                <span className="text-[8px] font-black uppercase tracking-widest">Vault</span>
              </Link>
            )}

            {isBusiness && (
              <Link
                href="/business"
                className="flex flex-col items-center gap-1 py-2 px-5 rounded-2xl transition-all min-h-[44px] bg-blue-500 text-white shadow-lg shadow-blue-500/20"
              >
                <Store className="w-4 h-4" strokeWidth={1.5} />
                <span className="text-[8px] font-black uppercase tracking-widest">Terminal</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
