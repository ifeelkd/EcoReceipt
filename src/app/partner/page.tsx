'use client';

import React, { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Briefcase, Building2, Store, CheckCircle2, ArrowRight, User } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function PartnerPage() {
    const [businessName, setBusinessName] = useState('');
    const [email, setEmail] = useState('');
    const [walletAddress, setWalletAddress] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!walletAddress.startsWith('0x') || walletAddress.length !== 42) {
            return toast.error("Invalid Wallet Address. Must be a 42-character Web3 address starting with 0x.");
        }

        setIsSubmitting(true);

        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Save to localStorage
        try {
            const existingRaw = localStorage.getItem('eco_pending_partners');
            const pending = existingRaw ? JSON.parse(existingRaw) : [];
            
            pending.push({
                id: Date.now().toString(),
                businessName,
                email,
                walletAddress,
                status: 'pending',
                appliedAt: new Date().toISOString()
            });

            localStorage.setItem('eco_pending_partners', JSON.stringify(pending));
            
            toast.success("Application Submitted Successfully!", { duration: 5000 });
            setIsSuccess(true);
        } catch (err) {
            console.error("Storage Error", err);
            toast.error("Failed to submit application. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background pb-32 md:pb-12 overflow-x-hidden pt-20">
            <Navigation />

            <main className="max-w-5xl mx-auto px-4 md:px-6 py-12 md:py-20 lg:py-24 space-y-12">
                <AnimatePresence mode="wait">
                    {!isSuccess ? (
                        <motion.div 
                            key="form"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95, y: -20 }}
                            transition={{ duration: 0.4, type: 'spring', stiffness: 300, damping: 25 }}
                            className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center"
                        >
                            <div className="space-y-6 md:space-y-10 order-2 lg:order-1">
                                <div className="space-y-4">
                                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-[1.1] uppercase">
                                        Join The <br />
                                        <span className="text-indigo-500">Network.</span>
                                    </h1>
                                    <p className="text-muted-foreground text-base md:text-xl font-medium leading-relaxed max-w-md">
                                        Become a certified Eco Receipt partner. Upgrade your retail infrastructure with decentralized Proof of Purchase.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    {[
                                        { icon: Store, title: "Frictionless Integration", desc: "Native API and Terminal." },
                                        { icon: Briefcase, title: "Zero Paper Costs", desc: "100% Digital Issuance." },
                                    ].map((feat, idx) => (
                                        <div key={idx} className="p-4 md:p-6 glass rounded-[2rem] border-white/20 flex items-center gap-4 shadow-xl">
                                            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shadow-lg border border-indigo-500/20">
                                                <feat.icon className="w-6 h-6 md:w-7 md:h-7" strokeWidth={1.5} />
                                            </div>
                                            <div>
                                                <p className="text-lg font-bold">{feat.title}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-70">{feat.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="order-1 lg:order-2">
                                <Card className="glass border-none shadow-2xl rounded-[2.5rem] md:rounded-[3rem] overflow-hidden">
                                    <CardHeader className="p-6 md:p-10 pb-2">
                                        <CardTitle className="text-2xl md:text-3xl font-black uppercase tracking-tight text-indigo-500">Apply for Access</CardTitle>
                                        <p className="text-muted-foreground text-sm font-medium">Connect your franchise wallet to the protocol.</p>
                                    </CardHeader>
                                    <CardContent className="p-6 md:p-10 space-y-6 md:space-y-8">
                                        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                                            
                                            <div className="space-y-3">
                                                <Label className="text-xs uppercase font-black tracking-widest ml-1">Business Name</Label>
                                                <div className="relative">
                                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                    <Input 
                                                        placeholder="e.g. Acme Corp" 
                                                        value={businessName}
                                                        onChange={(e) => setBusinessName(e.target.value)}
                                                        className="pl-12 h-14 md:h-16 rounded-2xl bg-white/5 border-white/10 text-base md:text-lg font-medium focus:bg-indigo-500/10 focus:border-indigo-500/30 transition-all focus:ring-0"
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <Label className="text-xs uppercase font-black tracking-widest ml-1">Work Email</Label>
                                                <div className="relative">
                                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                    <Input 
                                                        type="email"
                                                        placeholder="founder@acme.com" 
                                                        value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                        className="pl-12 h-14 md:h-16 rounded-2xl bg-white/5 border-white/10 text-base md:text-lg font-medium focus:bg-indigo-500/10 focus:border-indigo-500/30 transition-all focus:ring-0"
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <Label className="text-xs uppercase font-black tracking-widest ml-1">Franchise Wallet Address</Label>
                                                <Input 
                                                    placeholder="0x..." 
                                                    value={walletAddress}
                                                    onChange={(e) => setWalletAddress(e.target.value)}
                                                    className="h-14 md:h-16 rounded-2xl bg-white/5 border-white/10 text-base md:text-lg font-medium font-mono focus:bg-indigo-500/10 focus:border-indigo-500/30 transition-all focus:ring-0"
                                                    required
                                                />
                                            </div>

                                            <motion.div 
                                                whileHover={{ scale: 1.02, y: -1 }}
                                                whileTap={{ scale: 0.98 }}
                                                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                            >
                                                <Button 
                                                    type="submit" 
                                                    className="w-full h-16 md:h-20 bg-indigo-500 hover:bg-indigo-600 dark:hover:bg-indigo-400 text-white text-lg md:text-xl font-black rounded-2xl md:rounded-[2rem] shadow-2xl shadow-indigo-500/20 disabled:opacity-50 transition-colors active:scale-[0.98] mt-4"
                                                    disabled={isSubmitting}
                                                >
                                                    {isSubmitting ? (
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                            Encrypting Application...
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 md:gap-3">
                                                            Submit Application
                                                            <ArrowRight className="w-5 h-5 md:w-6 md:h-6" strokeWidth={1.5} />
                                                        </div>
                                                    )}
                                                </Button>
                                            </motion.div>
                                        </form>
                                    </CardContent>
                                </Card>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="success"
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ duration: 0.5, type: 'spring', stiffness: 300, damping: 25 }}
                            className="max-w-2xl mx-auto text-center space-y-8 glass p-8 md:p-16 rounded-[3rem] shadow-2xl border-white/20"
                        >
                            <div className="w-24 h-24 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center mx-auto text-white shadow-xl shadow-emerald-500/30">
                                <CheckCircle2 className="w-12 h-12" strokeWidth={1.5} />
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-[1.1]">
                                Application <br />
                                <span className="text-emerald-500">Received.</span>
                            </h2>
                            <p className="text-muted-foreground text-lg md:text-xl font-medium max-w-md mx-auto">
                                Our administrators are reviewing your franchise wallet. You will receive an email once your `RETAILER_ROLE` has been granted on-chain.
                            </p>
                            <Button 
                                variant="outline" 
                                className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest glass"
                                onClick={() => router.push('/')}
                            >
                                Return Home
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
