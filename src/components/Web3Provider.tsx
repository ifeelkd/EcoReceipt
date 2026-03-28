'use client';

import React, { ReactNode } from 'react';
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider } from "connectkit";
import { config } from "@/lib/wagmi";
import { AaveAccountSdk } from '@aave/account';
import { useEffect } from "react";

const queryClient = new QueryClient();

export const Web3Provider = ({ children }: { children: ReactNode }) => {
  useEffect(() => {
    // Pre-initialize the Aave Account SDK to prevent EIP1193 timeout errors 
    // when users select 'Continue with Aave' in ConnectKit 1.9.2+
    AaveAccountSdk.connect().catch(console.warn);
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider theme="auto" mode="light">
          {children}
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
