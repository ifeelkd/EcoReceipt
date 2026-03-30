'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, ShieldCheck, KeyRound, Loader2 } from 'lucide-react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ECO_RECEIPT_ABI, ECO_RECEIPT_ADDRESS, DEFAULT_ADMIN_ROLE, RETAILER_ROLE } from '@/lib/constants';
import { ConnectButton } from '@/components/ConnectButton';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface PendingPartner {
    id: string;
    businessName: string;
    email: string;
    walletAddress: string;
    status: string;
    appliedAt: string;
}

export default function AdminDashboard() {
    const { address, isConnected } = useAccount();
    const [franchiseAddress, setFranchiseAddress] = useState('');
    const [mounted, setMounted] = useState(false);
    const [pendingPartners, setPendingPartners] = useState<PendingPartner[]>([]);
    const [activePartnerId, setActivePartnerId] = useState<string | null>(null);

    const fetchApplications = async () => {
        try {
            const res = await fetch('/api/applications');
            const data = await res.json();
            if (res.ok) setPendingPartners(data);
        } catch (e) {
            console.error('Fetch Error:', e);
        }
    };

    useEffect(() => {
        setMounted(true);
        fetchApplications();
    }, []);

    // Check if connected wallet has Admin role
    const { data: isAdmin, isLoading: isCheckingAdmin } = useReadContract({
        address: ECO_RECEIPT_ADDRESS as `0x${string}`,
        abi: ECO_RECEIPT_ABI,
        functionName: 'hasRole',
        args: [DEFAULT_ADMIN_ROLE, address as `0x${string}`],
        query: {
            enabled: isConnected && !!address,
        }
    });

    // Write contract for grantRole
    const { 
        writeContract, 
        data: hash, 
        isPending 
    } = useWriteContract({
        mutation: {
            onSuccess: () => {
                toast.success('Transaction submitted! Waiting for confirmation...');
            },
            onError: (error) => {
                toast.error(`Transaction failed: ${error.message.split('\n')[0]}`);
            }
        }
    });

    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
        hash,
    });

    useEffect(() => {
        if (isConfirmed) {
            toast.success('Retailer Role granted successfully!', {
                description: `Franchise wallet: ${franchiseAddress.slice(0, 6)}...${franchiseAddress.slice(-4)}`,
            });
            
            // Clean up Vercel KV
            const cleanup = async () => {
                if (franchiseAddress) {
                    await fetch(`/api/applications?address=${franchiseAddress}`, { method: 'DELETE' });
                    fetchApplications();
                }
                setActivePartnerId(null);
                setFranchiseAddress('');
            };

            cleanup();
        }
    }, [isConfirmed, franchiseAddress]);

    const handleGrantRole = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!franchiseAddress || !franchiseAddress.startsWith('0x') || franchiseAddress.length !== 42) {
            toast.error('Invalid address format. Please enter a valid Ethereum address.');
            return;
        }

        writeContract({
            address: ECO_RECEIPT_ADDRESS as `0x${string}`,
            abi: ECO_RECEIPT_ABI,
            functionName: 'grantRole',
            args: [RETAILER_ROLE as `0x${string}`, franchiseAddress as `0x${string}`],
        });
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 md:px-8 max-w-7xl mx-auto flex items-center justify-center">
            
            {/* Background elements */}
            <div className="absolute inset-0 bg-slate-50 dark:bg-slate-950 -z-10 transition-colors" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-200 via-slate-50 to-slate-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950 -z-10" />

            {!isConnected ? (
                // NOT CONNECTED STATE
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass dark:bg-slate-900/60 p-10 rounded-[3rem] text-center max-w-lg w-full flex flex-col items-center gap-6 shadow-2xl"
                >
                    <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 mb-2">
                        <KeyRound className="w-10 h-10" strokeWidth={1.5} />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter">ADMIN <span className="text-slate-400">ACCESS</span></h1>
                    <p className="text-muted-foreground text-lg">Connect your admin wallet to manage platform roles and permissions.</p>
                    <ConnectButton className="h-14 px-10 text-lg rounded-2xl w-full mt-4" />
                </motion.div>
            ) : isCheckingAdmin ? (
                // CHECKING ROLE STATE
                <div className="flex flex-col items-center gap-4 text-muted-foreground">
                    <Loader2 className="w-10 h-10 animate-spin" />
                    <p className="font-bold tracking-widest uppercase text-sm">Verifying Credentials...</p>
                </div>
            ) : !isAdmin ? (
                // ACCESS DENIED STATE
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass dark:bg-slate-900/60 p-10 rounded-[3rem] text-center max-w-lg w-full flex flex-col items-center gap-6 border-destructive/20 shadow-2xl shadow-destructive/10"
                >
                    <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mb-2">
                        <ShieldAlert className="w-10 h-10" strokeWidth={1.5} />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-destructive">ACCESS DENIED</h1>
                    <p className="text-muted-foreground text-lg">Your connected wallet does not have the required <span className="font-mono text-xs bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded mx-1">DEFAULT_ADMIN_ROLE</span>.</p>
                </motion.div>
            ) : (
                // ADMIN AUTHORIZED STATE
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-6xl"
                >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
                    
                        <div className="glass dark:bg-slate-900/60 p-8 md:p-12 rounded-[3rem] shadow-2xl border dark:border-white/10 relative overflow-hidden order-2 lg:order-1">
                        
                        {/* Status Badge */}
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20 uppercase tracking-widest mb-6">
                            <ShieldCheck className="w-3.5 h-3.5" strokeWidth={1.5} />
                            Admin Access Verified
                        </div>

                        <header className="mb-10">
                            <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-[1.1] uppercase mb-4">
                                Role <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-emerald-300">Manager.</span>
                            </h1>
                            <p className="text-muted-foreground text-lg md:text-xl font-medium max-w-lg">
                                Authorize new franchise wallets to issue digital receipts on the EcoReceipt network.
                            </p>
                        </header>

                        <form onSubmit={handleGrantRole} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold tracking-widest uppercase text-muted-foreground ml-2">Franchise Wallet Address</label>
                                <div className="relative">
                                    <input 
                                        type="text"
                                        placeholder="0x..."
                                        value={franchiseAddress}
                                        onChange={(e) => setFranchiseAddress(e.target.value)}
                                        className="w-full h-16 rounded-2xl bg-white/50 dark:bg-black/20 border-2 border-transparent focus:border-emerald-500/50 outline-none px-6 text-lg font-mono placeholder:text-muted-foreground/50 transition-all font-medium backdrop-blur-sm"
                                        disabled={isPending || isConfirming}
                                    />
                                </div>
                            </div>

                            <motion.div 
                                whileHover={{ scale: 1.02, y: -1 }}
                                whileTap={{ scale: 0.98 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                            >
                                <Button 
                                    type="submit" 
                                    className="w-full h-16 bg-emerald-500 hover:bg-emerald-600 dark:hover:bg-emerald-400 text-white text-lg font-black rounded-2xl shadow-xl shadow-emerald-500/20 disabled:opacity-50 transition-colors"
                                    disabled={!franchiseAddress || isPending || isConfirming}
                                >
                                    {isPending ? (
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="w-5 h-5 animate-spin" /> Awaiting Signature...
                                        </div>
                                    ) : isConfirming ? (
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="w-5 h-5 animate-spin" /> Confirming on chain...
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <KeyRound className="w-5 h-5" strokeWidth={1.5} />
                                            Grant Retailer Role
                                        </div>
                                    )}
                                </Button>
                            </motion.div>
                        </form>
                    </div>

                        <div className="space-y-6 order-1 lg:order-2">
                            <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                                Partner Applications
                                {pendingPartners.length > 0 && <span className="bg-indigo-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">{pendingPartners.length}</span>}
                            </h2>
                            
                            {pendingPartners.length === 0 ? (
                                <div className="glass p-12 rounded-[2.5rem] text-center border-dashed border-2 border-white/20">
                                    <p className="text-muted-foreground font-bold text-lg">No pending applications.</p>
                                    <p className="text-sm mt-2 font-medium opacity-60">Applications submitted from the Partner Portal will appear here.</p>
                                </div>
                            ) : (
                                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                    {pendingPartners.map(partner => (
                                        <motion.div 
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            key={partner.id} 
                                            className={`glass p-6 md:p-8 rounded-[2rem] shadow-xl border space-y-4 relative overflow-hidden group transition-all ${activePartnerId === partner.id ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/10'}`}
                                        >
                                            <div className="flex justify-between items-start gap-4">
                                                <div>
                                                    <h3 className="text-xl font-bold">{partner.businessName}</h3>
                                                    <p className="text-xs tracking-widest uppercase font-bold text-muted-foreground mt-1">{partner.email}</p>
                                                </div>
                                                <span className="text-[10px] whitespace-nowrap font-black uppercase tracking-widest bg-indigo-500/10 text-indigo-500 py-1.5 px-3 rounded-full">Pending</span>
                                            </div>
                                            <div className="font-mono text-xs text-muted-foreground bg-black/20 p-3 rounded-xl break-all font-medium border border-white/5">
                                                {partner.walletAddress}
                                            </div>
                                            <div className="pt-2">
                                                <Button 
                                                    variant="secondary"
                                                    className="w-full h-14 rounded-xl font-black uppercase tracking-widest text-xs bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-500 transition-colors select-none"
                                                    disabled={isPending || isConfirming}
                                                    onClick={() => {
                                                        setFranchiseAddress(partner.walletAddress);
                                                        setActivePartnerId(partner.id);
                                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                                    }}
                                                >
                                                    {activePartnerId === partner.id ? 'Selected for Approval' : 'Select to Approve'}
                                                </Button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>
                </motion.div>
            )}
        </div>
    );
}
