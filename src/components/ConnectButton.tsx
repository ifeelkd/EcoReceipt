'use client';

import React from 'react';
import { ConnectKitButton } from 'connectkit';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface ConnectButtonProps {
    className?: string;
}

export function ConnectButton({ className }: ConnectButtonProps) {
    return (
        <ConnectKitButton.Custom>
            {({ isConnected, isConnecting, show, address, ensName }) => {
                const label = isConnected 
                    ? (ensName ?? `${address?.slice(0, 6)}...${address?.slice(-4)}`) 
                    : isConnecting 
                        ? "Connecting..." 
                        : "Connect Wallet";

                const shortLabel = isConnected 
                    ? `${address?.slice(0, 4)}..${address?.slice(-2)}` 
                    : isConnecting 
                        ? "..." 
                        : "Connect";

                return (
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    >
                        <Button
                            onClick={show}
                            variant="default"
                            className={cn(
                                "rounded-xl font-bold h-10 md:h-11 px-3 sm:px-4 md:px-6 transition-all shadow-lg",
                                // High visibility in light mode: deep emerald with a glow
                                !isConnected && "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/30 glow-emerald",
                                isConnected && "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                                className
                            )}
                        >
                            <Wallet className="w-4 h-4 mr-1.5 sm:mr-2 shrink-0" strokeWidth={1.5} />
                            <span className="hidden sm:inline-block tracking-tight">{label}</span>
                            <span className="sm:hidden tracking-tight text-xs uppercase font-black">{shortLabel}</span>
                        </Button>
                    </motion.div>
                );
            }}
        </ConnectKitButton.Custom>
    );
}
