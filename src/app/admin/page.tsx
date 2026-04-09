'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, ShieldCheck, KeyRound, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
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
    industry: string;
    taxId: string;
    status: string;
    appliedAt: string;
}

interface ApprovedPartner {
    walletAddress: string;
    businessName: string;
    email: string;
    industry: string;
    taxId: string;
    approvedAt: number;
}

export default function AdminDashboard() {
    const { address, isConnected } = useAccount();
    const [franchiseAddress, setFranchiseAddress] = useState('');
    const [mounted, setMounted] = useState(false);
    const [pendingPartners, setPendingPartners] = useState<PendingPartner[]>([]);
    const [approvedPartners, setApprovedPartners] = useState<ApprovedPartner[]>([]);
    const [activePartnerId, setActivePartnerId] = useState<string | null>(null);
    const [isRevoking, setIsRevoking] = useState(false);
    const [revokingAddress, setRevokingAddress] = useState('');
    const [isSyncing, setIsSyncing] = useState(false);

    const fetchApplications = async () => {
        try {
            const res = await fetch('/api/applications');
            const data = await res.json();
            if (res.ok) setPendingPartners(data);
        } catch (e) {
            console.error('Fetch Error:', e);
        }
    };

    const fetchPartners = async () => {
        try {
            const res = await fetch('/api/partners');
            const data = await res.json();
            if (res.ok) setApprovedPartners(data);
        } catch (e) {
            console.error('Fetch Partners Error:', e);
        }
    };

    useEffect(() => {
        setMounted(true);
        fetchApplications();
        fetchPartners();
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

    const { 
        writeContract, 
        data: hash, 
        isPending 
    } = useWriteContract({
        mutation: {
            onSuccess: (hash) => {
                toast.success('Transaction submitted!', {
                    description: `Hash: ${hash.slice(0, 10)}...`
                });
            },
            onError: (error) => {
                toast.error(`Transaction failed: ${error.message.split('\n')[0]}`);
            }
        }
    });

    // Write contract for revokeRole
    const { 
        writeContract: revokeRole, 
        data: revokeHash, 
        isPending: isRevokingPending 
    } = useWriteContract({
        mutation: {
            onSuccess: (hash) => {
                toast.success('Revocation submitted!', {
                    description: `Hash: ${hash.slice(0, 10)}...`
                });
            },
            onError: (error) => {
                toast.error(`Revocation failed: ${error.message.split('\n')[0]}`);
            }
        }
    });

    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
        hash,
    });

    const { isLoading: isRevokeConfirming, isSuccess: isRevokeConfirmed } = useWaitForTransactionReceipt({
        hash: revokeHash,
    });

    useEffect(() => {
        if (isConfirmed) {
            toast.success('Retailer Role granted successfully!', {
                description: `Franchise wallet: ${franchiseAddress.slice(0, 6)}...${franchiseAddress.slice(-4)}`,
            });
            
            const cleanup = async () => {
                if (franchiseAddress) {
                    const partner = pendingPartners.find(p => p.walletAddress.toLowerCase() === franchiseAddress.toLowerCase());
                    
                    // 1. Add to Approved Partners
                    if (partner) {
                        await fetch('/api/partners', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(partner)
                        });
                    }

                    // 2. Remove from Applications
                    await fetch(`/api/applications?address=${franchiseAddress}`, { method: 'DELETE' });
                    
                    // 3. Force multiple refreshes to ensure Redis consistency
                    fetchApplications();
                    fetchPartners();
                    setTimeout(() => {
                        fetchApplications();
                        fetchPartners();
                    }, 1000);
                }
                setActivePartnerId(null);
                setFranchiseAddress('');
            };

            cleanup();
        }
    }, [isConfirmed, franchiseAddress, pendingPartners]);

    useEffect(() => {
        if (isRevokeConfirmed) {
            toast.success('Retailer Role revoked successfully!');
            
            const cleanupRevoke = async () => {
                if (revokingAddress) {
                    await fetch(`/api/partners?address=${revokingAddress}`, { method: 'DELETE' });
                    fetchPartners();
                    setTimeout(() => fetchPartners(), 1000);
                }
                setRevokingAddress('');
            };

            cleanupRevoke();
        }
    }, [isRevokeConfirmed, revokingAddress]);

    const handleGrantRole = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!franchiseAddress || !franchiseAddress.startsWith('0x') || franchiseAddress.length !== 42) {
            toast.error('Invalid address format.');
            return;
        }

        writeContract({
            address: ECO_RECEIPT_ADDRESS as `0x${string}`,
            abi: ECO_RECEIPT_ABI,
            functionName: 'grantRole',
            args: [RETAILER_ROLE as `0x${string}`, franchiseAddress as `0x${string}`],
        });
    };

    const handleUpdatePartner = async (partner: ApprovedPartner) => {
        const name = prompt(`Update Business Name for ${partner.walletAddress}:`, partner.businessName);
        if (!name) return;
        
        const industry = prompt(`Update Industry (Small/Big Shop, Mall, Franchise, Industry):`, partner.industry);
        if (!industry) return;

        const taxId = prompt(`Update Tax ID:`, partner.taxId);
        if (!taxId) return;

        const email = prompt(`Update Email:`, partner.email);
        if (!email) return;

        try {
            await fetch('/api/partners', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...partner,
                    businessName: name,
                    industry,
                    taxId,
                    email
                })
            });
            toast.success("Partner details updated!");
            fetchPartners();
        } catch (e) {
            toast.error("Failed to update partner.");
        }
    };

    const handleRevokeRole = (address: string) => {
        setRevokingAddress(address);
        revokeRole({
            address: ECO_RECEIPT_ADDRESS as `0x${string}`,
            abi: ECO_RECEIPT_ABI,
            functionName: 'revokeRole',
            args: [RETAILER_ROLE as `0x${string}`, address as `0x${string}`],
        });
    };

    const publicClient = usePublicClient();

    const handleSync = async () => {
        if (!publicClient) return;
        setIsSyncing(true);
        try {
            toast.info("Scanning blockchain for retailer roles...");
            
            // 1. Get all RoleGranted events for RETAILER_ROLE
            // Standard AccessControl RoleGranted topic
            const ROLE_GRANTED_TOPIC = "0x2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d"; // keccak256("RoleGranted(bytes32,address,address)")
            
            const latestBlock = await publicClient.getBlockNumber();
            const SCAN_RANGE = BigInt(300000); // Scan last 300,000 blocks (~3-4 weeks on Sepolia)
            const CHUNK_SIZE = BigInt(1000);
            
            let allLogs: any[] = [];
            let toBlock = latestBlock;
            let fromBlock = toBlock - CHUNK_SIZE + BigInt(1);

            toast.info(`Deep scan initiated... searching last 300,000 blocks.`);

            const totalSteps = Number(SCAN_RANGE / CHUNK_SIZE);
            let currentStep = 0;

            while (toBlock > latestBlock - SCAN_RANGE && toBlock > BigInt(0)) {
                if (fromBlock < BigInt(0)) fromBlock = BigInt(0);
                
                // Use a standard loader toast for progress
                if (currentStep % 50 === 0 && currentStep > 0) {
                    toast.info(`Scanning progress: ${Math.round((currentStep / totalSteps) * 100)}%`);
                }

                const logs = await publicClient.getLogs({
                    address: ECO_RECEIPT_ADDRESS as `0x${string}`,
                    event: {
                        type: 'event',
                        name: 'RoleGranted',
                        inputs: [
                            { indexed: true, name: 'role', type: 'bytes32' },
                            { indexed: true, name: 'account', type: 'address' },
                            { indexed: true, name: 'sender', type: 'address' },
                        ]
                    },
                    args: {
                        role: RETAILER_ROLE as `0x${string}`
                    },
                    fromBlock,
                    toBlock
                });

                allLogs = [...allLogs, ...logs];
                
                // Move to next chunk
                toBlock = fromBlock - BigInt(1);
                fromBlock = toBlock - CHUNK_SIZE + BigInt(1);
                currentStep++;
            }

            const uniqueAddresses = Array.from(new Set(allLogs.map(log => log.args.account?.toLowerCase())));
            
            // 2. Cross-reference with existing partners in Redis
            const existingAddresses = new Set(approvedPartners.map(p => p.walletAddress.toLowerCase()));
            const missingAddresses = uniqueAddresses.filter(addr => addr && !existingAddresses.has(addr as string));

            toast.success(`Found ${missingAddresses.length} untracked partners! Reconciling metadata...`);
            
            // 3. Fetch existing application data (pending and history) for recovery
            const [pendingRes, historyRes] = await Promise.all([
                fetch('/api/applications'),
                fetch('/api/applications?history=true')
            ]);
            const pendingApps: any[] = await pendingRes.json();
            const historyApps: any[] = await historyRes.json();
            const allApps = [...pendingApps, ...historyApps];

            // 4. Register missing partners with real data if found, otherwise placeholders
            for (const addr of missingAddresses) {
                const matchedApp = allApps.find(app => (app.walletAddress || app.id)?.toLowerCase() === addr.toLowerCase());
                
                const partnerData = matchedApp ? {
                    walletAddress: addr,
                    businessName: matchedApp.businessName,
                    industry: matchedApp.industry,
                    taxId: matchedApp.taxId,
                    email: matchedApp.email
                } : {
                    walletAddress: addr,
                    businessName: "Legacy Partner",
                    industry: "Sync Recovered",
                    taxId: "PENDING-SYNC",
                    email: "sync@ecoreceipt.com"
                };

                await fetch('/api/partners', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(partnerData)
                });

                // If it was in pending but we're syncing it as approved, clean it up from pending
                if (matchedApp && pendingApps.some(app => (app.walletAddress || app.id)?.toLowerCase() === addr.toLowerCase())) {
                    await fetch(`/api/applications?address=${addr}`, { method: 'DELETE' });
                }
            }
            fetchPartners();
            fetchApplications();
        } catch (e) {
            console.error("Sync Error:", e);
            toast.error("Failed to sync with blockchain.");
        } finally {
            setIsSyncing(false);
        }
    };

    const handleReject = async (partner: PendingPartner) => {
        const reason = prompt(`Enter rejection reason for ${partner.businessName}:`, "Missing or invalid Tax ID.");
        if (reason === null) return; // Cancelled

        try {
            await fetch(`/api/applications?address=${partner.walletAddress}`, { method: 'DELETE' });
            toast.info(`Application rejected: ${reason}`);
            fetchApplications();
        } catch (e) {
            toast.error("Failed to reject application.");
        }
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
                                                    <div className="flex gap-2 mt-1">
                                                        <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 py-1 px-2 rounded-md">{partner.industry}</span>
                                                        <span className="text-[10px] font-black uppercase tracking-widest bg-slate-500/10 text-slate-500 py-1 px-2 rounded-md">{partner.taxId}</span>
                                                    </div>
                                                    <p className="text-xs tracking-widest uppercase font-bold text-muted-foreground mt-2">{partner.email}</p>
                                                </div>
                                                <span className="text-[10px] whitespace-nowrap font-black uppercase tracking-widest bg-indigo-500/10 text-indigo-500 py-1.5 px-3 rounded-full">Pending</span>
                                            </div>
                                            <div className="font-mono text-xs text-muted-foreground bg-black/20 p-3 rounded-xl break-all font-medium border border-white/5">
                                                {partner.walletAddress}
                                            </div>
                                            <div className="pt-2 flex gap-3">
                                                <Button 
                                                    variant="secondary"
                                                    className="flex-1 h-14 rounded-xl font-black uppercase tracking-widest text-xs bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-500 transition-colors select-none"
                                                    disabled={isPending || isConfirming}
                                                    onClick={() => {
                                                        setFranchiseAddress(partner.walletAddress);
                                                        setActivePartnerId(partner.id);
                                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                                    }}
                                                >
                                                    {activePartnerId === partner.id ? 'Selected' : 'Select'}
                                                </Button>
                                                <Button 
                                                    variant="ghost"
                                                    className="h-14 px-6 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-destructive/10 hover:text-destructive transition-colors"
                                                    disabled={isPending || isConfirming}
                                                    onClick={() => handleReject(partner)}
                                                >
                                                    Reject
                                                </Button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>

                    {/* Approved Partners Section */}
                    <div className="mt-20 space-y-8">
                        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                            <div className="space-y-2">
                                <h2 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-3">
                                    Approved Business Accounts
                                    {approvedPartners.length > 0 && <span className="bg-emerald-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-lg shadow-emerald-500/20">{approvedPartners.length}</span>}
                                </h2>
                                <p className="text-muted-foreground font-medium mt-2">Manage active retailers and revoke access if necessary.</p>
                            </div>
                            
                            <Button 
                                onClick={handleSync}
                                disabled={isSyncing}
                                className="h-14 px-8 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-xs font-black uppercase tracking-widest gap-2 backdrop-blur-sm self-stretch md:self-auto transition-all shadow-xl shadow-indigo-500/5 group"
                            >
                                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''} text-indigo-500`} />
                                {isSyncing ? 'Syncing with Chain...' : 'Sync with Blockchain'}
                            </Button>
                        </header>

                        {approvedPartners.length === 0 ? (
                            <div className="glass p-16 rounded-[3rem] text-center border-dashed border-2 border-white/10">
                                <p className="text-muted-foreground font-bold text-xl opacity-40">No approved partners yet.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {approvedPartners.map(partner => (
                                    <motion.div 
                                        layout
                                        key={partner.walletAddress}
                                        className="glass p-8 rounded-[2.5rem] border border-white/10 shadow-xl space-y-6 relative overflow-hidden group"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-xl font-bold truncate max-w-[180px]">{partner.businessName}</h3>
                                                <div className="flex gap-2 mt-1">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest py-1 px-2 rounded-md ${partner.industry === 'Sync Recovered' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                                        {partner.industry}
                                                    </span>
                                                </div>
                                            </div>
                                            <OnChainBadge address={partner.walletAddress} />
                                        </div>

                                        <div className="space-y-3">
                                            <div className="font-mono text-[10px] text-muted-foreground bg-black/20 p-3 rounded-xl break-all font-medium border border-white/5">
                                                {partner.walletAddress}
                                            </div>
                                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
                                                <span>{partner.email}</span>
                                                <span>ID: {partner.taxId}</span>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button 
                                                variant="ghost" 
                                                className="flex-1 h-14 rounded-2xl bg-white/5 hover:bg-white/10 transition-all font-black uppercase tracking-widest text-xs border border-white/10"
                                                onClick={() => handleUpdatePartner(partner)}
                                            >
                                                Update Profile
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                className="flex-1 h-14 rounded-2xl bg-destructive/5 hover:bg-destructive hover:text-white transition-all font-black uppercase tracking-widest text-xs border border-destructive/10"
                                                onClick={() => handleRevokeRole(partner.walletAddress)}
                                                disabled={isRevokeConfirming || (isRevokingPending && revokingAddress === partner.walletAddress)}
                                            >
                                                {isRevokingPending && revokingAddress === partner.walletAddress ? (
                                                    <div className="flex items-center gap-2">
                                                        <Loader2 className="w-4 h-4 animate-spin" /> Revoking...
                                                    </div>
                                                ) : isRevokeConfirming && revokingAddress === partner.walletAddress ? (
                                                    <div className="flex items-center gap-2">
                                                        <Loader2 className="w-4 h-4 animate-spin" /> Finalizing...
                                                    </div>
                                                ) : (
                                                    "Revoke"
                                                )}
                                            </Button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </div>
    );
}

function OnChainBadge({ address }: { address: string }) {
    const { data: hasRole, isLoading } = useReadContract({
        address: ECO_RECEIPT_ADDRESS as `0x${string}`,
        abi: ECO_RECEIPT_ABI,
        functionName: 'hasRole',
        args: [RETAILER_ROLE, address as `0x${string}`],
    });

    if (isLoading) return (
        <div className="w-10 h-10 rounded-full bg-slate-500/10 flex items-center justify-center text-slate-500 border border-slate-500/20">
            <Loader2 className="w-4 h-4 animate-spin" />
        </div>
    );

    return hasRole ? (
        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-lg shadow-emerald-500/5" title="Verified On-chain">
            <ShieldCheck className="w-5 h-5" />
        </div>
    ) : (
        <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center text-destructive border border-destructive/20 shadow-lg shadow-destructive/5" title="Access Revoked On-chain">
            <AlertTriangle className="w-5 h-5" />
        </div>
    );
}
