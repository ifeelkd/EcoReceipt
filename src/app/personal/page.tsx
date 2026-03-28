'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LayoutGrid, List, Search, Filter, Wallet, ShoppingBag, TrendingUp, ShieldCheck, Clock, UploadCloud, Download, FileText, Leaf, ExternalLink, BarChart3, ArrowUpRight } from 'lucide-react';
import { useReceipts, useIssueReceipt } from '@/hooks/useReceipts';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@/components/ConnectButton';
import { useCurrency } from '@/context/CurrencyContext';
import { motion, AnimatePresence } from 'framer-motion';
import { formatEther } from 'viem';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { uploadFileToPinata, uploadJSONToPinata } from '@/app/actions/pinata';

const CATEGORIES = ["All", "Groceries", "Electronics", "Dining", "Transport", "Retail", "Other"];

export default function PersonalPage() {
  const { formatFiat } = useCurrency();
  const { isConnected, address } = useAccount();
  const { receipts, isLoading } = useReceipts();
  const { issue, isPending, isConfirming, isSuccess, error } = useIssueReceipt();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'amount_high' | 'amount_low'>('newest');
  const [filterCategory, setFilterCategory] = useState<string>('All');
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

  // Derived Metrics
  const totalReceipts = receipts ? (receipts as any[]).length : 0;
  const paperSavedLbs = (totalReceipts * 0.012).toFixed(3);
  const carbonReducedKg = (totalReceipts * 0.035).toFixed(3);

  // Spending Summary Calculation
  const totalVerifiedSpendEth = useMemo(() => {
    if (!receipts) return 0;
    return (receipts as any[]).reduce((acc, r) => acc + parseFloat(formatEther(r.amount)), 0);
  }, [receipts]);

  // Category Spending Data
  const categoryData = useMemo(() => {
    if (!receipts || totalReceipts === 0) return [];
    const totals: Record<string, number> = {};
    (receipts as any[]).forEach(r => {
        const amt = parseFloat(formatEther(r.amount));
        const cat = r.category || 'Other';
        totals[cat] = (totals[cat] || 0) + amt;
    });
    
    const maxVal = Math.max(...Object.values(totals), 1);
    
    return Object.entries(totals)
        .map(([name, amount]) => ({ name, amount, pct: (amount / maxVal) * 100 }))
        .sort((a,b) => b.amount - a.amount)
        .slice(0, 5); // top 5
  }, [receipts, totalReceipts]);

  // Sorting and Filtering
  const processedReceipts = useMemo(() => {
    if (!receipts) return [];
    
    let filtered = (receipts as any[]).filter((r) => 
        (filterCategory === 'All' || r.category === filterCategory || (!r.category && filterCategory === 'Other')) &&
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
  }, [receipts, searchQuery, sortBy, filterCategory]);

  // Export to CSV
  const exportToCSV = () => {
      if (!processedReceipts.length) return toast.error("No records to export.");
      
      const headers = ["Item Name", "Category", "Amount", "Currency", "Issue Date", "Warranty Expiry", "Returned", "IPFS Hash"];
      const rows = processedReceipts.map(r => [
          r.itemName,
          r.category || 'Other',
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
        <main className="max-w-7xl mx-auto px-4 md:px-8 py-24 md:py-32 text-center space-y-6 md:space-y-8">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-emerald-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto text-emerald-500 shadow-xl border border-emerald-500/20">
                <Wallet className="w-10 h-10 md:w-12 md:h-12" />
            </div>
            <div className="space-y-4">
                <h1 className="text-3xl md:text-6xl font-black tracking-tighter uppercase">Activate Your Vault.</h1>
                <p className="text-muted-foreground text-sm md:text-lg max-w-md mx-auto font-medium">Connect your Digital ID to view your verified Proof of Purchase history and active warranties.</p>
            </div>
            <div className="flex justify-center pt-4">
                <ConnectButton className="h-[44px] md:h-14 px-8 md:px-10 text-sm md:text-lg rounded-2xl" />
            </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32 md:pb-12 overflow-x-hidden pt-20">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 space-y-8 md:space-y-12">
        
        {/* Header Section */}
        <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-black border border-emerald-500/20 uppercase tracking-widest leading-none">
                <ShieldCheck className="w-3.5 h-3.5" />
                Vault Secured
            </div>
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-black tracking-tighter uppercase leading-[1.1]">
                Financial <br />
                <span className="text-emerald-500">Overview.</span>
            </h1>
        </div>

        {/* EXPENSE TRACKING DASHBOARD */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <AnimatePresence>
                {/* Global Spend Card */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass p-6 md:p-8 rounded-[2rem] border-white/20 shadow-xl flex flex-col justify-between min-h-[160px]"
                >
                    <div className="flex justify-between items-start">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 md:w-6 md:h-6" />
                        </div>
                        <span className="text-xs font-black tracking-widest uppercase text-muted-foreground bg-white/5 py-1 px-3 rounded-full">This Month</span>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground font-bold tracking-tight mb-1">Total Verified Spend</p>
                        <h2 className="text-3xl md:text-4xl font-black text-primary leading-none">
                            {formatFiat(totalVerifiedSpendEth)}
                        </h2>
                    </div>
                </motion.div>

                {/* Receipts Count Card */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass p-6 md:p-8 rounded-[2rem] border-white/20 shadow-xl flex flex-col justify-between min-h-[160px]"
                >
                    <div className="flex justify-between items-start">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                            <ShoppingBag className="w-5 h-5 md:w-6 md:h-6" />
                        </div>
                        <span className="text-xs font-black tracking-widest uppercase text-muted-foreground bg-white/5 py-1 px-3 rounded-full">Total</span>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground font-bold tracking-tight mb-1">Receipts Vaulted</p>
                        <h2 className="text-3xl md:text-4xl font-black text-primary leading-none">
                            {totalReceipts} <span className="text-lg text-muted-foreground opacity-50">Assets</span>
                        </h2>
                    </div>
                </motion.div>

                {/* Eco-Impact Card */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="glass p-6 md:p-8 rounded-[2rem] border-emerald-500/30 shadow-xl flex flex-col justify-between min-h-[160px] bg-gradient-to-br from-emerald-500/5 to-transparent relative overflow-hidden"
                >
                    <div className="absolute -right-4 -top-4 opacity-10 blur-sm pointer-events-none">
                        <Leaf className="w-32 h-32 text-emerald-500" />
                    </div>
                    <div className="flex justify-between items-start relative z-10">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                            <Leaf className="w-5 h-5 md:w-6 md:h-6" />
                        </div>
                        <span className="text-xs font-black tracking-widest uppercase text-emerald-500 bg-emerald-500/10 py-1 px-3 rounded-full">Eco Impact</span>
                    </div>
                    <div className="relative z-10">
                        <p className="text-sm text-emerald-600 dark:text-emerald-400 font-bold tracking-tight mb-1">Paper & Carbon Saved</p>
                        <h2 className="text-2xl md:text-3xl font-black text-emerald-500 leading-none">
                            {paperSavedLbs} <span className="text-lg opacity-70">lbs</span>
                        </h2>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>

        {/* Category Analytics Section */}
        {categoryData.length > 0 && (
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="glass p-6 md:p-8 rounded-[2.5rem] shadow-xl border-white/10"
            >
                <div className="flex items-center gap-3 mb-8">
                    <BarChart3 className="w-6 h-6 text-primary" />
                    <h2 className="text-xl md:text-2xl font-black tracking-tighter uppercase">Spending by Category</h2>
                </div>
                <div className="space-y-5">
                    {categoryData.map((cat, idx) => (
                        <div key={idx} className="space-y-2">
                            <div className="flex justify-between text-sm font-bold">
                                <span>{cat.name}</span>
                                <span className="text-muted-foreground">${cat.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="w-full h-3 md:h-4 bg-white/5 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${cat.pct}%` }}
                                    transition={{ duration: 1, delay: 0.5 + (idx * 0.1), ease: "easeOut" }}
                                    className="h-full bg-gradient-to-r from-emerald-400 to-indigo-500 rounded-full"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>
        )}

        {/* Dashboard Controls / Search */}
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between sticky top-20 z-30 bg-background/80 backdrop-blur-xl py-4 rounded-3xl border-b border-white/5">
            <div className="flex flex-col sm:flex-row flex-1 gap-4 items-center w-full">
                <div className="relative w-full md:max-w-md group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-all" strokeWidth={1.5} />
                    <Input 
                        placeholder="Search stores or items..." 
                        className="pl-12 min-h-[44px] md:h-14 rounded-2xl bg-white/5 border-white/10 text-sm md:text-base font-medium focus:bg-white/10 transition-all shadow-inner w-full"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                
                <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v || 'All')}>
                    <SelectTrigger className="w-full sm:w-[160px] min-h-[44px] md:h-14 rounded-2xl bg-white/5 border-white/10 font-bold glass text-sm">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                        {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                    <SelectTrigger className="w-full sm:w-[160px] min-h-[44px] md:h-14 rounded-2xl bg-white/5 border-white/10 font-bold glass text-sm">
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

            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                <Button 
                    variant="outline" 
                    className="flex-1 lg:flex-none min-h-[44px] md:h-14 rounded-2xl glass font-bold border-white/20 active:scale-95 transition-all text-sm"
                    onClick={exportToCSV}
                >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                </Button>
                <Button 
                    variant="default" 
                    className="flex-1 lg:flex-none min-h-[44px] md:h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold active:scale-95 transition-all shadow-lg shadow-emerald-500/20 text-sm"
                    onClick={() => setIsDigitizeOpen(true)}
                >
                    <UploadCloud className="w-4 h-4 mr-2" />
                    Digitize
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
                        className="glass w-full max-w-lg rounded-[3rem] shadow-2xl p-6 md:p-8"
                    >
                        <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter mb-2">Digitize Receipt</h2>
                        <p className="text-sm md:text-base text-muted-foreground font-medium mb-8">Upload a photo of a physical receipt to store it in your decentralized vault.</p>
                        
                        <div {...getRootProps()} className={`border-2 border-dashed rounded-[2rem] p-8 md:p-12 text-center cursor-pointer transition-all ${isDragActive ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/20 dark:border-white/10 hover:border-emerald-500/50 hover:bg-white/5'}`}>
                            <input {...getInputProps()} />
                            <UploadCloud className={`w-10 h-10 md:w-12 md:h-12 mx-auto mb-4 ${isDragActive ? 'text-emerald-500' : 'text-muted-foreground'}`} strokeWidth={1.5} />
                            {digitizeFile ? (
                                <p className="text-sm md:text-lg font-bold text-emerald-500 word-break truncate">{digitizeFile.name} readied for Vault.</p>
                            ) : isDragActive ? (
                                <p className="text-sm md:text-lg font-bold text-emerald-500">Drop the image here...</p>
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-sm md:text-lg font-bold text-foreground/70">Drag & drop image, or click to select</p>
                                    <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-muted-foreground/50">Supports JPG, PNG, WEBP</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 flex flex-col md:flex-row justify-end gap-3">
                            <Button variant="ghost" className="min-h-[44px] rounded-xl px-6 w-full md:w-auto" onClick={() => setIsDigitizeOpen(false)}>Cancel</Button>
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
                                <Button 
                                    className="min-h-[44px] rounded-xl px-8 w-full md:w-auto bg-emerald-500 hover:bg-emerald-600 text-white font-bold disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                                    onClick={handleUploadAndMint}
                                    disabled={!digitizeFile || isUploading || isPending || isConfirming}
                                >
                                    {isUploading ? "Uploading..." : 
                                     isPending ? "Awaiting..." : 
                                     isConfirming ? "Minting..." : "Upload & Mint"}
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                <AnimatePresence>
                {processedReceipts.map((receipt: any, idx: number) => {
                    const isWarrantyValid = Number(receipt.warrantyExpiryTimestamp) * 1000 > Date.now();
                    
                    return (
                        <motion.div
                            layout
                            key={receipt.ipfsHash || idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: idx * 0.05, duration: 0.3, ease: "easeOut" }}
                            whileHover={{ y: -2 }}
                            className="group"
                        >
                            <Card className="glass flex flex-col sm:flex-row items-center p-4 md:p-6 rounded-2xl md:rounded-[2rem] border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl transition-all h-full gap-4 md:gap-6 overflow-hidden">
                                
                                <div className="w-full sm:w-auto flex items-center justify-between sm:block">
                                    <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center border shadow-inner ${isWarrantyValid ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-slate-500/10 text-slate-500 border-slate-500/20'}`}>
                                        <ShoppingBag className="w-5 h-5 md:w-7 md:h-7" strokeWidth={1.5} />
                                    </div>
                                    <span className="sm:hidden text-lg font-black">{formatFiat(formatEther(receipt.amount))}</span>
                                </div>

                                <div className="flex-1 min-w-0 w-full">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="truncate pr-4">
                                            <h3 className="text-lg md:text-xl font-black uppercase tracking-tight truncate group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
                                                {receipt.itemName}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{receipt.category || 'Retail'}</span>
                                                <span className="text-muted-foreground opacity-50">•</span>
                                                <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(Number(receipt.issueTimestamp) * 1000).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="hidden sm:block text-right">
                                            <p className="text-xl md:text-2xl font-black text-emerald-500 dark:text-emerald-400 whitespace-nowrap">
                                                {formatFiat(formatEther(receipt.amount))}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3 mt-4">
                                        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                                            isWarrantyValid
                                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                                : 'bg-red-500/10 text-red-500 border-red-500/20'
                                        }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${isWarrantyValid ? 'bg-emerald-500 animate-pulse' : 'bg-red-400'}`} />
                                            {isWarrantyValid ? 'Active Warranty' : 'Expired'}
                                        </div>
                                        
                                        <Button variant="ghost" size="sm" className="ml-auto text-xs min-h-[36px] font-bold rounded-xl hover:bg-primary/10 transition-colors group/btn">
                                            Verify <ArrowUpRight className="w-4 h-4 ml-1 opacity-50 group-hover/btn:opacity-100 transition-opacity" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    );
                })}
                </AnimatePresence>
            </div>
        ) : (
            <div className="py-16 md:py-24 text-center space-y-6 glass rounded-[2rem] md:rounded-[3rem] border-white/10 max-w-2xl mx-auto shadow-2xl px-4">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-emerald-500/10 rounded-2xl md:rounded-[2rem] flex items-center justify-center mx-auto text-emerald-500/40">
                    <Search className="w-8 h-8 md:w-10 md:h-10" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter">No Records Found</h3>
                    <p className="text-sm md:text-base text-muted-foreground font-medium">Try adjusting your category filters or search query.</p>
                </div>
                <Button 
                    variant="outline" 
                    className="min-h-[44px] md:h-12 rounded-xl md:rounded-2xl px-8 font-black uppercase tracking-widest glass text-sm"
                    onClick={() => {
                        setSearchQuery('');
                        setSortBy('newest');
                        setFilterCategory('All');
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
