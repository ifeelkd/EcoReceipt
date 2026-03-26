'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { ECO_RECEIPT_ABI, ECO_RECEIPT_ADDRESS } from '@/lib/constants';
import { parseEther, formatEther } from 'viem';

export function useReceipts() {
  const { address } = useAccount();

  const { data: receipts, isLoading, refetch } = useReadContract({
    address: ECO_RECEIPT_ADDRESS,
    abi: ECO_RECEIPT_ABI,
    functionName: 'getReceiptsByCustomer',
    args: address ? [address] : undefined,
    query: {
        enabled: !!address,
    }
  });

  return { receipts, isLoading, refetch };
}

export function useIssueReceipt() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const issue = (
    customer: `0x${string}`,
    amount: string,
    currency: string,
    itemName: string,
    warrantyExpiryTimestamp: number,
    cloudProof: string
  ) => {
    writeContract({
      address: ECO_RECEIPT_ADDRESS,
      abi: ECO_RECEIPT_ABI,
      functionName: 'issueReceipt',
      args: [
        customer,
        BigInt(parseEther(amount || "0")), 
        currency,
        itemName,
        BigInt(warrantyExpiryTimestamp),
        cloudProof,
      ],
    });
  };

  return { issue, hash, isPending, isConfirming, isSuccess, error };
}
