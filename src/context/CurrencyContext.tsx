'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Currency = 'INR' | 'USD' | 'EUR' | 'GBP' | 'CNY' | 'JPY';

interface CurrencyContextProps {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  rates: Record<Currency, number>;
  isLoadingRates: boolean;
  formatFiat: (ethValue: number | string) => string;
}

const CurrencyContext = createContext<CurrencyContextProps | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>('INR');
  const [rates, setRates] = useState<Record<Currency, number>>({
    INR: 250000,
    USD: 3000,
    EUR: 2800,
    GBP: 2400,
    CNY: 21000,
    JPY: 450000,
  });
  const [isLoadingRates, setIsLoadingRates] = useState(true);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const response = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=inr,usd,eur,gbp,cny,jpy'
        );
        if (!response.ok) throw new Error('API Rate Limit or Network Error');
        
        const data = await response.json();
        
        if (data && data.ethereum) {
          setRates({
            INR: data.ethereum.inr || 250000,
            USD: data.ethereum.usd || 3000,
            EUR: data.ethereum.eur || 2800,
            GBP: data.ethereum.gbp || 2400,
            CNY: data.ethereum.cny || 21000,
            JPY: data.ethereum.jpy || 450000,
          });
        }
      } catch (error) {
        console.warn('Using fallback currency rates due to CoinGecko API limit or network error.');
      } finally {
        setIsLoadingRates(false);
      }
    };

    fetchRates();
    // Cache or re-fetch logic can be expanded here (e.g., polling every 5 mins)
    const interval = setInterval(fetchRates, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatFiat = (ethValue: number | string) => {
    const numericEth = typeof ethValue === 'string' ? parseFloat(ethValue) : ethValue;
    if (isNaN(numericEth)) return '0.00';

    const rawFiat = numericEth * rates[currency];
    
    // Formatting helper
    return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(rawFiat);
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, rates, isLoadingRates, formatFiat }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
