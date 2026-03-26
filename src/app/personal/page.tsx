'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LayoutGrid, List, Search, Filter, Wallet, ShoppingBag, TrendingUp, ShieldCheck, Clock, UploadCloud, Download, FileText, CheckCircle2 } from 'lucide-react';
import { useReceipts } from '@/hooks/useReceipts';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@/components/ConnectButton';
import { formatCurrency, SUPPORTED_CURRENCIES } from '@/lib/currency';
import { motion, AnimatePresence } from 'framer-motion';
import { formatEther } from 'viem';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { uploadFileToPinata, uploadJSONToPinata } from '@/app/actions/pinata';
import { useIssueReceipt } from '@/hooks/useReceipts';

export default function PersonalPage() {
  const { isConnected, address } = useAccount();
  const { receipts, isLoading } = useReceipts();
  const { issue, isPending, isConfirming, isSuccess, error } = useIssueReceipt();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'amount_high' | 'amount_low'>('newest');
  const [isDigitizeOpen, setIsDigitizeOpen] = useState(false);
  const [digitizeFile, setDigitizeFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Monitor Minting State
  React.useEffect(() => {
    if (isPending) toast.loading("Broadcasting Record...", { id: "digitize-tx" });
    if (isConfirming) toast.loading("Securing Digital Receipt...", { id: "digitize-tx" });
    if (isSuccess) {
        toast.dismiss("digitize-tx");
        toast.success("Successfully Uploaded & Minted!", { duration: 5000 });
        setIsDigitizeOpen(false);
        setDigitizeFile(null);
    }
    if (error) toast.error(`Error: ${error.message.slice(0, 50)}...`, { id: "digitize-tx" });
  }, [isPending, isConfirming, isSuccess, error]);

  // Spending Summary Calculation
  const spendingSummary = useMemo(() => {
    if (!receipts) return [];
    const totals: Record<string, number> = {};
    
    (receipts as any[]).forEach((r) => {
        const amt = parseFloat(formatEther(r.amount));
        const curr = r.currency || 'USD';
        totals[curr] = (totals[curr] || 0) + amt;
    });

    return Object.entries(totals).map(([code, amount]) => ({
        code,
        amount,
        symbol: SUPPORTED_CURRENCIES.find(c => c.code === code)?.symbol || '$'
    }));
  }, [receipts]);

  // Sorting and Filtering
  const processedReceipts = useMemo(() => {
    if (!receipts) return [];
    
    let filtered = (receipts as any[]).filter((r) => 
        r.itemName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    filtered.sort((a, b) => {
        const timeA = Number(a.issueTimestamp);
        const timeB = Number(b.issueTimestamp);
        const amtA = parseFloat(formatEther(a.amount));
        const amtB = parseFloat(formatEther(b.amount));

        switch(sortBy) {
            case 'newest': return timeB - timeA;
            case 'oldest': return timeA - timeB;
            case 'amount_high': return amtB - amtA;
            case 'amount_low': return amtA - amtB;
            default: return timeB - timeA;
        }
    });

    return filtered;
  }, [receipts, searchQuery, sortBy]);

  // Export to CSV
  const exportToCSV = () => {
      if (!processedReceipts.length) return toast.error("No records to export.");
      
      const headers = ["Item Name", "Amount", "Currency", "Issue Date", "Warranty Expiry", "Returned", "IPFS Hash"];
      const rows = processedReceipts.map(r => [
          r.itemName,
          formatEther(r.amount),
          r.currency,
          new Date(Number(r.issueTimestamp) * 1000).toISOString(),
          new Date(Number(r.warrantyExpiryTimestamp) * 1000).toISOString(),
          r.isReturned ? "Yes" : "No",
          r.ipfsHash
      ]);

      const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `eco_vault_export_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Vault exported successfully.");
  };

  // Dropzone setup
  const onDrop = useCallback((acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
          setDigitizeFile(acceptedFiles[0]);
          toast.success(`Image "${acceptedFiles[0].name}" queued for digitization.`);
      }
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: {'image/*': []}, maxFiles: 1 });

  const handleUploadAndMint = async () => {
      if (!digitizeFile || !address) return;
      setIsUploading(true);

      const fileData = new FormData();
      fileData.append("file", digitizeFile);
      fileData.append("itemName", "Digitized Paper Receipt");

      const uploadRes = await uploadFileToPinata(fileData);
      if (!uploadRes.success) {
          setIsUploading(false);
          return toast.error("File upload failed.");
      }

      const metadata = {
          itemName: "Digitized Paper Receipt",
          amount: "0",
          currency: "USD",
          category: "Other",
          warrantyExpiryTimestamp: Math.floor(Date.now() / 1000) + 86400 * 365, // 1 yr default
          timestamp: Date.now(),
          issuer: address,
          attachedFile: `ipfs://${uploadRes.ipfsHash}`
      };

      const ipfsResult = await uploadJSONToPinata(metadata);
      setIsUploading(false);

      if (!ipfsResult.success) {
          return toast.error("Cloud Proof failed. Backup error.");
      }

      issue(
          address as `0x${string}`,
          "0",
          "USD",
          "Digitized Paper Receipt",
          Math.floor(Date.now() / 1000) + 86400 * 365,
          ipfsResult.ipfsHash!
      );
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background pb-20 pt-20">
        <Navigation />
        <main className="max-w-7xl mx-auto px-6 py-32 text-center space-y-8">
            <div className="w-24 h-24 bg-emerald-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto text-emerald-500 shadow-xl border border-emerald-500/20">
                <Wallet className="w-12 h-12" />
            </div>
            <div className="space-y-4">
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase">Activate Your Vault.</h1>
                <p className="text-muted-foreground text-lg max-w-md mx-auto font-medium">Connect your Digital ID to view your verified Proof of Purchase history and active warranties.</p>
            </div>
            <div className="flex justify-center pt-4">
                <ConnectButton className="h-14 px-10 text-lg rounded-2xl" />
            </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32 md:pb-12 overflow-x-hidden pt-20">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12 space-y-8 md:space-y-12">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-black border border-emerald-500/20 uppercase tracking-widest leading-none">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Vault Secured
                </div>
                <h1 className="text-4xl md:text-7xl font-black tracking-tighter uppercase leading-[1.1]">
                    Digital <br />
                    <span className="text-emerald-500">Vault.</span>
                </h1>
                <p className="text-muted-foreground text-lg font-medium max-w-md">Your lifetime decentralized home for all purchase records.</p>
            </div>

            {/* Spending Summary Widget */}
            <div className="grid grid-cols-2 gap-3 md:flex md:items-center">
                {spendingSummary.length > 0 ? spendingSummary.map((s) => (
                    <div key={s.code} className="glass p-4 md:px-6 md:py-4 rounded-[2rem] border-white/20 shadow-xl flex flex-col items-start min-w-[140px]">
                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">Total Spent ({s.code})</p>
                        <p className="text-xl md:text-2xl font-black text-primary leading-none">
                            {s.symbol}{s.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </p>
                    </div>
                )) : (
                    <div className="glass p-4 rounded-[2rem] px-6 border-white/20 flex items-center gap-3">
                        <TrendingUp className="w-5 h-5 text-emerald-500" />
                        <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">No Records Found</span>
                    </div>
                )}
            </div>
        </div>

        {/* Dashboard Controls */}
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between sticky top-20 z-30 bg-background/80 backdrop-blur-md py-4 rounded-3xl">
            <div className="flex flex-1 gap-4 items-center">
                <div className="relative flex-1 max-w-md group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-all" />
                    <Input 
                        placeholder="Search your records..." 
                        className="pl-12 h-14 rounded-2xl bg-white/5 border-white/10 text-base font-medium focus:bg-white/10 transition-all shadow-inner"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                
                <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                    <SelectTrigger className="w-[180px] h-14 rounded-2xl bg-white/5 border-white/10 font-bold glass">
                        <SelectValue placeholder="Sort By" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="newest">Newest First</SelectItem>
                        <SelectItem value="oldest">Oldest First</SelectItem>
                        <SelectItem value="amount_high">Highest Amount</SelectItem>
                        <SelectItem value="amount_low">Lowest Amount</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center p-1.5 glass rounded-2xl border-white/10">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className={viewMode === 'list' ? 'bg-primary text-primary-foreground rounded-xl' : 'rounded-xl opacity-50'}
                        onClick={() => setViewMode('list')}
                    >
                        <List className="w-5 h-5" />
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className={viewMode === 'grid' ? 'bg-primary text-primary-foreground rounded-xl' : 'rounded-xl opacity-50'}
                        onClick={() => setViewMode('grid')}
                    >
                        <LayoutGrid className="w-5 h-5" />
                    </Button>
                </div>
                <Button 
                    variant="outline" 
                    className="h-14 rounded-2xl glass font-bold border-white/20 active:scale-95 transition-all text-xs"
                    onClick={exportToCSV}
                >
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                </Button>
                <Button 
                    variant="default" 
                    className="h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold active:scale-95 transition-all shadow-lg shadow-emerald-500/20 text-xs"
                    onClick={() => setIsDigitizeOpen(true)}
                >
                    <FileText className="w-4 h-4 mr-2" />
                    Digitize Paper
                </Button>
            </div>
        </div>

        {/* Digitize Modal */}
        <AnimatePresence>
            {isDigitizeOpen && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="fixed inset-0 z-50 bg-black/70 dark:bg-black/80 flex items-center justify-center p-4 backdrop-blur-md"
                    onClick={() => setIsDigitizeOpen(false)}
                >
                    <motion.div 
                        initial={{ scale: 0.92, y: 24, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.92, y: 24, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        onClick={(e) => e.stopPropagation()}
                        className="glass w-full max-w-lg rounded-[3rem] shadow-2xl p-8"
                    >
                        <h2 className="text-3xl font-black uppercase tracking-tighter mb-2">Digitize Receipt</h2>
                        <p className="text-muted-foreground font-medium mb-8">Upload a photo of a physical receipt to store it in your decentralized vault.</p>
                        
                        <div {...getRootProps()} className={`border-2 border-dashed rounded-[2rem] p-12 text-center cursor-pointer transition-all ${isDragActive ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/20 dark:border-white/10 hover:border-emerald-500/50 hover:bg-white/5'}`}>
                            <input {...getInputProps()} />
                            <UploadCloud className={`w-12 h-12 mx-auto mb-4 ${isDragActive ? 'text-emerald-500' : 'text-muted-foreground'}`} strokeWidth={1.5} />
                            {digitizeFile ? (
                                <p className="text-lg font-bold text-emerald-500">{digitizeFile.name} readied for Vault.</p>
                            ) : isDragActive ? (
                                <p className="text-lg font-bold text-emerald-500">Drop the image here...</p>
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-lg font-bold text-foreground/70">Drag & drop receipt image, or click to select</p>
                                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/50">Supports JPG, PNG, WEBP</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 flex justify-end gap-3">
                            <Button variant="ghost" className="rounded-xl px-6" onClick={() => setIsDigitizeOpen(false)}>Cancel</Button>
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
                                <Button 
                                    className="rounded-xl px-8 bg-emerald-500 hover:bg-emerald-600 text-white font-bold disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                                    onClick={handleUploadAndMint}
                                    disabled={!digitizeFile || isUploading || isPending || isConfirming}
                                >
                                    {isUploading ? "Uploading to Secure Cloud..." : 
                                     isPending ? "Waiting for Approval..." : 
                                     isConfirming ? "Minting to Vault..." : "Upload & Mint"}
                                </Button>
                            </motion.div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Content Area */}
        {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1,2,3].map(i => <div key={i} className="h-64 rounded-[2.5rem] bg-white/5 dark:bg-white/3 animate-pulse" />)}
            </div>
        ) : processedReceipts.length > 0 ? (
            <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8" : "space-y-4"}>
                {processedReceipts.map((receipt: any, idx: number) => {
                    const isWarrantyValid = Number(receipt.warrantyExpiryTimestamp) * 1000 > Date.now();
                    
                    return (
                        <motion.div
                            key={receipt.ipfsHash || idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.06, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                            whileHover={{ scale: 1.02, y: -2 }}
                            style={{ originX: 0.5, originY: 1 }}
                        >
                            <Card className="glass border-none shadow-xl rounded-[2.5rem] overflow-hidden group cursor-pointer" style={{ transition: 'box-shadow 0.3s ease' }}>
                                <div className={`h-1 w-full ${isWarrantyValid ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : 'bg-slate-400/50'}`} />
                                <CardHeader className="p-8 pb-4 flex flex-row items-start justify-between">
                                    <div className="space-y-1">
                                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                            isWarrantyValid
                                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                : 'bg-red-500/10 text-red-500'
                                        }`}>
                                            <span className={`w-1 h-1 rounded-full ${isWarrantyValid ? 'bg-emerald-500 animate-pulse' : 'bg-red-400'}`} />
                                            {isWarrantyValid ? 'Active Warranty' : 'Warranty Expired'}
                                        </div>
                                        <CardTitle className="text-2xl font-black uppercase tracking-tight leading-tight group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
                                            {receipt.itemName}
                                        </CardTitle>
                                        {receipt.isReturned && (
                                            <div className="text-xs font-bold text-yellow-500">Returned Item</div>
                                        )}
                                    </div>
                                    <motion.div
                                        className="w-12 h-12 rounded-2xl bg-white/5 dark:bg-white/5 flex items-center justify-center text-primary border border-white/10 shadow-lg"
                                        whileHover={{ scale: 1.15, rotate: 5 }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                    >
                                        <ShoppingBag className="w-6 h-6" strokeWidth={1.5} />
                                    </motion.div>
                                </CardHeader>
                                <CardContent className="p-8 pt-0 space-y-6">
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Proof Amount</p>
                                        <p className="text-3xl font-black text-emerald-500 dark:text-emerald-400">
                                            {formatCurrency(formatEther(receipt.amount), receipt.currency || 'USD')}
                                        </p>
                                    </div>
                                    <div className="h-px bg-border w-full" />
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                                            <span className="text-xs font-bold text-muted-foreground">
                                                {new Date(Number(receipt.issueTimestamp) * 1000).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <Button variant="ghost" size="sm" className="h-10 rounded-xl px-4 text-xs font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all">
                                            View Details
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>
        ) : (
            <div className="py-20 text-center space-y-6 glass rounded-[3rem] border-white/10 max-w-2xl mx-auto shadow-2xl">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center mx-auto text-emerald-500/40">
                    <Search className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-2xl font-black uppercase tracking-tighter">No Reports Found</h3>
                    <p className="text-muted-foreground font-medium">Try searching or adjust your filters.</p>
                </div>
                <Button 
                    variant="outline" 
                    className="h-12 rounded-2xl px-8 font-black uppercase tracking-widest glass"
                    onClick={() => {
                        setSearchQuery('');
                        setSortBy('newest');
                    }}
                >
                    Clear Filters
                </Button>
            </div>
        )}
      </main>
    </div>
  );
}
