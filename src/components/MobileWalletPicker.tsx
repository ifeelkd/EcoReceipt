'use client';

import React, { useState } from 'react';
import { useConnect } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// WalletConnect v2 deep-link URI builder
function buildDeepLink(wallet: string, wcUri: string): string {
  const encoded = encodeURIComponent(wcUri);
  switch (wallet) {
    case 'MetaMask':    return `https://metamask.app.link/wc?uri=${encoded}`;
    case 'Coinbase':    return `https://go.cb-wallet.com/wc?uri=${encoded}`;
    case 'TrustWallet': return `https://link.trustwallet.com/wc?uri=${encoded}`;
    default:            return `https://metamask.app.link/wc?uri=${encoded}`;
  }
}

const WALLETS = [
  { id: 'MetaMask',    label: 'MetaMask',      icon: '🦊', sub: 'Open in MetaMask app' },
  { id: 'Coinbase',    label: 'Coinbase Wallet', icon: '🔵', sub: 'Open in Coinbase Wallet app' },
  { id: 'TrustWallet', label: 'Trust Wallet',   icon: '🛡️', sub: 'Open in Trust Wallet app' },
  { id: 'aave',        label: 'Aave Account',   icon: '👻', sub: 'Connect with Aave Smart Account' },
];

interface MobileWalletPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onShowConnectKit: () => void; // fallback for Aave & others
}

export function MobileWalletPicker({ isOpen, onClose, onShowConnectKit }: MobileWalletPickerProps) {
  const [loadingWallet, setLoadingWallet] = useState<string | null>(null);
  const { connectors, connectAsync } = useConnect();

  const handleWalletTap = async (walletId: string) => {
    // Aave uses the standard ConnectKit flow
    if (walletId === 'aave') {
      onClose();
      onShowConnectKit();
      return;
    }

    setLoadingWallet(walletId);

    try {
      // Find the WalletConnect connector from Wagmi
      const wcConnector = connectors.find((c) => c.type === 'walletConnect' || c.id === 'walletConnect');
      if (!wcConnector) throw new Error('WalletConnect connector not found');

      // Get the underlying provider to listen for the URI event
      const provider = await wcConnector.getProvider() as any;

      // Listen for the display_uri event FIRST, then redirect
      const deepLinkPromise = new Promise<string>((resolve) => {
        provider.once('display_uri', (uri: string) => {
          resolve(uri);
        });
        // Also check if there's already a pending URI
        if (provider?.signer?.uri) {
          resolve(provider.signer.uri);
        }
      });

      // Kick off the connection (this triggers the display_uri event)
      connectAsync({ connector: wcConnector }).catch(() => {
        // Error expected — the user will approve in their wallet app, not here
      });

      // Wait for the URI then immediately redirect
      const wcUri = await Promise.race([
        deepLinkPromise,
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000)),
      ]);

      const deepLink = buildDeepLink(walletId, wcUri as string);
      window.location.href = deepLink; // Redirect to open the wallet app
      onClose();
    } catch (err) {
      console.error('Deep link failed:', err);
      // Fallback to standard ConnectKit modal
      onClose();
      onShowConnectKit();
    } finally {
      setLoadingWallet(null);
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
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 35 }}
            className="fixed bottom-0 left-0 right-0 z-[101] bg-background border-t border-border rounded-t-3xl p-6 pb-10"
          >
            {/* Drag Handle */}
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />

            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold">Connect your wallet</h2>
                <p className="text-xs text-muted-foreground">Tap a wallet to open it on your phone</p>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Wallet Grid */}
            <div className="grid grid-cols-2 gap-3">
              {WALLETS.map((wallet) => {
                const isLoading = loadingWallet === wallet.id;
                const isDisabled = loadingWallet !== null && !isLoading;

                return (
                  <motion.button
                    key={wallet.id}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => handleWalletTap(wallet.id)}
                    disabled={isDisabled}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-2xl border border-border",
                      "bg-secondary/50 transition-all text-center",
                      isLoading && "bg-emerald-500/10 border-emerald-500/30",
                      isDisabled && "opacity-40 cursor-not-allowed",
                      !isDisabled && "hover:bg-secondary active:scale-95"
                    )}
                  >
                    {isLoading ? (
                      <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                    ) : (
                      <span className="text-3xl">{wallet.icon}</span>
                    )}
                    <div>
                      <p className="font-bold text-sm">{wallet.label}</p>
                      <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{wallet.sub}</p>
                    </div>
                    {!isLoading && <ExternalLink className="w-3 h-3 text-muted-foreground" />}
                    {isLoading && (
                      <span className="text-[10px] text-emerald-500 font-medium">Redirecting...</span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
