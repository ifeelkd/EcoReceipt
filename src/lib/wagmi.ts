import { createConfig, http } from "wagmi";
import { mainnet, sepolia, localhost } from "wagmi/chains";
import { getDefaultConfig } from "connectkit";

// Ensure we have a valid metadata URL for mobile deep-linking
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 
               (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : "http://localhost:3000");

export const config = createConfig(
  getDefaultConfig({
    // Required API Keys
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!, 

    // Required App Info
    appName: "EcoReceipt",

    // Optional App Info
    appDescription: "ESG-focused Decentralized Application for programmable receipts",
    appUrl: appUrl,
    appIcon: `${appUrl}/logo.png`,

    chains: [sepolia, mainnet, localhost],
    transports: {
      [sepolia.id]: http(),
      [mainnet.id]: http(),
      [localhost.id]: http(),
    },
  })
);
