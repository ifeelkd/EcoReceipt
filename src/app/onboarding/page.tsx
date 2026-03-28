'use client';

import React from 'react';
import Link from 'next/link';
import { Navigation } from '@/components/Navigation';
import {
  FileText,
  Leaf,
  ShieldCheck,
  Store,
  ArrowRight,
  Wallet,
  QrCode,
  BarChart3,
  Lock,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';

const PROBLEMS = [
  {
    icon: AlertTriangle,
    title: 'Paper Waste',
    desc: 'Billions of paper receipts are printed every year — most end up in landfills within minutes.',
    color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  },
  {
    icon: FileText,
    title: 'Lost & Forgotten',
    desc: 'Physical receipts fade, tear, and get lost. Warranty claims fail. Returns get denied.',
    color: 'text-red-500 bg-red-500/10 border-red-500/20',
  },
  {
    icon: Lock,
    title: 'No Ownership',
    desc: 'Store-stored receipts are controlled by the retailer. You have no independent proof of purchase.',
    color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
  },
];

const FEATURES = [
  {
    icon: ShieldCheck,
    title: 'Personal Vault',
    desc: 'Your own blockchain-backed receipt history. All purchases, warranties, and eco-impact — in one place.',
    color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    href: '/personal',
  },
  {
    icon: Store,
    title: 'Business Terminal',
    desc: 'Issue tamper-proof digital receipts to customers with one click. No printers. No paper.',
    color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    href: '/business',
  },
  {
    icon: BarChart3,
    title: 'Expense Tracking',
    desc: 'View spending breakdowns by category, track your verified total spend, and export your vault.',
    color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
    href: '/personal',
  },
  {
    icon: Leaf,
    title: 'Eco Impact',
    desc: 'See exactly how much paper and carbon emissions you\'ve saved by going digital.',
    color: 'text-teal-500 bg-teal-500/10 border-teal-500/20',
    href: '/personal',
  },
];

const WORKFLOW = [
  {
    step: '01',
    icon: Wallet,
    title: 'Connect Your Wallet',
    desc: 'Use any standard Web3 wallet (MetaMask, Coinbase Wallet, etc.) to securely identify yourself.',
    color: 'text-emerald-500',
    pill: 'All users',
  },
  {
    step: '02',
    icon: Store,
    title: 'Retailer Issues Receipt',
    desc: 'A verified retailer enters the purchase details and issues a digital receipt directly to your wallet address on-chain.',
    color: 'text-blue-500',
    pill: 'Retailers',
  },
  {
    step: '03',
    icon: QrCode,
    title: 'Scan & Capture',
    desc: 'Alternatively, share your wallet QR code with any EcoReceipt terminal for instant capture.',
    color: 'text-indigo-500',
    pill: 'Optional',
  },
  {
    step: '04',
    icon: ShieldCheck,
    title: 'Receipt Secured On-Chain',
    desc: 'The receipt is minted as a token on the blockchain — permanent, verifiable, and owned by you.',
    color: 'text-teal-500',
    pill: 'Automatic',
  },
  {
    step: '05',
    icon: BarChart3,
    title: 'Track in Your Vault',
    desc: 'View all receipts, monitor active warranties, analyse spending patterns, and export any time.',
    color: 'text-purple-500',
    pill: 'Consumers',
  },
];

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-background pb-24 pt-20 overflow-x-hidden">
      <Navigation />

      <main className="max-w-4xl mx-auto px-4 md:px-8 py-12 md:py-20 space-y-20 md:space-y-28">

        {/* Hero */}
        <section className="text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black border border-emerald-500/20 uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Welcome to EcoReceipt
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-[1.1]">
            The Future of <br />
            <span className="text-emerald-500">Proof of Purchase.</span>
          </h1>
          <p className="text-muted-foreground text-base md:text-xl font-medium leading-relaxed max-w-2xl mx-auto">
            A decentralised receipt system that eliminates paper waste, gives consumers full ownership of their purchase records, and lets retailers issue digital receipts instantly.
          </p>
        </section>

        {/* Problem */}
        <section className="space-y-8">
          <div className="space-y-2">
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">The Problem</p>
            <h2 className="text-2xl md:text-4xl font-black tracking-tighter uppercase">
              Why Paper Receipts Are Broken
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {PROBLEMS.map((p) => (
              <div key={p.title} className="glass p-6 rounded-[2rem] border space-y-4 border-white/10 shadow-lg">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${p.color}`}>
                  <p.icon className="w-6 h-6" strokeWidth={1.5} />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-lg font-black uppercase tracking-tight">{p.title}</h3>
                  <p className="text-sm text-muted-foreground font-medium leading-relaxed">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Solution */}
        <section className="glass p-8 md:p-12 rounded-[2.5rem] border border-emerald-500/20 bg-emerald-500/5 space-y-6">
          <div className="space-y-2">
            <p className="text-xs font-black uppercase tracking-widest text-emerald-500">The Solution</p>
            <h2 className="text-2xl md:text-4xl font-black tracking-tighter uppercase leading-[1.1]">
              Blockchain-Backed Receipts, <br />
              <span className="text-emerald-500">Owned by You.</span>
            </h2>
          </div>
          <p className="text-muted-foreground text-base md:text-lg font-medium leading-relaxed max-w-2xl">
            EcoReceipt replaces paper receipts with on-chain tokens. Every purchase becomes a permanent, verifiable digital asset — stored in your personal vault, not on a retailer's server. No paper. No data loss. No middlemen.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {[
              { label: 'Paper Saved', value: '100%', sub: 'Zero printing required' },
              { label: 'Permanence', value: '∞', sub: 'Blockchain does not expire' },
              { label: 'User Ownership', value: 'Full', sub: 'Your wallet, your records' },
            ].map((stat) => (
              <div key={stat.label} className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 text-center space-y-1">
                <p className="text-3xl font-black text-emerald-500">{stat.value}</p>
                <p className="text-xs font-black uppercase tracking-widest">{stat.label}</p>
                <p className="text-xs text-muted-foreground font-medium">{stat.sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="space-y-8">
          <div className="space-y-2">
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Features</p>
            <h2 className="text-2xl md:text-4xl font-black tracking-tighter uppercase">What You Can Do</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            {FEATURES.map((f) => (
              <Link href={f.href} key={f.title}>
                <div className="glass p-6 md:p-8 rounded-[2rem] border border-white/10 shadow-lg group cursor-pointer hover:shadow-xl transition-all duration-300 h-full space-y-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${f.color}`}>
                    <f.icon className="w-6 h-6" strokeWidth={1.5} />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-black uppercase tracking-tight">{f.title}</h3>
                      <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" strokeWidth={1.5} />
                    </div>
                    <p className="text-sm text-muted-foreground font-medium leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Workflow */}
        <section className="space-y-8 w-full">
          <div className="space-y-2">
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">How It Works</p>
            <h2 className="text-2xl md:text-4xl font-black tracking-tighter uppercase">The Workflow</h2>
          </div>
          
          <div className="relative ml-4 md:ml-6 space-y-8 md:space-y-12 pb-4">
            {/* Continuous Dotted Timeline Line */}
            <div className="absolute left-[calc(-17px+14px)] top-12 bottom-12 w-[4px] border-l-[4px] border-dotted border-muted-foreground/50 z-0 hidden sm:block" />

            {WORKFLOW.map((step, idx) => (
              <div key={step.step} className="relative pl-8 md:pl-12">
                {/* Mobile Connecting Line (fallback) */}
                {idx < WORKFLOW.length - 1 && (
                  <div className="absolute top-1/2 -left-[3px] w-[4px] h-[calc(100%+2rem)] border-l-[4px] border-dotted border-muted-foreground/50 z-0 sm:hidden" />
                )}
                
                {/* Timeline Node */}
                <div className={`absolute top-1/2 -translate-y-1/2 -left-[17px] w-8 h-8 rounded-full border-4 border-background flex items-center justify-center z-10 shadow-lg ${
                  idx === 0 ? 'bg-emerald-500' :
                  idx === 1 ? 'bg-blue-500' :
                  idx === 2 ? 'bg-indigo-500' :
                  idx === 3 ? 'bg-teal-500' :
                  'bg-purple-500'
                }`}>
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
                
                {/* Card */}
                <div className="glass p-6 md:p-8 rounded-[2rem] border border-white/10 shadow-lg flex flex-col sm:flex-row gap-6 md:gap-8 group hover:border-white/20 transition-colors">
                  <div className="flex items-center justify-between sm:flex-col sm:justify-center gap-4 shrink-0">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${
                      idx === 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                      idx === 1 ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' :
                      idx === 2 ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500' :
                      idx === 3 ? 'bg-teal-500/10 border-teal-500/20 text-teal-500' :
                      'bg-purple-500/10 border-purple-500/20 text-purple-500'
                    }`}>
                      <step.icon className="w-7 h-7" strokeWidth={1.5} />
                    </div>
                    <span className={`text-5xl md:text-6xl font-black tabular-nums leading-none opacity-20 ${step.color}`}>{step.step}</span>
                  </div>
                  
                  <div className="space-y-3 flex-1 flex flex-col justify-center">
                    <div className="space-y-2">
                      <span className="inline-block text-[10px] font-black uppercase tracking-widest border px-2 py-0.5 rounded-full border-white/20 text-muted-foreground">
                        {step.pill}
                      </span>
                      <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight leading-tight">{step.title}</h3>
                    </div>
                    <p className="text-sm md:text-base text-muted-foreground font-medium leading-relaxed max-w-xl">{step.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center space-y-6">
          <div className="space-y-3">
            <h2 className="text-2xl md:text-4xl font-black tracking-tighter uppercase">Ready to get started?</h2>
            <p className="text-muted-foreground font-medium text-sm md:text-base max-w-md mx-auto">
              Choose your portal and connect your wallet to begin.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/personal">
              <div className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest text-sm transition-colors shadow-lg shadow-emerald-500/20 cursor-pointer group">
                <ShieldCheck className="w-4 h-4" strokeWidth={1.5} />
                Personal Vault
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" strokeWidth={2} />
              </div>
            </Link>
            <Link href="/business">
              <div className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl glass border border-white/20 font-black uppercase tracking-widest text-sm hover:bg-white/10 transition-colors cursor-pointer group">
                <Store className="w-4 h-4" strokeWidth={1.5} />
                Business Terminal
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" strokeWidth={2} />
              </div>
            </Link>
          </div>
        </section>

      </main>
    </div>
  );
}
