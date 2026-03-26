'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf, Droplets, Cloud } from 'lucide-react';
import { motion } from 'framer-motion';

interface EcoImpactWidgetProps {
  totalReceipts: number;
}

export const EcoImpactWidget = ({ totalReceipts }: EcoImpactWidgetProps) => {
  const paperSaved = (totalReceipts * 0.01).toFixed(2); // KG
  const waterSaved = (totalReceipts * 0.5).toFixed(1); // Liters
  const carbonOffset = (totalReceipts * 0.005).toFixed(3); // KG

  const stats = [
    { name: 'Paper Saved', value: `${paperSaved}kg`, icon: Leaf, color: 'text-emerald-500' },
    { name: 'Water Saved', value: `${waterSaved}L`, icon: Droplets, color: 'text-blue-500' },
    { name: 'Carbon Offset', value: `${carbonOffset}kg`, icon: Cloud, color: 'text-slate-500' },
  ];

  return (
    <Card className="glass border-none shadow-xl overflow-hidden relative">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Leaf className="w-24 h-24 text-emerald-500" />
      </div>
      
      <CardHeader>
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          Eco-Impact Tracker
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-4">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-center gap-4 bg-white/40 dark:bg-black/10 p-3 rounded-2xl border border-white/20"
              >
                <div className={cn("p-2 rounded-xl bg-white/80 shadow-sm", stat.color)}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{stat.name}</p>
                  <p className="text-xl font-black">{stat.value}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
        
        <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20 text-center">
            <p className="text-sm font-semibold text-emerald-700">
                You've saved the equivalent of <span className="font-bold underline">{(totalReceipts / 100).toFixed(1)} trees</span> so far!
            </p>
        </div>
      </CardContent>
    </Card>
  );
};

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
  }
