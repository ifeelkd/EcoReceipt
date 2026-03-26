'use client';

import React from 'react';
import { X, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scanner } from '@yudiel/react-qr-scanner';

interface QRScannerProps {
    isOpen: boolean;
    onClose: () => void;
    onScan: (address: string) => void;
}

export function QRScanner({ isOpen, onClose, onScan }: QRScannerProps) {
    const handleScan = (result: string) => {
        if (result && result.startsWith('0x') && result.length === 42) {
            onScan(result);
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-6 text-white"
                >
                    <button 
                        onClick={onClose}
                        className="absolute top-8 right-8 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all z-10"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    <div className="relative w-full max-w-sm aspect-square">
                        <div className="absolute inset-0 rounded-3xl overflow-hidden bg-black flex items-center justify-center">
                            <Scanner
                                onScan={(result) => {
                                    if (result?.[0]?.rawValue) {
                                        handleScan(result[0].rawValue);
                                    }
                                }}
                                styles={{ container: { width: '100%', height: '100%' } }}
                            />
                        </div>
                        
                        {/* Animated Corners */}
                        <div className="absolute top-[-4px] left-[-4px] w-12 h-12 border-t-4 border-l-4 border-emerald-500 rounded-tl-3xl pointer-events-none" />
                        <div className="absolute top-[-4px] right-[-4px] w-12 h-12 border-t-4 border-r-4 border-emerald-500 rounded-tr-3xl pointer-events-none" />
                        <div className="absolute bottom-[-4px] left-[-4px] w-12 h-12 border-b-4 border-l-4 border-emerald-500 rounded-bl-3xl pointer-events-none" />
                        <div className="absolute bottom-[-4px] right-[-4px] w-12 h-12 border-b-4 border-r-4 border-emerald-500 rounded-br-3xl pointer-events-none" />
                    </div>

                    <div className="mt-12 text-center space-y-2">
                        <div className="flex items-center justify-center gap-3">
                            <Camera className="w-6 h-6 text-emerald-500" />
                            <h3 className="text-xl font-black uppercase tracking-widest">Scanning Digital ID...</h3>
                        </div>
                        <p className="text-sm text-white/50 font-medium">Point camera at customer's Web3 Wallet QR Code</p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
