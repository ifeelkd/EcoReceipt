'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import { useReadContract } from 'wagmi';
import { ECO_RECEIPT_ABI, ECO_RECEIPT_ADDRESS } from '@/lib/constants';
import { formatEther } from 'viem';
import { 
  ShieldCheck, 
  Clock, 
  ExternalLink, 
  ShoppingBag, 
  Calendar, 
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  Leaf
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function VerificationContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const receiptId = params.id;
  const customerAddress = searchParams.get('customer');
  
  const [receipt, setReceipt] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: receipts, isLoading, isError } = useReadContract({
    address: ECO_RECEIPT_ADDRESS,
    abi: ECO_RECEIPT_ABI,
    functionName: 'getReceiptsByCustomer',
    args: customerAddress ? [customerAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!customerAddress,
    }
  });

  useEffect(() => {
    if (receipts && receiptId) {
      const found = (receipts as any[]).find(r => r.id.toString() === receiptId);
      if (found) {
        setReceipt(found);
      } else {
        setError('Receipt not found in customer records.');
      }
    }
  }, [receipts, receiptId]);

  if (!customerAddress) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-3xl flex items-center justify-center">
          <AlertCircle className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-black uppercase tracking-tighter">Invalid Link</h1>
          <p className="text-muted-foreground max-w-sm">Verification links must include a valid customer identifier.</p>
        </div>
        <Button onClick={() => window.location.href = '/'} className="rounded-2xl h-14 px-8 font-black uppercase tracking-widest bg-white/5 border border-white/10 hover:bg-white/10 glass">
          Back to Hub
        </Button>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div 
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex flex-col items-center justify-center py-24 gap-4"
        >
          <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
          <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Consulting Nodes...</p>
        </motion.div>
      ) : error || isError ? (
        <motion.div 
          key="error"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-12 rounded-[3rem] border-red-500/20 text-center space-y-6 w-full"
        >
          <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black uppercase tracking-tighter">Verification Failed</h2>
            <p className="text-muted-foreground font-medium">{error || 'Could not fetch blockchain data.'}</p>
          </div>
          <Button onClick={() => window.location.reload()} className="rounded-xl font-bold uppercase tracking-widest bg-white/5 border border-white/10 h-12 px-6">Retry Audit</Button>
        </motion.div>
      ) : receipt && (
        <motion.div 
          key="receipt"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full space-y-6"
        >
          {/* Status Banner */}
          <div className="glass p-4 rounded-3xl border-emerald-500/20 bg-emerald-500/5 flex items-center justify-center gap-3">
            <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <p className="text-xs md:text-sm font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Authentic Proof of Purchase</p>
          </div>

          {/* Main Receipt Card */}
          <div className="glass rounded-[3rem] shadow-2xl border-white/10 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-indigo-500 to-emerald-500" />
            
            <div className="p-8 md:p-12 space-y-10">
              {/* Header */}
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 rounded-[2rem] bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                  <ShoppingBag className="w-10 h-10" strokeWidth={1.5} />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase italic leading-none">
                    {receipt.itemName.replace(/^\[.*?\]\s*/, '')}
                  </h1>
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest opacity-60">
                      {receipt.itemName.match(/^\[(.*?)\]/) ? receipt.itemName.match(/^\[(.*?)\]/)[1] : 'Retail Asset'}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest">
                      ID #000{receipt.id.toString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="h-px bg-white/10 w-full" />

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-8 md:gap-12">
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50">Transaction Amount</p>
                  <p className="text-2xl md:text-3xl font-black text-primary italic">
                    {receipt.currency} {formatEther(receipt.amount)}
                  </p>
                </div>
                <div className="space-y-1.5 text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50">Date of Issue</p>
                  <p className="text-sm md:text-base font-bold">
                    {new Date(Number(receipt.issueTimestamp) * 1000).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              {/* Blockchain Details Section */}
              <div className="space-y-6 pt-2">
                <div className="p-6 rounded-[2rem] bg-white/5 border border-white/10 space-y-5">
                  <div className="flex items-center gap-3 text-emerald-500">
                    <ShieldCheck className="w-5 h-5" />
                    <h3 className="text-xs font-black uppercase tracking-widest">On-Chain Audit Summary</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground font-medium">Customer Wallet</span>
                      <span className="font-mono opacity-80">{customerAddress.slice(0, 6)}...{customerAddress.slice(-4)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground font-medium">Verification Status</span>
                      <span className="text-emerald-500 font-bold flex items-center gap-1.5">
                        <Lock className="w-3 h-3" /> Encrypted & Valid
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground font-medium">Network</span>
                      <span className="font-bold flex items-center gap-1.5">
                        <Leaf className="w-3 h-3 text-emerald-500" /> Sepolia PoS Hub
                      </span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Cloud Proof IPFS Hash</p>
                    <div className="bg-black/20 p-4 rounded-2xl font-mono text-[10px] break-all opacity-60 leading-relaxed">
                      {receipt.ipfsHash}
                    </div>
                  </div>
                </div>

                {/* Warranty Section */}
                {Number(receipt.warrantyExpiryTimestamp) > 0 && (
                  <div className={cn(
                    "p-6 rounded-[2rem] border transition-all",
                    Number(receipt.warrantyExpiryTimestamp) * 1000 > Date.now()
                      ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                      : "bg-red-500/10 border-red-500/20 text-red-500"
                  )}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5" />
                        <h3 className="text-xs font-black uppercase tracking-widest">Warranty Protection</h3>
                      </div>
                      <span className="text-[10px] font-black px-2 py-1 rounded-md bg-white/10 uppercase tracking-tighter">
                        {Number(receipt.warrantyExpiryTimestamp) * 1000 > Date.now() ? 'Active' : 'Expired'}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-lg md:text-xl font-black italic">
                        {Number(receipt.warrantyExpiryTimestamp) * 1000 > Date.now() 
                          ? `${Math.floor((Number(receipt.warrantyExpiryTimestamp) - Date.now()/1000) / 86400)} Days Remaining` 
                          : 'Coverage Ended'}
                      </p>
                      <p className="text-[10px] opacity-70 uppercase font-bold tracking-widest">
                        Expires on {new Date(Number(receipt.warrantyExpiryTimestamp) * 1000).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button 
                  className="flex-1 h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20"
                  onClick={() => window.open(`https://gateway.pinata.cloud/ipfs/${receipt.ipfsHash}`, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Original Bill
                </Button>
                <Button 
                  variant="outline"
                  className="flex-1 h-14 rounded-2xl glass border-white/20 font-black uppercase tracking-widest"
                  onClick={() => window.open(`https://sepolia.etherscan.io/address/${ECO_RECEIPT_ADDRESS}`, '_blank')}
                >
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Audit on Etherscan
                </Button>
              </div>
            </div>

            <div className="p-6 bg-white/5 border-t border-white/10 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-30">EcoReceipt Protocol v1.0 • Decentralized POS Standard</p>
            </div>
          </div>

          <div className="flex justify-center pt-8">
             <Button 
                variant="link" 
                className="text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-emerald-500"
                onClick={() => window.location.href = '/'}
             >
               Back to Dashboard
             </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function ReceiptVerificationPage() {
  return (
    <div className="relative min-h-screen bg-background flex flex-col pt-24 pb-12 overflow-hidden">
      <div className="mesh-gradient opacity-40" aria-hidden="true" />
      <Navigation />

      <main className="flex-1 flex flex-col items-center justify-start p-4 md:p-6 relative z-10 w-full max-w-2xl mx-auto">
        <Suspense fallback={<div className="py-24 text-center">Loading verification context...</div>}>
          <VerificationContent />
        </Suspense>
      </main>
    </div>
  );
}
