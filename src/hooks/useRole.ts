'use client';

import { useReadContract, useAccount } from 'wagmi';
import { ECO_RECEIPT_ABI, ECO_RECEIPT_ADDRESS, RETAILER_ROLE } from '@/lib/constants';

/**
 * Hook to check if the currently connected wallet has the RETAILER_ROLE.
 */
export function useIsRetailer() {
  const { address, isConnected } = useAccount();

  const { data: isRetailer, isLoading, isError } = useReadContract({
    address: ECO_RECEIPT_ADDRESS,
    abi: ECO_RECEIPT_ABI,
    functionName: 'hasRole',
    args: address ? [RETAILER_ROLE, address] : undefined,
    query: {
        enabled: isConnected && !!address,
    }
  });

  return {
    isRetailer: !!isRetailer,
    isLoading: isLoading || (isConnected && address && isRetailer === undefined),
    isError
  };
}
