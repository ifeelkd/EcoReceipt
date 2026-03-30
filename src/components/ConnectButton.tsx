'use client';

import React, { useState, useEffect } from 'react';
import { ConnectKitButton } from 'connectkit';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { MobileWalletPicker } from '@/components/MobileWalletPicker';

interface ConnectButtonProps {
    className?: string;
}

function useIsMobile() {
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        setIsMobile(/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    }, []);
    return isMobile;
}

export function ConnectButton({ className }: ConnectButtonProps) {
    const isMobile = useIsMobile();
    const [pickerOpen, setPickerOpen] = useState(false);

    return (
        <ConnectKitButton.Custom>
            {({ isConnected, isConnecting, show, address, ensName }) => {
                const label = isConnected 
                    ? (ensName ?? `${address?.slice(0, 6)}...${address?.slice(-4)}`) 
                    : isConnecting ? "Connecting..." : "Connect Wallet";

                const shortLabel = isConnected 
                    ? `${address?.slice(0, 4)}..${address?.slice(-2)}` 
                    : isConnecting ? "..." : "Connect";

                const handleClick = () => {
                    if (isMobile && !isConnected) {
                        // Show custom mobile picker
                        setPickerOpen(true);
                    } else {
                        // Desktop: use standard ConnectKit modal
                        show?.();
                    }
                };

                return (
                    <>
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                        >
                            <Button
                                onClick={handleClick}
                                variant="default"
                                className={cn(
                                    "rounded-xl font-bold h-10 md:h-11 px-3 sm:px-4 md:px-6 transition-all shadow-lg",
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

                        {/* Mobile wallet picker: renders as a portal-like bottom sheet */}
                        {isMobile && (
                            <MobileWalletPicker
                                isOpen={pickerOpen}
                                onClose={() => setPickerOpen(false)}
                                onShowConnectKit={() => show?.()}
                            />
                        )}
                    </>
                );
            }}
        </ConnectKitButton.Custom>
    );
}
