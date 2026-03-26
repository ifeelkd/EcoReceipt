'use client';

import React from 'react';
import Link from 'next/link';
import { Navigation } from '@/components/Navigation';
import { Shield, Store, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col pt-20">
      <Navigation />
      
      <main className="flex-1 flex flex-col items-center justify-center p-6 space-y-12 pb-24">
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4 max-w-3xl"
        >
            <h1 className="text-4xl md:text-7xl font-black tracking-tighter uppercase leading-[1.1]">
                EcoReceipt <span className="text-emerald-500">Hub</span>
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl font-medium">
                The decentralized standard for proof of purchase. Choose your portal.
            </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl">
            {/* Personal Card */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
            >
                <Link href="/personal">
                    <div className="glass h-full p-10 md:p-14 rounded-[3rem] border-white/20 shadow-2xl hover:shadow-emerald-500/20 hover:-translate-y-2 transition-all flex flex-col items-start gap-6 group">
                        <div className="w-20 h-20 rounded-[2rem] bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform">
                            <Shield className="w-10 h-10" />
                        </div>
                        <div className="space-y-4">
                            <h2 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
                                Personal Vault <ArrowRight className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-all -ml-6 group-hover:ml-0 text-emerald-500" />
                            </h2>
                            <p className="text-muted-foreground font-medium text-lg leading-relaxed">
                                Manage warranties and track expenses securely.
                            </p>
                        </div>
                    </div>
                </Link>
            </motion.div>

            {/* Business Card */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
            >
                <Link href="/business">
                    <div className="glass h-full p-10 md:p-14 rounded-[3rem] border-white/20 shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-2 transition-all flex flex-col items-start gap-6 group">
                        <div className="w-20 h-20 rounded-[2rem] bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
                            <Store className="w-10 h-10" />
                        </div>
                        <div className="space-y-4">
                            <h2 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
                                Business Terminal <ArrowRight className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-all -ml-6 group-hover:ml-0 text-blue-500" />
                            </h2>
                            <p className="text-muted-foreground font-medium text-lg leading-relaxed">
                                Issue secure digital receipts directly to your customers.
                            </p>
                        </div>
                    </div>
                </Link>
            </motion.div>
        </div>
      </main>
    </div>
  );
}
