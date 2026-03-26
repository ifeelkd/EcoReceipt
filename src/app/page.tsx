'use client';

import React from 'react';
import Link from 'next/link';
import { Navigation } from '@/components/Navigation';
import { Shield, Store, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-background flex flex-col pt-20 overflow-hidden">
      {/* Animated Mesh Gradient Background */}
      <div className="mesh-gradient" aria-hidden="true" />

      <Navigation />

      <main className="flex-1 flex flex-col items-center justify-center p-6 space-y-12 pb-24 relative z-10">

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-center space-y-5 max-w-3xl"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black border border-emerald-500/20 uppercase tracking-widest"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Blockchain-Secured Receipts
          </motion.div>
          <h1 className="text-4xl md:text-7xl font-black tracking-tighter uppercase leading-[1.1]">
            EcoReceipt <span className="text-emerald-500 dark:text-emerald-400">Hub</span>
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl font-medium leading-relaxed">
            The decentralized standard for proof of purchase. Choose your portal.
          </p>
        </motion.div>

        {/* Portal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl">

          {/* Personal Card */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <Link href="/personal">
              <motion.div
                className="glass h-full p-10 md:p-14 rounded-[3rem] shadow-2xl hover:shadow-emerald-500/20 flex flex-col items-start gap-6 group cursor-pointer"
                whileHover={{ scale: 1.02, y: -4 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <motion.div
                  className="w-20 h-20 rounded-[2rem] bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20"
                  whileHover={{ scale: 1.12 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                >
                  <Shield className="w-10 h-10" strokeWidth={1.5} />
                </motion.div>
                <div className="space-y-4">
                  <h2 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
                    Personal Vault
                    <ArrowRight
                      className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-all -ml-2 group-hover:ml-0 text-emerald-500"
                      strokeWidth={1.5}
                    />
                  </h2>
                  <p className="text-muted-foreground font-medium text-lg leading-relaxed">
                    Manage warranties and track expenses securely.
                  </p>
                </div>
              </motion.div>
            </Link>
          </motion.div>

          {/* Business Card */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <Link href="/business">
              <motion.div
                className="glass h-full p-10 md:p-14 rounded-[3rem] shadow-2xl hover:shadow-blue-500/20 flex flex-col items-start gap-6 group cursor-pointer"
                whileHover={{ scale: 1.02, y: -4 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <motion.div
                  className="w-20 h-20 rounded-[2rem] bg-blue-500/10 text-blue-500 dark:text-blue-400 flex items-center justify-center border border-blue-500/20"
                  whileHover={{ scale: 1.12 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                >
                  <Store className="w-10 h-10" strokeWidth={1.5} />
                </motion.div>
                <div className="space-y-4">
                  <h2 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
                    Business Terminal
                    <ArrowRight
                      className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-all -ml-2 group-hover:ml-0 text-blue-500"
                      strokeWidth={1.5}
                    />
                  </h2>
                  <p className="text-muted-foreground font-medium text-lg leading-relaxed">
                    Issue secure digital receipts directly to your customers.
                  </p>
                </div>
              </motion.div>
            </Link>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
