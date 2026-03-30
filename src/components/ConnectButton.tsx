'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ConnectKitButton } from 'connectkit';
import { useConnect } from 'wagmi';
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
        const check = () => {
            setIsMobile(/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
        };
        check();
    }, []);
    return isMobile;
}

export function ConnectButton({ className }: ConnectButtonProps) {
    const isMobile = useIsMobile();
    const [mobilePickerOpen, setMobilePickerOpen] = useState(false);
    const [wcUri, setWcUri] = useState<string | undefined>(undefined);
    const { connectors, connectAsync } = useConnect();

    const handleMobileConnect = useCallback(async () => {
        // Find the WalletConnect connector
        const wcConnector = connectors.find(
            (c) => c.id === 'walletConnect'
        );

        if (!wcConnector) {
            // Fallback: open picker without a URI (it will show "Generating...")
            setMobilePickerOpen(true);
            return;
        }

        setWcUri(undefined);
        setMobilePickerOpen(true);

        try {
            // Get the WalletConnect URI from the connector
            const provider = await wcConnector.getProvider() as any;
            if (provider?.signer?.uri) {
                setWcUri(provider.signer.uri);
            } else {
                // Trigger connection to generate the URI
                provider?.on('display_uri', (uri: string) => {
                    setWcUri(uri);
                });
                // Start the connection process (this generates the WC URI)
                connectAsync({ connector: wcConnector }).catch(() => {
                    // Expected: user may not complete connection in the modal
                });
            }
        } catch (e) {
            console.warn('Could not pre-fetch WC URI:', e);
        }
    }, [connectors, connectAsync]);

    return (
        <>
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

                    // On mobile + not connected: use our custom picker
                    const handleClick = () => {
                        if (isMobile && !isConnected) {
                            handleMobileConnect();
                        } else {
                            show?.();
                        }
                    };

                    return (
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
                    );
                }}
            </ConnectKitButton.Custom>

            {/* Custom mobile wallet picker bottom sheet */}
            {isMobile && (
                <MobileWalletPicker
                    isOpen={mobilePickerOpen}
                    onClose={() => setMobilePickerOpen(false)}
                    wcUri={wcUri}
                />
            )}
        </>
    );
}
