'use client';

import React, { useState } from 'react';
import { useAccount, useSwitchChain, useChainId } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Globe, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { mainnet, sepolia } from 'wagmi/chains';

export function NetworkSwitcher() {
  const [mounted, setMounted] = useState(false);
  React.useEffect(() => setMounted(true), []);
  
  if (!mounted) return <div className="w-10 h-10 md:w-[140px] md:h-11 rounded-xl bg-transparent" />;
  return <NetworkSwitcherInner />;
}

function NetworkSwitcherInner() {
  const { isConnected, isConnecting } = useAccount();
  const chainId = useChainId();
  const { chains, switchChain } = useSwitchChain();
  const [isOpen, setIsOpen] = useState(false);

  if (!isConnected && !isConnecting) return null;

  const currentChain = chains.find(c => c.id === chainId);
  const isSupported = !!currentChain;

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 h-10 md:h-11 px-3 md:px-4 rounded-xl border backdrop-blur-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm",
          isSupported 
            ? "border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50" 
            : "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400"
        )}
      >
        <div className="relative flex items-center justify-center w-4 h-4">
          {isSupported ? (
            <>
              <span className="absolute w-2 h-2 rounded-full bg-emerald-500 animate-ping opacity-75" />
              <span className="relative w-2 h-2 rounded-full bg-emerald-500" />
            </>
          ) : (
            <>
              <span className="absolute w-2 h-2 rounded-full bg-red-500 animate-ping opacity-75" />
              <span className="relative w-2 h-2 rounded-full bg-red-500" />
            </>
          )}
        </div>
        
        <span className="font-bold text-sm tracking-tight hidden sm:inline-block">
          {isSupported ? currentChain.name : "Unsupported Network"}
        </span>
        <ChevronDown className={cn("w-3 h-3 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="absolute left-0 sm:right-0 sm:left-auto top-full mt-2 w-48 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xl overflow-hidden z-50 p-2"
            >
              <div className="flex flex-col gap-1">
                <div className="px-3 py-2 text-xs font-black uppercase tracking-widest text-muted-foreground border-b border-slate-100 dark:border-slate-800 mb-1">
                  Switch Network
                </div>
                {chains.map((chain) => (
                  <button
                    key={chain.id}
                    onClick={() => {
                      switchChain({ chainId: chain.id });
                      setIsOpen(false);
                    }}
                    className={cn(
                      "flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                      chainId === chain.id 
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Globe className="w-4 h-4" />
                      <span>{chain.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
