'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Shield, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

interface ReceiptCardProps {
  receipt: {
    id: number;
    itemName: string;
    amount: string;
    category: string;
    timestamp: number;
    warrantyExpiry: number;
    ipfsHash: string;
  };
}

export const ReceiptCard = ({ receipt }: ReceiptCardProps) => {
  const isExpired = Date.now() > receipt.warrantyExpiry * 1000;
  
  return (
    <Card className="glass overflow-hidden border-none shadow-xl hover:shadow-primary/5 transition-all duration-300 group">
      <div className={cn(
        "h-2 w-full",
        isExpired ? "bg-slate-400" : "bg-emerald-500 animate-pulse"
      )} />
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-bold truncate pr-2 group-hover:text-primary transition-colors">
          {receipt.itemName}
        </CardTitle>
        <Badge variant={isExpired ? "secondary" : "default"} className={cn(
          "font-semibold",
          !isExpired && "bg-emerald-500 hover:bg-emerald-600 text-white"
        )}>
          {isExpired ? "Warranty Expired" : "Active Warranty"}
        </Badge>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-3xl font-black tracking-tighter">${receipt.amount}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-widest">{receipt.category}</p>
          </div>
          <div className="text-right space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              {format(new Date(receipt.timestamp * 1000), 'MMM d, yyyy')}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Shield className="w-3.5 h-3.5" />
              Expires {format(new Date(receipt.warrantyExpiry * 1000), 'MMM d, yyyy')}
            </div>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between">
          <a
            href={`https://gateway.pinata.cloud/ipfs/${receipt.ipfsHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] flex items-center gap-1 text-primary hover:underline font-mono"
          >
            <ExternalLink className="w-3 h-3" />
            IPFS: {receipt.ipfsHash.slice(0, 12)}...
          </a>
        </div>
      </CardContent>
    </Card>
  );
};

// Local cn helper if not imported
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
