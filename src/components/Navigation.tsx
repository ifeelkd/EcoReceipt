'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, Store, Home, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConnectKitButton } from 'connectkit';

export function Navigation() {
  const pathname = usePathname();

  const isBusiness = pathname.startsWith('/business');
  const isPersonal = pathname.startsWith('/personal');
  const isHome = pathname === '/';

  return (
    <>
      {/* Desktop & Mobile Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-2 md:px-6 py-3 md:py-4">
        <div className="max-w-7xl mx-auto glass rounded-2xl border-white/20 shadow-xl flex items-center justify-between px-3 md:px-6 h-14 md:h-16">
            <Link href="/" className="flex items-center gap-2 group">
                <div className={cn(
                    "w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-all",
                    isBusiness ? "bg-blue-500 shadow-blue-500/20" : "bg-emerald-500 shadow-emerald-500/20"
                )}>
                    {isBusiness ? <Store className="w-4 h-4 md:w-5 md:h-5" /> : <Shield className="w-4 h-4 md:w-5 md:h-5" />}
                </div>
                <span className="text-base md:text-xl font-black tracking-tighter">
                    {isBusiness ? 'ECO_BUSINESS' : isPersonal ? 'ECO_VAULT' : 'ECO_RECEIPT'}
                </span>
            </Link>

            <div className="hidden md:flex items-center gap-8 text-sm font-bold uppercase tracking-widest">
                {!isHome && (
                    <Link href="/" className="transition-all text-muted-foreground opacity-70 hover:text-primary">
                        Switch Portal
                    </Link>
                )}
            </div>

            <div className="flex items-center gap-4">
                <ConnectKitButton />
            </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation - Distinct by portal */}
      {!isHome && (
          <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm">
            <div className="glass rounded-[2.5rem] border-white/20 shadow-2xl flex items-center justify-around p-2.5">
                <Link 
                    href="/" 
                    className="flex flex-col items-center gap-1 py-2 px-5 rounded-2xl transition-all min-h-[44px] text-muted-foreground hover:bg-white/10"
                >
                    <LogOut className="w-4 h-4 rotate-180" />
                    <span className="text-[8px] font-black uppercase tracking-widest">Exit</span>
                </Link>

                {isPersonal && (
                    <Link 
                        href="/personal" 
                        className="flex flex-col items-center gap-1 py-2 px-5 rounded-2xl transition-all min-h-[44px] bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                    >
                        <Shield className="w-4 h-4" />
                        <span className="text-[8px] font-black uppercase tracking-widest">Vault</span>
                    </Link>
                )}

                {isBusiness && (
                    <Link 
                        href="/business" 
                        className="flex flex-col items-center gap-1 py-2 px-5 rounded-2xl transition-all min-h-[44px] bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                    >
                        <Store className="w-4 h-4" />
                        <span className="text-[8px] font-black uppercase tracking-widest">Terminal</span>
                    </Link>
                )}
            </div>
          </div>
      )}
    </>
  );
}
