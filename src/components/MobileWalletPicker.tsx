'use client';

import React, { useState, useEffect } from 'react';
import { useConnect, useAccount, useDisconnect } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wallet, ChevronRight, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Wallet deep-link URIs: these are used on mobile browsers to open the wallet app
const WALLET_DEEP_LINKS: Record<string, (uri: string) => string> = {
  MetaMask: (uri) => `https://metamask.app.link/wc?uri=${encodeURIComponent(uri)}`,
  Coinbase: (uri) => `https://go.cb-wallet.com/wc?uri=${encodeURIComponent(uri)}`,
  TrustWallet: (uri) => `https://link.trustwallet.com/wc?uri=${encodeURIComponent(uri)}`,
};

const WALLET_ICONS: Record<string, string> = {
  MetaMask: '🦊',
  Coinbase: '🔵', 
  TrustWallet: '🛡️',
  WalletConnect: '🔗',
};

function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

interface MobileWalletPickerProps {
  isOpen: boolean;
  onClose: () => void;
  wcUri?: string;
}

export function MobileWalletPicker({ isOpen, onClose, wcUri }: MobileWalletPickerProps) {
  const wallets = [
    { name: 'MetaMask', description: 'Connect via MetaMask app' },
    { name: 'Coinbase', description: 'Connect via Coinbase Wallet' },
    { name: 'TrustWallet', description: 'Connect via Trust Wallet' },
  ];

  const handleWalletClick = (walletName: string) => {
    if (!wcUri) return;
    const deepLinkFn = WALLET_DEEP_LINKS[walletName];
    if (deepLinkFn) {
      const url = deepLinkFn(wcUri);
      window.open(url, '_blank');
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-[101] bg-background border-t border-border rounded-t-3xl p-6 pb-8"
          >
            {/* Handle */}
            <div className="w-12 h-1 bg-border rounded-full mx-auto mb-6" />
            
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold">Connect Wallet</h2>
                <p className="text-sm text-muted-foreground">Choose your wallet to connect</p>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Wallet Options */}
            <div className="space-y-3">
              {wallets.map((wallet) => (
                <motion.button
                  key={wallet.name}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleWalletClick(wallet.name)}
                  disabled={!wcUri}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-2xl border border-border",
                    "bg-secondary/50 hover:bg-secondary transition-all text-left",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  <span className="text-3xl w-10 text-center flex-shrink-0">
                    {WALLET_ICONS[wallet.name]}
                  </span>
                  <div className="flex-1">
                    <p className="font-bold text-base">{wallet.name}</p>
                    <p className="text-xs text-muted-foreground">{wallet.description}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </motion.button>
              ))}
            </div>

            {!wcUri && (
              <p className="text-center text-sm text-muted-foreground mt-4 animate-pulse">
                Generating connection link...
              </p>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
