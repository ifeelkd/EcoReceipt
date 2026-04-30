'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, Store, Home, LogOut, Briefcase, Menu, X } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ConnectButton } from '@/components/ConnectButton';
import { CurrencySelector } from '@/components/CurrencySelector';
import { NetworkSwitcher } from '@/components/NetworkSwitcher';
import { motion, AnimatePresence } from 'framer-motion';

export function Navigation() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isBusiness = pathname.startsWith('/business');
  const isPersonal = pathname.startsWith('/personal');
  const isPartner = pathname.startsWith('/partner');
  const isHome = pathname === '/';

  const accentColor = isBusiness || isPartner ? 'blue' : 'emerald';

  return (
    <>
      {/* Desktop & Mobile Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-2 md:px-6 py-3 md:py-4">
        <div className="max-w-7xl mx-auto nav-glass rounded-2xl shadow-xl flex items-center justify-between px-3 md:px-6 h-14 md:h-16 relative z-50">

          <Link href="/" className="flex items-center gap-2 group shrink-0">
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
              ) : isBusiness || isPartner ? (
                <Store className="w-5 h-5 md:w-6 md:h-6" strokeWidth={1.5} />
              ) : (
                <Shield className="w-5 h-5 md:w-6 md:h-6" strokeWidth={1.5} />
              )}
            </motion.div>
            <span className="hidden sm:inline-block text-sm md:text-xl font-black tracking-tighter">
              {isPartner ? 'ECO PARTNER' : isBusiness ? 'ECO BUSINESS' : isPersonal ? 'ECO VAULT' : 'ECO RECEIPT'}
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-bold uppercase tracking-widest">
            <Link href="/onboarding" className="text-muted-foreground hover:text-foreground transition-colors">Know About</Link>
          </div>

          <div className="flex items-center gap-1 md:gap-3 shrink-0">
            {/* Desktop Controls */}
            <div className="hidden md:flex items-center gap-3">
              <CurrencySelector />
              <NetworkSwitcher />
              <ThemeToggle />
            </div>
            
            <ConnectButton />
            
            {/* Mobile Hamburger Button */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden w-11 h-11 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 active:scale-95 transition-all select-none"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="md:hidden absolute top-full left-2 right-2 mt-2 p-6 bg-background/95 backdrop-blur-3xl rounded-[2rem] shadow-2xl space-y-6 z-40 border border-white/20 select-none"
            >
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">Preferences</p>
                <div className="grid grid-cols-1 gap-3">
                  <Link href="/onboarding" className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 min-h-[64px]" onClick={() => setIsMenuOpen(false)}>
                    <span className="text-xs font-bold uppercase tracking-widest opacity-70">Know About EcoReceipt</span>
                    <Briefcase className="w-4 h-4 text-emerald-500" />
                  </Link>
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 min-h-[64px]">
                    <span className="text-xs font-bold uppercase tracking-widest opacity-70">Currency</span>
                    <CurrencySelector />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 min-h-[64px]">
                    <span className="text-xs font-bold uppercase tracking-widest opacity-70">Network</span>
                    <NetworkSwitcher />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 min-h-[64px]">
                    <span className="text-xs font-bold uppercase tracking-widest opacity-70">Appearance</span>
                    <ThemeToggle />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Mobile Bottom Navigation */}
      {!isHome && (
        <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-sm">
          <div className="nav-glass rounded-[2rem] shadow-2xl flex items-center justify-around p-2">
            <Link
              href="/"
              className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all min-h-[44px] min-w-[44px] text-muted-foreground hover:bg-white/10 dark:hover:bg-white/5"
            >
              <LogOut className="w-5 h-5 rotate-180" strokeWidth={1.5} />
              <span className="text-[8px] font-black uppercase tracking-widest">Exit</span>
            </Link>

            {isPersonal && (
              <Link
                href="/personal"
                className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all min-h-[44px] min-w-[44px] bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
              >
                <Shield className="w-5 h-5" strokeWidth={1.5} />
                <span className="text-[8px] font-black uppercase tracking-widest">Vault</span>
              </Link>
            )}

            {isBusiness && (
              <Link
                href="/business"
                className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all min-h-[44px] min-w-[44px] bg-blue-500 text-white shadow-lg shadow-blue-500/20"
              >
                <Store className="w-5 h-5" strokeWidth={1.5} />
                <span className="text-[8px] font-black uppercase tracking-widest">Terminal</span>
              </Link>
            )}

            {isPartner && (
              <Link
                href="/partner"
                className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all min-h-[44px] min-w-[44px] bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
              >
                <Briefcase className="w-5 h-5" strokeWidth={1.5} />
                <span className="text-[8px] font-black uppercase tracking-widest">Partner</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
