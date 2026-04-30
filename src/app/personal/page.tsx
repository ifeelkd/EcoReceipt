'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Wallet, ShoppingBag, TrendingUp, ShieldCheck, Clock, UploadCloud, Download, Leaf, BarChart3, ArrowUpRight, Sparkles, ImageIcon, Loader2, Eye, CheckCircle2 } from 'lucide-react';
import { useReceipts, useIssueReceipt } from '@/hooks/useReceipts';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@/components/ConnectButton';
import { useCurrency } from '@/context/CurrencyContext';
import { motion, AnimatePresence } from 'framer-motion';
import { formatEther } from 'viem';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { ECO_RECEIPT_ADDRESS } from '@/lib/constants';
import { uploadFileToPinata, uploadJSONToPinata } from '@/app/actions/pinata';
import { extractReceiptData, ExtractedReceiptData, convertCurrencyToUSD } from '@/app/actions/extractReceipt';
import QRCode from 'react-qr-code';
import { Copy, Check, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORIES = ["All", "Groceries", "Electronics", "Dining", "Transport", "Retail", "Other"];

export default function PersonalPage() {
  const { formatFiat } = useCurrency();
  const { isConnected, address } = useAccount();
  const { receipts, isLoading, refetch } = useReceipts();

  // Debugging logs for fresh chain testing
  React.useEffect(() => {
    console.log(`[Vault] Address: ${address}`);
    console.log(`[Vault] Receipts Count: ${receipts ? (receipts as any[]).length : 0}`);
    console.log(`[Vault] Contract Address: ${ECO_RECEIPT_ADDRESS}`);
    console.log(`[Vault] Chain ID: ${isConnected ? (window as any).ethereum?.chainId : 'Not Connected'}`);
    if (receipts) console.log(`[Vault] Raw Data:`, receipts);
  }, [receipts, address, isConnected]);
  const { issue, hash, isPending, isConfirming, isSuccess, error } = useIssueReceipt();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'amount_high' | 'amount_low'>('newest');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isDigitizeOpen, setIsDigitizeOpen] = useState(false);
  const [digitizeFile, setDigitizeFile] = useState<File | null>(null);
  const [digitizePreviewUrl, setDigitizePreviewUrl] = useState<string | null>(null);
  const [digitizeItemName, setDigitizeItemName] = useState('');
  const [digitizeAmount, setDigitizeAmount] = useState('');
  const [digitizeCurrency, setDigitizeCurrency] = useState('USD');
  const [digitizeCategory, setDigitizeCategory] = useState('Other');
  const [digitizeWarrantyMonths, setDigitizeWarrantyMonths] = useState(0);
  const [digitizeExpiryDate, setDigitizeExpiryDate] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [aiExtracted, setAiExtracted] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [verifyingReceipt, setVerifyingReceipt] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isWarrantyModalOpen, setIsWarrantyModalOpen] = useState(false);
  const [warrantyReceipt, setWarrantyReceipt] = useState<any>(null);

  const handleViewWarranty = (receipt: any) => {
    setWarrantyReceipt(receipt);
    setIsWarrantyModalOpen(true);
  };

  const handleVerify = (receipt: any) => {
    setVerifyingReceipt(receipt);
    setIsVerifyModalOpen(true);
    setIsVerifying(true);
    // Simulate deep blockchain verification
    setTimeout(() => {
        setIsVerifying(false);
    }, 1800);
  };

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success("Address copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Monitor Minting State
  React.useEffect(() => {
    if (isPending) toast.loading("Broadcasting Record...", { id: "digitize-tx" });
    if (isConfirming) {
        toast.loading(
            <span>
                Securing Digital Receipt...{" "}
                {hash && (
                    <a 
                        href={`https://sepolia.etherscan.io/tx/${hash}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="underline text-emerald-400 font-bold ml-1"
                    >
                        Track on Etherscan
                    </a>
                )}
            </span>,
            { id: "digitize-tx" }
        );
    }
    if (isSuccess) {
        toast.dismiss("digitize-tx");
        toast.success("Successfully Uploaded & Minted!", { duration: 5000 });
        setIsDigitizeOpen(false);
        setDigitizeFile(null);
        setDigitizePreviewUrl(null);
        setDigitizeItemName('');
        setDigitizeAmount('');
        setDigitizeCurrency('USD');
        setDigitizeCategory('Other');
        setDigitizeWarrantyMonths(0);
        setDigitizeExpiryDate(null);
        setAiExtracted(false);
        refetch(); 
    }
    if (error) {
        toast.error(`Error: ${error.message.slice(0, 50)}...`, { id: "digitize-tx" });
    }
  }, [isPending, isConfirming, isSuccess, error, refetch, hash]);

  const { currency: dashboardCurrency, rates } = useCurrency();

  const formatConvertedAmount = useCallback((amount: number | string, fromCurrency: string = 'USD') => {
      const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
      if (isNaN(numericAmount)) return '0.00';

      let from = String(fromCurrency || 'USD').toUpperCase();
      if (!(rates as any)[from]) from = 'USD';

      let to = dashboardCurrency;
      if (!(rates as any)[to]) to = 'USD';

      let convertedAmount = numericAmount;
      if (from !== to) {
          convertedAmount = numericAmount * ((rates as any)[to] / (rates as any)[from]);
      }

      return new Intl.NumberFormat(to === 'INR' ? 'en-IN' : 'en-US', {
        style: 'currency',
        currency: to,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(convertedAmount);
  }, [dashboardCurrency, rates]);

  // Derived Metrics (based on industry standards: ~1.5g paper and ~2.5g CO2 per receipt)
  const totalReceipts = receipts ? (receipts as any[]).length : 0;
  const paperSavedLbs = (totalReceipts * 0.0033).toFixed(3);
  const carbonReducedKg = (totalReceipts * 0.0025).toFixed(3);

  // Spending Summary Calculation in Dashboard Currency
  const totalSpendDashboard = useMemo(() => {
    if (!receipts || !Array.isArray(receipts)) return 0;
    return (receipts as any[]).reduce((acc, r) => {
        if (!r.amount) return acc;
        const amt = parseFloat(formatEther(r.amount));
        let from = String(r.currency || 'USD').toUpperCase();
        let to = dashboardCurrency;

        if (from === to) return acc + amt;

        if (!(rates as any)[from]) from = 'USD';
        if (!(rates as any)[to]) to = 'USD';
        
        const converted = amt * ((rates as any)[to] / (rates as any)[from]);
        return acc + converted;
    }, 0);
  }, [receipts, rates, dashboardCurrency]);

  // Category Spending Data
  const categoryData = useMemo(() => {
    if (!receipts || totalReceipts === 0) return [];
    const totals: Record<string, number> = {};
    (receipts as any[]).forEach(r => {
        const amt = parseFloat(formatEther(r.amount));
        let from = String(r.currency || 'USD').toUpperCase();
        let to = dashboardCurrency;
        
        let converted = amt;
        if (from !== to) {
            if (!(rates as any)[from]) from = 'USD';
            if (!(rates as any)[to]) to = 'USD';
            converted = amt * ((rates as any)[to] / (rates as any)[from]);
        }

        const catMatch = r.itemName.match(/^\[(.*?)\]/);
        const cat = catMatch ? catMatch[1] : (r.category || 'Other');
        totals[cat] = (totals[cat] || 0) + converted;
    });
    
    const maxVal = Math.max(...Object.values(totals), 1);
    
    return Object.entries(totals)
        .map(([name, amount]) => ({ name, amount, pct: (amount / maxVal) * 100 }))
        .sort((a,b) => b.amount - a.amount)
        .slice(0, 5); 
  }, [receipts, totalReceipts, rates, dashboardCurrency]);

  // Sorting and Filtering
  const processedReceipts = useMemo(() => {
    if (!receipts) return [];
    
    let filtered = (receipts as any[]).filter((r) => {
        const catMatch = r.itemName.match(/^\[(.*?)\]/);
        const rCategory = catMatch ? catMatch[1] : (r.category || 'Other');
        const rItemName = catMatch ? r.itemName.replace(/^\[.*?\]\s*/, '') : r.itemName;
        
        return (filterCategory === 'All' || rCategory === filterCategory) &&
               rItemName.toLowerCase().includes(searchQuery.toLowerCase());
    });

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

  // Dropzone setup: on drop, immediately scan with Gemini
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      const file = acceptedFiles[0];
      setDigitizeFile(file);
      setDigitizePreviewUrl(URL.createObjectURL(file));
      setAiExtracted(false);
      setIsScanning(true);
      toast.loading("AI is scanning your receipt...", { id: "ai-scan" });

      const formData = new FormData();
      formData.append("file", file);
      const result = await extractReceiptData(formData);

      setIsScanning(false);
      toast.dismiss("ai-scan");

      if (result.success && result.data) {
          const d = result.data;
          setDigitizeItemName(d.storeName);
          setDigitizeAmount(d.amount.toString());
          setDigitizeCurrency(d.currency);
          setDigitizeCategory(d.category);
          setDigitizeWarrantyMonths(d.warrantyMonths);
          setDigitizeExpiryDate(d.expiryDate);
          setAiExtracted(true);
          toast.success(`✨ AI extracted: ${d.storeName} · ${d.currency} ${d.amount}`, { duration: 4000 });
      } else {
          toast.warning("Could not auto-extract — fill in manually.", { duration: 3000 });
      }
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: {'image/*': []}, maxFiles: 1 });

  // View original bill from IPFS metadata
  const handleViewBill = async (ipfsHash: string) => {
      try {
          const metaUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
          const res = await fetch(metaUrl);
          if (!res.ok) throw new Error("Could not fetch metadata");
          const meta = await res.json();
          const attachedFile: string = meta?.attachedFile || meta?.pinataContent?.attachedFile;
          if (attachedFile) {
              const imageHash = attachedFile.replace("ipfs://", "");
              window.open(`https://gateway.pinata.cloud/ipfs/${imageHash}`, "_blank");
          } else {
              toast.error("No bill image found for this receipt.");
          }
      } catch {
          toast.error("Failed to retrieve bill from IPFS.");
      }
  };

  const handleUploadAndMint = async () => {
      if (!digitizeFile || !address || !digitizeItemName) {
          return toast.error("Please upload a receipt image and enter a store name.");
      }
      setIsUploading(true);

      const fileData = new FormData();
      fileData.append("file", digitizeFile);
      fileData.append("itemName", digitizeItemName);

      const uploadRes = await uploadFileToPinata(fileData);
      if (!uploadRes.success) {
          setIsUploading(false);
          return toast.error("File upload failed.");
      }

      // Compute warranty expiry: use detected months or manual entry if > 0
      let warrantySeconds = 0;
      if (digitizeWarrantyMonths > 0) {
          warrantySeconds = Math.floor(Date.now() / 1000) + (digitizeWarrantyMonths * 30 * 86400);
      } else if (digitizeExpiryDate) {
          warrantySeconds = Math.floor(new Date(digitizeExpiryDate).getTime() / 1000);
      }

      const amountNum = parseFloat(digitizeAmount) || 0;

      const metadata = {
          itemName: digitizeItemName,
          amount: amountNum.toString(),
          currency: digitizeCurrency,
          originalAmount: amountNum.toString(),
          originalCurrency: digitizeCurrency,
          category: digitizeCategory,
          warrantyMonths: digitizeWarrantyMonths,
          warrantyExpiryTimestamp: warrantySeconds,
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
          digitizeAmount,
          digitizeCurrency,
          `[${digitizeCategory}] ${digitizeItemName}`,
          warrantySeconds,
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
                {/* Global Spend Card */}
                <motion.div 
                    key="global-spend"
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
                            {formatConvertedAmount(totalSpendDashboard, dashboardCurrency)}
                        </h2>
                    </div>
                </motion.div>

                {/* Receipts Count Card */}
                <motion.div 
                    key="receipts-count"
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
                    key="eco-impact"
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
                                <span className="text-muted-foreground">{formatConvertedAmount(cat.amount, dashboardCurrency)}</span>
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
        <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between sticky top-20 z-30 bg-background/80 backdrop-blur-xl py-4 rounded-3xl border-b border-white/5">
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
                
                <div className="relative w-full sm:w-[160px]">
                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                        className="w-full h-11 md:h-14 flex items-center justify-between px-4 rounded-2xl bg-white/5 border border-white/10 font-bold glass text-sm"
                    >
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4" />
                            <span className="truncate">{filterCategory}</span>
                        </div>
                        <ChevronDown className={cn("w-3 h-3 text-muted-foreground transition-transform duration-200", isCategoryOpen && "rotate-180")} />
                    </motion.button>
                    <AnimatePresence>
                        {isCategoryOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsCategoryOpen(false)} />
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute left-0 top-full mt-2 w-48 rounded-2xl border border-white/10 bg-slate-900 shadow-2xl overflow-hidden z-50 p-2"
                                >
                                    <div className="flex flex-col gap-1">
                                        {CATEGORIES.map(c => (
                                            <button
                                                key={c}
                                                onClick={() => {
                                                    setFilterCategory(c);
                                                    setIsCategoryOpen(false);
                                                }}
                                                className={cn(
                                                    "flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors",
                                                    filterCategory === c ? "bg-emerald-500/10 text-emerald-400" : "text-slate-300 hover:bg-white/5"
                                                )}
                                            >
                                                <span>{c}</span>
                                                {filterCategory === c && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>

                <div className="relative w-full sm:w-[160px]">
                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => setIsSortOpen(!isSortOpen)}
                        className="w-full h-11 md:h-14 flex items-center justify-between px-4 rounded-2xl bg-white/5 border border-white/10 font-bold glass text-sm"
                    >
                        <span className="truncate">{sortBy.replace('_', ' ')}</span>
                        <ChevronDown className={cn("w-3 h-3 text-muted-foreground transition-transform duration-200", isSortOpen && "rotate-180")} />
                    </motion.button>
                    <AnimatePresence>
                        {isSortOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsSortOpen(false)} />
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute right-0 top-full mt-2 w-48 rounded-2xl border border-white/10 bg-slate-900 shadow-2xl overflow-hidden z-50 p-2"
                                >
                                    <div className="flex flex-col gap-1">
                                        {[
                                            { id: 'newest', label: 'Newest First' },
                                            { id: 'oldest', label: 'Oldest First' },
                                            { id: 'amount_high', label: 'Highest Amount' },
                                            { id: 'amount_low', label: 'Lowest Amount' }
                                        ].map(sort => (
                                            <button
                                                key={sort.id}
                                                onClick={() => {
                                                    setSortBy(sort.id as any);
                                                    setIsSortOpen(false);
                                                }}
                                                className={cn(
                                                    "flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors",
                                                    sortBy === sort.id ? "bg-indigo-500/10 text-indigo-400" : "text-slate-300 hover:bg-white/5"
                                                )}
                                            >
                                                <span>{sort.label}</span>
                                                {sortBy === sort.id && <Check className="w-3.5 h-3.5 text-indigo-500" />}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <Button 
                    variant="outline" 
                    className="flex-1 md:flex-none h-14 rounded-2xl glass font-bold border-white/20 active:scale-[0.98] transition-all text-sm select-none"
                    onClick={exportToCSV}
                >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                </Button>
                <Button 
                    variant="default" 
                    className="flex-1 lg:flex-none h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold active:scale-[0.98] transition-all shadow-lg shadow-emerald-500/20 text-sm select-none"
                    onClick={() => setIsQRModalOpen(true)}
                >
                    <Wallet className="w-4 h-4 mr-2" />
                    Show QR ID
                </Button>
                <Button 
                    variant="default" 
                    className="flex-1 lg:flex-none h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold active:scale-[0.98] transition-all shadow-lg shadow-blue-500/20 text-sm select-none"
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
                    key="digitize-overlay"
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
                        <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter mb-1">Digitize Receipt</h2>
                        <p className="text-sm text-muted-foreground font-medium mb-6">Drop your receipt — AI will auto-fill all fields instantly.</p>

                        {/* Drop zone */}
                        <div {...getRootProps()} className={cn(
                            "border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all mb-5 relative overflow-hidden",
                            isDragActive ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/20 hover:border-emerald-500/50 hover:bg-white/5',
                            digitizePreviewUrl ? 'p-0 h-40' : 'p-6'
                        )}>
                            <input {...getInputProps()} />
                            {digitizePreviewUrl ? (
                                <>
                                    <img src={digitizePreviewUrl} alt="Receipt preview" className="w-full h-full object-cover opacity-60" />
                                    {isScanning && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm gap-2">
                                            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                                            <p className="text-xs font-black uppercase tracking-widest text-emerald-400">AI Scanning...</p>
                                        </div>
                                    )}
                                    {aiExtracted && !isScanning && (
                                        <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-emerald-500/90 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
                                            <Sparkles className="w-3 h-3" /> AI Extracted
                                        </div>
                                    )}
                                    <div className="absolute bottom-2 left-2 text-[10px] text-white/60 font-bold bg-black/40 px-2 py-0.5 rounded-full">
                                        Click to change
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center gap-2">
                                    <UploadCloud className={`w-8 h-8 ${isDragActive ? 'text-emerald-500' : 'text-muted-foreground'}`} strokeWidth={1.5} />
                                    <p className="text-sm font-bold text-foreground/70">{isDragActive ? 'Drop here...' : 'Drag & drop or click to select'}</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">JPG · PNG · WEBP</p>
                                </div>
                            )}
                        </div>

                        {/* Form fields — shown after scan */}
                        <AnimatePresence>
                        {digitizeFile && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-3"
                        >
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 block">Store / Item Name</label>
                                <Input
                                    placeholder={isScanning ? 'Scanning...' : 'e.g. Apple Store'}
                                    value={digitizeItemName}
                                    onChange={(e) => setDigitizeItemName(e.target.value)}
                                    disabled={isScanning}
                                    className="h-11 rounded-xl bg-white/5 border-white/10"
                                />
                            </div>
                            <div className="flex gap-3">
                                <div className="flex-[2]">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 block">
                                        Amount
                                    </label>
                                    <Input
                                        type="number"
                                        placeholder={isScanning ? '...' : '0.00'}
                                        value={digitizeAmount}
                                        onChange={(e) => setDigitizeAmount(e.target.value)}
                                        disabled={isScanning}
                                        className="h-11 rounded-xl bg-white/5 border-white/10"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 block">
                                        Currency
                                    </label>
                                    <Select value={digitizeCurrency} onValueChange={(v) => setDigitizeCurrency(v || 'USD')} disabled={isScanning}>
                                        <SelectTrigger className="h-11 rounded-xl bg-white/5 border-white/10">
                                            <SelectValue placeholder="Currency" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {['USD', 'INR', 'EUR', 'GBP', 'CNY', 'JPY'].map(c => (
                                                <SelectItem key={c} value={c}>{c}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="flex-[2]">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 block">Category</label>
                                    <Select value={digitizeCategory} onValueChange={(v) => setDigitizeCategory(v || 'Other')} disabled={isScanning}>
                                        <SelectTrigger className="h-11 rounded-xl bg-white/5 border-white/10">
                                            <SelectValue placeholder="Category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CATEGORIES.filter(c => c !== 'All').map(c => (
                                                <SelectItem key={c} value={c}>{c}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 block">Warranty (Months)</label>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        value={digitizeWarrantyMonths}
                                        onChange={(e) => setDigitizeWarrantyMonths(parseInt(e.target.value) || 0)}
                                        disabled={isScanning}
                                        className="h-11 rounded-xl bg-white/5 border-white/10"
                                    />
                                </div>
                            </div>
                            {digitizeWarrantyMonths > 0 && (
                                <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 rounded-xl text-emerald-400 text-xs font-bold border border-emerald-500/20">
                                    <ShieldCheck className="w-4 h-4" />
                                    Warranty detected: {digitizeWarrantyMonths} month{digitizeWarrantyMonths > 1 ? 's' : ''}
                                    {digitizeExpiryDate && ` · Expires ${new Date(digitizeExpiryDate).toLocaleDateString()}`}
                                </div>
                            )}
                        </motion.div>
                        )}
                        </AnimatePresence>

                        <div className="mt-6 flex flex-col md:flex-row justify-end gap-3">
                            <Button variant="ghost" className="min-h-[44px] rounded-xl px-6 w-full md:w-auto" onClick={() => setIsDigitizeOpen(false)}>Cancel</Button>
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
                                <Button
                                    className="min-h-[44px] rounded-xl px-8 w-full md:w-auto bg-emerald-500 hover:bg-emerald-600 text-white font-bold disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                                    onClick={handleUploadAndMint}
                                    disabled={!digitizeFile || isScanning || isUploading || isPending || isConfirming}
                                >
                                    {isScanning ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Scanning...</> :
                                     isUploading ? 'Uploading...' :
                                     isPending ? 'Awaiting Wallet...' :
                                     isConfirming ? 'Minting...' : 'Upload & Mint'}
                                </Button>
                            </motion.div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* QR ID Modal */}
        <AnimatePresence>
            {isQRModalOpen && (
                <motion.div 
                    key="qr-id-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-black/70 dark:bg-black/90 flex items-center justify-center p-4 backdrop-blur-xl"
                    onClick={() => setIsQRModalOpen(false)}
                >
                    <motion.div 
                        initial={{ scale: 0.9, y: 20, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.9, y: 20, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="glass w-full max-w-sm rounded-[3rem] shadow-2xl p-8 text-center relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-indigo-500 to-emerald-500" />
                        
                        <div className="space-y-6 pt-2">

                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-black border border-emerald-500/20 uppercase tracking-widest">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                Verified ecoid
                            </div>
                            
                            <div className="space-y-1">
                                <h2 className="text-2xl font-black uppercase tracking-tighter italic">Your Wallet ID</h2>
                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest opacity-70">Show this at checkout</p>
                            </div>

                            <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl inline-block border-8 border-white/5 mx-auto">
                                <QRCode 
                                    value={address || ''} 
                                    size={200}
                                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                    viewBox={`0 0 256 256`}
                                />
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 group relative flex flex-col items-center gap-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Wallet Address</p>
                                    <p className="font-mono text-[10px] md:text-xs break-all opacity-80">{address}</p>
                                </div>
                                
                                <div className="flex gap-3">
                                    <Button 
                                        variant="outline" 
                                        className="flex-1 h-14 rounded-2xl glass font-bold border-white/20 active:scale-[0.98] transition-all text-xs select-none"
                                        onClick={handleCopyAddress}
                                    >
                                        {copied ? <Check className="w-4 h-4 mr-2 text-emerald-500" /> : <Copy className="w-4 h-4 mr-2" />}
                                        {copied ? "Copied!" : "Copy Address"}
                                    </Button>
                                    <Button 
                                        className="w-14 h-14 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-[0.98] transition-all select-none"
                                        onClick={() => setIsQRModalOpen(false)}
                                        aria-label="Close modal"
                                    >
                                        <X className="w-6 h-6" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <p className="mt-8 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-30">EcoReceipt Protocol v1.0</p>
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
                    const hasExpiry = Number(receipt.warrantyExpiryTimestamp) > 0;
                    const isWarrantyValid = hasExpiry && Number(receipt.warrantyExpiryTimestamp) * 1000 > Date.now();
                    
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
                            <Card className={cn(
                                "flex flex-col sm:flex-row items-center p-4 md:p-6 rounded-2xl md:rounded-[2rem] border transition-all h-full gap-4 md:gap-6 overflow-hidden relative",
                                hasExpiry 
                                    ? "glass border-indigo-500/20 bg-indigo-500/[0.03] shadow-indigo-500/5 shadow-2xl" 
                                    : "bg-white/5 border-white/5 dark:bg-white/[0.02] shadow-sm hover:shadow-md"
                            )}>
                                {hasExpiry && (
                                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                                        <ShieldCheck className="w-24 h-24 text-indigo-500" />
                                    </div>
                                )}
                                
                                <div className="w-full sm:w-auto flex items-center justify-between sm:block relative z-10">
                                    <div className={cn(
                                        "rounded-2xl flex items-center justify-center transition-all",
                                        !hasExpiry 
                                            ? "w-10 h-10 md:w-12 md:h-12 bg-slate-500/10 text-slate-500 border border-slate-500/20" 
                                            : "w-12 h-12 md:w-16 md:h-16 border bg-indigo-500/10 text-indigo-500 border-indigo-500/20 shadow-lg shadow-indigo-500/20"
                                    )}>
                                        <ShoppingBag className={hasExpiry ? "w-5 h-5 md:w-7 md:h-7" : "w-4 h-4 md:w-5 md:h-5"} strokeWidth={1.5} />
                                    </div>
                                    <span className="sm:hidden text-lg font-black">{formatConvertedAmount(formatEther(receipt.amount), receipt.currency)}</span>
                                </div>

                                <div className="flex-1 min-w-0 w-full relative z-10">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="truncate pr-4">
                                            <h3 className={cn(
                                                "font-black uppercase tracking-tight truncate transition-colors",
                                                hasExpiry ? "text-lg md:text-xl group-hover:text-indigo-400" : "text-base md:text-lg opacity-80"
                                            )}>
                                                {receipt.itemName.replace(/^\[.*?\]\s*/, '')}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">
                                                    {receipt.itemName.match(/^\[(.*?)\]/) ? receipt.itemName.match(/^\[(.*?)\]/)[1] : (receipt.category || 'Other')}
                                                </span>
                                                <span className="text-muted-foreground opacity-30">•</span>
                                                <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1 opacity-60">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(Number(receipt.issueTimestamp) * 1000).toLocaleString(undefined, { 
                                                        dateStyle: 'medium', 
                                                        timeStyle: hasExpiry ? 'short' : undefined
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="hidden sm:block text-right">
                                            <p className={cn(
                                                "font-black whitespace-nowrap",
                                                hasExpiry ? "text-xl md:text-2xl text-indigo-500" : "text-lg md:text-xl opacity-90"
                                            )}>
                                                {formatConvertedAmount(formatEther(receipt.amount), receipt.currency)}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className={cn(
                                        "flex flex-wrap items-center gap-2 mt-4 pt-4 border-t",
                                        hasExpiry ? "border-indigo-500/10" : "border-white/5"
                                    )}>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 h-9 transition-all px-3"
                                            onClick={() => handleViewBill(receipt.ipfsHash)}
                                        >
                                            <Eye className="w-3.5 h-3.5 mr-1.5" /> View Bill
                                        </Button>

                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-500/10 text-slate-500 h-9 transition-all px-3"
                                            onClick={() => handleVerify(receipt)}
                                        >
                                            Verify Proof <ArrowUpRight className="w-3.5 h-3.5 ml-1.5 opacity-50" />
                                        </Button>

                                        {hasExpiry && (
                                            <div 
                                                className="ml-auto cursor-pointer group/w"
                                                onClick={() => handleViewWarranty(receipt)}
                                            >
                                                <div className={cn(
                                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                                                    isWarrantyValid
                                                        ? "bg-indigo-500/10 text-indigo-500 border-indigo-500/20 group-hover/w:bg-indigo-500 group-hover/w:text-white"
                                                        : "bg-red-500/10 text-red-500 border-red-500/20"
                                                )}>
                                                    <ShieldCheck className="w-3 h-3" />
                                                    {isWarrantyValid ? 'Protected' : 'Expired'}
                                                </div>
                                            </div>
                                        )}
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
        {/* Verification Modal */}
        <AnimatePresence>
            {isVerifyModalOpen && verifyingReceipt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        onClick={() => setIsVerifyModalOpen(false)}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-lg glass rounded-[3rem] border-white/20 shadow-2xl overflow-hidden"
                    >
                        <div className="p-8 md:p-12 space-y-8">
                            <div className="flex justify-center">
                                {isVerifying ? (
                                    <div className="relative">
                                        <div className="w-24 h-24 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                                        <ShieldCheck className="absolute inset-0 m-auto w-10 h-10 text-emerald-500 animate-pulse" />
                                    </div>
                                ) : (
                                    <motion.div 
                                        initial={{ scale: 0.5 }}
                                        animate={{ scale: 1 }}
                                        className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-2xl shadow-emerald-500/30"
                                    >
                                        <CheckCircle2 className="w-12 h-12" />
                                    </motion.div>
                                )}
                            </div>

                            <div className="text-center space-y-2">
                                <h2 className="text-3xl font-black uppercase tracking-tighter">
                                    {isVerifying ? "Verifying Proof..." : "Verified On-Chain"}
                                </h2>
                                <p className="text-muted-foreground font-medium">
                                    {isVerifying ? "Auditing cryptographic signatures..." : "Authenticity & Integrity confirmed."}
                                </p>
                            </div>

                            <div className="space-y-4 pt-4">
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-muted-foreground uppercase font-black tracking-widest">Receipt ID</span>
                                        <span className="font-mono font-bold">#000{verifyingReceipt.id?.toString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-muted-foreground uppercase font-black tracking-widest">Merchant Status</span>
                                        <span className="text-emerald-500 font-bold flex items-center gap-1">
                                            <ShieldCheck className="w-3 h-3" /> Certified Issuer
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-1 pt-2">
                                        <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Cloud Proof (IPFS)</span>
                                        <span className="text-[10px] font-mono break-all opacity-50 bg-black/20 p-2 rounded-lg">
                                            {verifyingReceipt.ipfsHash}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs pt-2">
                                        <span className="text-muted-foreground uppercase font-black tracking-widest">Network</span>
                                        <span className="font-bold flex items-center gap-1">
                                            <Leaf className="w-3 h-3 text-emerald-500" /> Eco Protocol v3
                                        </span>
                                    </div>
                                </div>

                                {!isVerifying && (
                                    <div className="p-6 rounded-[2rem] bg-white text-black flex flex-col items-center gap-4 shadow-inner">
                                        <div className="p-2 bg-white rounded-xl">
                                            <QRCode 
                                                value={`https://eco-receipt-verify.vercel.app/receipt/${verifyingReceipt.id?.toString()}`}
                                                size={140}
                                                level="H"
                                            />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[10px] font-black uppercase tracking-tighter opacity-40">Scan to Verify Externally</p>
                                            <p className="text-[9px] font-mono break-all opacity-30 mt-1 max-w-[140px]">
                                                {verifyingReceipt.ipfsHash.slice(0, 20)}...
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <Button 
                                    variant="outline"
                                    className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest glass text-xs"
                                    onClick={() => {
                                        navigator.clipboard.writeText(`https://eco-receipt-verify.vercel.app/v/${verifyingReceipt.id}`);
                                        toast.success("Verification Link Copied!");
                                    }}
                                    disabled={isVerifying}
                                >
                                    <Copy className="w-4 h-4 mr-2" /> Link
                                </Button>
                                <Button 
                                    className="flex-[2] h-14 bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all text-xs"
                                    onClick={() => setIsVerifyModalOpen(false)}
                                    disabled={isVerifying}
                                >
                                    {isVerifying ? "Consulting Nodes..." : "Close Audit"}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>

        {/* Warranty Modal */}
        <AnimatePresence>
            {isWarrantyModalOpen && warrantyReceipt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        onClick={() => setIsWarrantyModalOpen(false)}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-lg glass rounded-[3rem] border-white/20 shadow-2xl overflow-hidden"
                    >
                        <div className="p-8 md:p-12 space-y-8">
                            <div className="w-20 h-20 bg-indigo-500 rounded-[2rem] flex items-center justify-center mx-auto text-white shadow-xl shadow-indigo-500/30">
                                <ShieldCheck className="w-10 h-10" />
                            </div>

                            <div className="text-center space-y-2">
                                <h2 className="text-3xl font-black uppercase tracking-tighter">Active Coverage</h2>
                                <p className="text-muted-foreground font-medium">Your purchase is protected by EcoProtocol.</p>
                            </div>

                            <div className="space-y-4">
                                <div className="p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs uppercase font-black tracking-widest text-indigo-400">Time Remaining</span>
                                        <span className="text-lg font-black">
                                            {Math.max(0, Math.floor((Number(warrantyReceipt.warrantyExpiryTimestamp) - Date.now()/1000) / 86400))} Days
                                        </span>
                                    </div>
                                    <div className="h-2 bg-indigo-500/20 rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(100, Math.max(0, ((Date.now()/1000 - Number(warrantyReceipt.issueTimestamp)) / (Number(warrantyReceipt.warrantyExpiryTimestamp) - Number(warrantyReceipt.issueTimestamp))) * 100))}%` }}
                                            className="h-full bg-indigo-500"
                                        />
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest opacity-60">
                                        <span>Issued: {new Date(Number(warrantyReceipt.issueTimestamp)*1000).toLocaleDateString()}</span>
                                        <span>Expires: {new Date(Number(warrantyReceipt.warrantyExpiryTimestamp)*1000).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                
                                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                                    <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Protection Summary</p>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-muted-foreground">Merchant</span>
                                            <span className="font-bold">{warrantyReceipt.itemName.replace(/^\[.*?\]\s*/, '')}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-muted-foreground">Proof Status</span>
                                            <span className="text-emerald-500 font-bold flex items-center gap-1">
                                                <CheckCircle2 className="w-3 h-3" /> Cryptographically Signed
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-muted-foreground">Coverage</span>
                                            <span className="font-bold">Standard Manufacturer Warranty</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Button 
                                className="w-full h-16 bg-indigo-500 hover:bg-indigo-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl"
                                onClick={() => setIsWarrantyModalOpen(false)}
                            >
                                Close Warranty
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
      </main>
    </div>
  );
}
