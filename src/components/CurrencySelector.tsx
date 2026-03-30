'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Banknote, ChevronDown, Check } from 'lucide-react';
import { useCurrency, Currency } from '@/context/CurrencyContext';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';

const CURRENCIES: { code: Currency; symbol: string; label: string }[] = [
  { code: 'INR', symbol: '₹', label: 'Indian Rupee' },
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
];

export function CurrencySelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { currency, setCurrency } = useCurrency();
  const { theme } = useTheme();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const selectedIdx = CURRENCIES.findIndex(c => c.code === currency);

  if (!mounted) return <div className="w-10 h-10 md:w-[100px] md:h-11 rounded-xl bg-transparent" />;

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 h-10 md:h-11 px-3 md:px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm"
      >
        <Banknote className="w-4 h-4 text-emerald-500" strokeWidth={1.5} />
        <span className="font-bold text-sm tracking-tight hidden sm:inline-block">
          {currency}
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
              className="absolute right-0 top-full mt-2 w-48 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xl overflow-hidden z-50 p-2"
            >
              <div className="flex flex-col gap-1">
                {CURRENCIES.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => {
                      setCurrency(c.code);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                      currency === c.code 
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-bold w-4 text-center">{c.symbol}</span>
                      <span>{c.code}</span>
                    </div>
                    {currency === c.code && <Check className="w-4 h-4 text-emerald-500" />}
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
