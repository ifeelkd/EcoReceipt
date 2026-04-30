"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Leaf, Zap, Lock, Globe, FileCheck, ArrowLeft, Terminal, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ProtocolPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#030712] text-foreground font-sans selection:bg-emerald-500/30">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10 px-6 py-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <Link href="/personal">
                        <Button variant="ghost" className="rounded-full gap-2 font-bold uppercase tracking-widest text-xs">
                            <ArrowLeft className="w-4 h-4" /> Back to Vault
                        </Button>
                    </Link>
                    <div className="flex items-center gap-2">
                        <Leaf className="w-6 h-6 text-emerald-500" />
                        <span className="font-black text-xl tracking-tighter uppercase italic">EcoProtocol <span className="text-emerald-500">v3</span></span>
                    </div>
                </div>
            </header>

            <main className="pt-32 pb-24 px-6 max-w-5xl mx-auto space-y-24">
                {/* Hero Section */}
                <section className="text-center space-y-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-black uppercase tracking-[0.2em]"
                    >
                        <Zap className="w-3 h-3 fill-current" /> Technical Whitepaper
                    </motion.div>
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none"
                    >
                        The Trust Layer for <br /><span className="text-emerald-500 underline decoration-wavy decoration-emerald-500/30 underline-offset-8">Global Commerce</span>
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-xl text-muted-foreground font-medium max-w-2xl mx-auto"
                    >
                        EcoProtocol is the decentralized infrastructure behind EcoReceipt, ensuring every purchase is immutable, verifiable, and environmentally neutral.
                    </motion.p>
                </section>

                {/* Core Pillars */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        {
                            icon: ShieldCheck,
                            title: "Immutability",
                            desc: "Once a receipt is minted on the EcoProtocol, it cannot be edited, deleted, or tampered with by any entity—including merchants.",
                            color: "text-blue-500"
                        },
                        {
                            icon: Lock,
                            title: "Cryptographic Proof",
                            desc: "Every bill is hashed using SHA-256 and anchored to the blockchain, providing a mathematically undeniable proof of purchase.",
                            color: "text-indigo-500"
                        },
                        {
                            icon: Globe,
                            title: "Universal Verification",
                            desc: "Standardized QR protocols allow any terminal in the world to verify a receipt's authenticity without direct database access.",
                            color: "text-emerald-500"
                        }
                    ].map((pill, i) => (
                        <motion.div
                            key={pill.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + i * 0.1 }}
                            className="glass p-8 rounded-[3rem] border-white/10 space-y-4 hover:border-emerald-500/30 transition-all group"
                        >
                            <pill.icon className={`w-12 h-12 ${pill.color} group-hover:scale-110 transition-transform`} />
                            <h3 className="text-2xl font-black uppercase tracking-tighter">{pill.title}</h3>
                            <p className="text-muted-foreground text-sm font-medium leading-relaxed">{pill.desc}</p>
                        </motion.div>
                    ))}
                </section>

                {/* Technical Details */}
                <section className="glass rounded-[4rem] border-white/10 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                        <Terminal className="w-64 h-64" />
                    </div>
                    <div className="p-12 space-y-12">
                        <div className="space-y-4">
                            <h2 className="text-4xl font-black uppercase tracking-tighter">Protocol Workflow</h2>
                            <p className="text-muted-foreground font-medium">The lifecycle of an EcoReceipt on the protocol.</p>
                        </div>

                        <div className="space-y-8">
                            {[
                                { step: "01", title: "Ingestion & Digitization", desc: "AI extracts transaction metadata (Store, Amount, Date) from the raw image." },
                                { step: "02", title: "Hashing & Pinning", desc: "The image is pinned to IPFS, and its CID is hashed with the transaction metadata." },
                                { step: "03", title: "Smart Contract Minting", desc: "The hash is signed by the merchant and minted as a unique NFT on the EcoProtocol." },
                                { step: "04", title: "On-Chain Validation", desc: "Third parties verify the signature against the merchant's public key for instant audit." }
                            ].map((step, i) => (
                                <div key={i} className="flex gap-6 items-start">
                                    <span className="text-2xl font-black text-emerald-500/40 tabular-nums">{step.step}</span>
                                    <div className="space-y-1">
                                        <h4 className="font-black uppercase tracking-widest text-sm">{step.title}</h4>
                                        <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Footer Call to Action */}
                <section className="text-center space-y-8 py-12">
                    <div className="w-20 h-20 bg-emerald-500 rounded-[2rem] flex items-center justify-center mx-auto text-white shadow-2xl shadow-emerald-500/40">
                        <Cpu className="w-10 h-10" />
                    </div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter">Ready to audit your commerce?</h2>
                    <Link href="/personal">
                        <Button className="h-16 px-12 bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest rounded-3xl shadow-xl transition-all">
                            Open Your Vault
                        </Button>
                    </Link>
                </section>
            </main>
        </div>
    );
}
