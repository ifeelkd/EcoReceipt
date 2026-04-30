'use client';

import React, { ReactNode, useEffect } from 'react';
import { WagmiProvider, useAccount, useDisconnect } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider } from "connectkit";
import { config } from "@/lib/wagmi";
// Aave SDK removed due to connection timeout issues
const queryClient = new QueryClient();

// Internal guard component to handle account switching
function WalletWatchdog() {
  const { isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (isConnected && accounts.length > 0) {
          console.log("Wallet account changed. Disconnecting to prevent session mismatch.");
          disconnect();
        }
      };

      (window as any).ethereum.on('accountsChanged', handleAccountsChanged);
      return () => {
        (window as any).ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, [isConnected, disconnect]);

  return null;
}

export const Web3Provider = ({ children }: { children: ReactNode }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider 
          theme="auto" 
          mode="light"
          options={{
            initialChainId: 11155111, // Standardize on Sepolia
            embedGoogleFonts: true,
          }}
        >
          <WalletWatchdog />
          {children}
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
