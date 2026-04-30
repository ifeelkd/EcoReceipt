'use client';

import React, { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Zap, ShieldCheck, QrCode, User, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

import { useIssueReceipt } from '@/hooks/useReceipts';
import { useIsRetailer } from '@/hooks/useRole';
import { uploadFileToPinata, uploadJSONToPinata } from '@/app/actions/pinata';
import { useAccount } from 'wagmi';
import { QRScanner } from '@/components/QRScanner';
import { EcoImpactWidget } from '@/components/EcoImpactWidget';
import { useCurrency } from '@/context/CurrencyContext';
import { SUPPORTED_CURRENCIES } from '@/lib/currency';
import { ConnectButton } from '@/components/ConnectButton';
import Link from 'next/link';

export default function BusinessPage() {
  const { formatFiat } = useCurrency();
  const { address: connectedAddress, isConnected } = useAccount();
  const { issue, isPending, isConfirming, isSuccess, error, hash } = useIssueReceipt();
  const { isRetailer, isLoading: isRoleLoading } = useIsRetailer();
  
  const [customerAddress, setCustomerAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('');
  const [warrantyValue, setWarrantyValue] = useState('1');
  const [warrantyUnit, setWarrantyUnit] = useState('Years');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerAddress.startsWith('0x') || customerAddress.length !== 42) {
        return toast.error("Invalid Digital ID. Must be a 42-character Web3 address starting with 0x.");
    }

    setIsUploading(true);
    
    // Warranty calculation
    const multiplier: Record<string, number> = {
        'Days': 86400,
        'Months': 2592000,
        'Years': 31536000
    };
    const warrantyTimeSeconds = (parseFloat(warrantyValue) || 0) * (multiplier[warrantyUnit] || 86400);
    const expiryTimestamp = Math.floor(Date.now() / 1000) + warrantyTimeSeconds;

    // 1. Upload Metadata and Optional File to Peer Network (Cloud Proof)
    let fileHash = "";
    if (selectedFile) {
        const fileData = new FormData();
        fileData.append("file", selectedFile);
        fileData.append("itemName", itemName);
        const uploadRes = await uploadFileToPinata(fileData);
        if (uploadRes.success) {
            fileHash = uploadRes.ipfsHash;
        } else {
            setIsUploading(false);
            return toast.error("File upload failed.");
        }
    }

    const metadata = {
        itemName,
        amount,
        currency,
        category,
        warrantyExpiryTimestamp: expiryTimestamp,
        timestamp: Date.now(),
        issuer: connectedAddress,
        attachedFile: fileHash ? `ipfs://${fileHash}` : undefined
    };

    const ipfsResult = await uploadJSONToPinata(metadata);
    
    if (!ipfsResult.success) {
        setIsUploading(false);
        return toast.error("Cloud Proof failed. Backup error.");
    }

    // 2. Issue Digital Receipt (Proof of Purchase)
    try {
        issue(
            customerAddress as `0x${string}`,
            amount,
            currency,
            `[${category}] ${itemName}`,
            expiryTimestamp,
            ipfsResult.ipfsHash!
        );
    } catch (err) {
        console.error(err);
        toast.error("Issuance failed. Check network.");
    } finally {
        setIsUploading(false);
    }
  };

  useEffect(() => {
    if (isPending) toast.loading("Broadcasting Record...", { id: "tx" });
    if (isConfirming) toast.loading("Securing Digital Receipt...", { id: "tx" });
    if (isSuccess) {
        toast.dismiss("tx");
        toast.success(
            <div className="flex flex-col gap-2 p-1">
                <span className="font-black text-emerald-500 text-lg">Successfully Issued!</span>
                <p className="text-muted-foreground font-medium text-sm">The digital record is now secured on-chain.</p>
                <details className="text-xs text-muted-foreground mt-2 cursor-pointer outline-none">
                    <summary className="font-bold text-slate-400 hover:text-white transition-colors">Advanced Details</summary>
                    <p className="mt-2 text-[10px] break-all p-3 bg-black/40 rounded-xl border border-white/5 font-mono text-emerald-400/70">
                        {hash}
                    </p>
                </details>
            </div>,
            { duration: 8000 }
        );
        setCustomerAddress('');
        setAmount('');
        setItemName('');
    }
    if (error) toast.error(`Error: ${error.message.slice(0, 50)}...`, { id: "tx" });
  }, [isPending, isConfirming, isSuccess, error, hash]);

  // --- RENDER STATES ---

  // 1. Loading State
  if (isRoleLoading) {
    return (
        <div className="min-h-screen bg-background pt-20">
            <Navigation />
            <main className="max-w-7xl mx-auto px-4 py-24 flex flex-col items-center justify-center space-y-8">
                <div className="relative">
                    <div className="w-24 h-24 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Zap className="w-8 h-8 text-emerald-500 animate-pulse" />
                    </div>
                </div>
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-black uppercase tracking-tighter">Verifying Permissions</h2>
                    <p className="text-muted-foreground font-medium animate-pulse">Syncing with EcoReceipt Network...</p>
                </div>
            </main>
        </div>
    );
  }

  // 2. Unauthorized State
  if (!isConnected || !isRetailer) {
    return (
        <div className="min-h-screen bg-background pt-20 overflow-hidden relative">
            <Navigation />
            
            {/* Background Decorative Element */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

            <main className="max-w-4xl mx-auto px-4 py-20 md:py-32 relative z-10">
                <motion.div 
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', damping: 20 }}
                    className="glass p-8 md:p-16 rounded-[3rem] border-white/10 shadow-2xl text-center space-y-10"
                >
                    <div className="w-24 h-24 md:w-32 md:h-32 bg-red-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto text-red-500 border border-red-500/20 shadow-2xl shadow-red-500/10 relative">
                        <div className="absolute inset-0 bg-red-500/5 animate-ping rounded-[2.5rem]" />
                        <ShieldCheck className="w-12 h-12 md:w-16 md:h-16 relative z-10" strokeWidth={1} />
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tighter uppercase leading-none">
                            Retailer <br />
                            <span className="text-red-500">Access Only.</span>
                        </h1>
                        <p className="text-muted-foreground text-sm md:text-lg max-w-md mx-auto font-medium leading-relaxed">
                            The Business Portal is a restricted terminal for verified partners. Verification ensures trust and prevents system abuse.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <Link href="/partner" className="w-full sm:w-auto">
                            <Button 
                                className="w-full h-14 md:h-16 px-10 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
                            >
                                Apply for Account
                            </Button>
                        </Link>
                        <Link href="/personal" className="w-full sm:w-auto">
                            <Button 
                                variant="outline"
                                className="w-full h-14 md:h-16 px-10 rounded-2xl glass font-black uppercase tracking-widest border-white/20 active:scale-95 transition-all text-muted-foreground hover:text-foreground"
                            >
                                Return to Vault
                            </Button>
                        </Link>
                    </div>

                    {!isConnected && (
                        <div className="pt-8 border-t border-white/5">
                            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/50 mb-4">Or connect your existing ID</p>
                            <div className="flex justify-center">
                                <ConnectButton />
                            </div>
                        </div>
                    )}
                </motion.div>
            </main>
        </div>
    );
  }

  // 3. Authorized State (POS Terminal)
  return (
    <div className="min-h-screen bg-background pb-32 md:pb-12 overflow-x-hidden pt-20">
      <Navigation />
      
      <QRScanner 
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={(addr: string) => {
            setCustomerAddress(addr);
            toast.success("Digital ID successfully captured from QR code.");
        }}
      />

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            <div className="space-y-6 md:space-y-10 order-2 lg:order-1">
                <div className="space-y-4">
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20 uppercase tracking-widest"
                    >
                        <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                        Verified Retailer Active
                    </motion.div>
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-[1.1] uppercase">
                        Issue <br />
                        <span className="text-emerald-500">Receipts.</span>
                    </h1>
                    <p className="text-muted-foreground text-base md:text-xl font-medium leading-relaxed max-w-md">
                        Record digital Proof of Purchase. Secured by blockchain, available globally in your native currency.
                    </p>
                </div>

                <div className="flex flex-col gap-4">
                    <EcoImpactWidget totalReceipts={0} />
                </div>
            </div>

            <div className="order-1 lg:order-2">
                <Card className="glass border-none shadow-2xl rounded-[2.5rem] md:rounded-[3rem] overflow-hidden">
                    <CardHeader className="p-6 md:p-10 pb-2">
                        <CardTitle className="text-2xl md:text-3xl font-black uppercase tracking-tight">Purchase Info</CardTitle>
                        <p className="text-muted-foreground text-sm font-medium">Record a proof of purchase for your customer.</p>
                    </CardHeader>
                    <CardContent className="p-6 md:p-10 space-y-6 md:space-y-8">
                        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                            
                            <div className="space-y-3">
                                <Label className="text-xs uppercase font-black tracking-widest ml-1">Customer Digital ID</Label>
                                <div className="flex gap-3">
                                    <div className="relative flex-1">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input 
                                            placeholder="Enter ID or Scan QR" 
                                            value={customerAddress}
                                            onChange={(e) => setCustomerAddress(e.target.value)}
                                            className="pl-12 h-14 md:h-16 rounded-2xl bg-white/5 border-white/10 text-base md:text-lg font-medium focus:bg-white/10 transition-all shadow-inner"
                                            required
                                        />
                                    </div>
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        size="icon" 
                                        className="w-14 h-14 md:w-16 md:h-16 rounded-2xl glass border-white/20 active:scale-90 transition-all group"
                                        onClick={() => setIsScannerOpen(true)}
                                    >
                                        <QrCode className="w-6 h-6 md:w-7 md:h-7 text-emerald-500 group-hover:scale-110 transition-all" />
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-xs uppercase font-black tracking-widest ml-1">Amount & Currency</Label>
                                <div className="flex items-center gap-3">
                                    <div className="flex-[2]">
                                        <Input 
                                            type="number" 
                                            placeholder="0.00" 
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            className="h-14 md:h-16 rounded-2xl bg-white/5 border-white/10 text-base md:text-lg font-medium"
                                            required
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <Select value={currency} onValueChange={(val) => setCurrency(val ?? 'INR')}>
                                            <SelectTrigger className="h-14 md:h-16 rounded-2xl bg-white/5 border-white/10 text-base md:text-lg font-black tracking-tight flex items-center justify-between px-4">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {SUPPORTED_CURRENCIES.map((c) => (
                                                    <SelectItem key={c.code} value={c.code} className="font-bold">
                                                        {c.code} ({c.symbol})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-xs uppercase font-black tracking-widest ml-1">Product Description</Label>
                                <Input 
                                    placeholder="e.g. Sustainable Goods" 
                                    value={itemName}
                                    onChange={(e) => setItemName(e.target.value)}
                                    className="h-14 md:h-16 rounded-2xl bg-white/5 border-white/10 text-base md:text-lg font-medium"
                                    required
                                />
                            </div>

                            <div className="space-y-3">
                                <Label className="text-xs uppercase font-black tracking-widest ml-1">Category</Label>
                                <Select onValueChange={(val: any) => setCategory(val)} required>
                                    <SelectTrigger className="h-14 md:h-16 rounded-2xl bg-white/5 border-white/10 text-base md:text-lg font-medium">
                                        <SelectValue placeholder="Select Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Electronics">Electronics</SelectItem>
                                        <SelectItem value="Home">Home & Decor</SelectItem>
                                        <SelectItem value="Clothing">Fashion</SelectItem>
                                        <SelectItem value="Groceries">Groceries</SelectItem>
                                        <SelectItem value="Other">Miscellaneous</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-3 pt-2">
                                <Label className="text-xs uppercase font-black tracking-widest ml-1">Warranty Period</Label>
                                <div className="flex items-center gap-3">
                                    <div className="flex-1">
                                        <Input 
                                            type="number" 
                                            min="0"
                                            value={warrantyValue}
                                            onChange={(e) => setWarrantyValue(e.target.value)}
                                            className="h-14 md:h-16 rounded-2xl bg-white/5 border-white/10 text-base md:text-lg font-medium"
                                            required
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <Select value={warrantyUnit} onValueChange={(val) => setWarrantyUnit(val ?? 'Years')}>
                                            <SelectTrigger className="h-14 md:h-16 rounded-2xl bg-white/5 border-white/10 text-base md:text-lg font-medium flex items-center justify-between px-4">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Days">Days</SelectItem>
                                                <SelectItem value="Months">Months</SelectItem>
                                                <SelectItem value="Years">Years</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 pt-2">
                                <Label className="text-xs uppercase font-black tracking-widest ml-1">Attach Receipt / Product Image (Optional)</Label>
                                <Input 
                                    type="file" 
                                    accept="image/*,application/pdf"
                                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                    className="h-16 rounded-2xl bg-white/5 border-white/10 text-sm font-medium file:mr-4 file:h-10 file:px-6 file:rounded-xl file:border-0 file:text-xs file:font-black file:uppercase file:tracking-widest file:bg-emerald-500/10 file:text-emerald-500 hover:file:bg-emerald-500/20 cursor-pointer flex items-center"
                                />
                            </div>

                            <motion.div 
                                whileHover={{ scale: 1.02, y: -1 }}
                                whileTap={{ scale: 0.98 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                            >
                            <Button 
                                type="submit" 
                                className="w-full h-16 md:h-20 bg-emerald-500 hover:bg-emerald-600 dark:hover:bg-emerald-400 text-white text-lg md:text-xl font-black rounded-2xl md:rounded-[2rem] shadow-2xl shadow-emerald-500/20 disabled:opacity-50 transition-colors active:scale-[0.98] mt-4 select-none"
                                disabled={isUploading || isPending || isConfirming || !connectedAddress}
                            >
                                {isUploading ? (
                                    <div className="flex items-center gap-3">
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Creating Cloud Proof...
                                    </div>
                                ) : isPending ? 'Check ID...' : 
                                  isConfirming ? 'Finalizing...' : 
                                  !isConnected ? 'Connect ID First' : (
                                    <div className="flex items-center gap-2 md:gap-3">
                                        <Zap className="w-5 h-5 md:w-6 md:h-6 fill-current" strokeWidth={1.5} />
                                        Issue Receipt
                                    </div>
                                  )}
                            </Button>
                            </motion.div>
                            
                            <p className="text-[10px] text-center text-muted-foreground font-black uppercase tracking-[0.2em] opacity-40">
                                Network processing fee applies (Sepolia Testnet)
                            </p>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
      </main>
    </div>
  );
}
