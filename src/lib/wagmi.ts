import { createConfig, http } from "wagmi";
import { mainnet, sepolia, localhost } from "wagmi/chains";
import { getDefaultConfig } from "connectkit";

// Ensure we have a valid metadata URL for mobile deep-linking
// Priority: manual env var > Vercel system var > production hardcoded fallback
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 
               (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : "https://ecoreceipt.vercel.app");

export const config = createConfig(
  getDefaultConfig({
    // Required API Keys
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "a806c221daf3636259f4a532feba4388", 

    // Required App Info
    appName: "EcoReceipt",

    // Optional App Info
    appDescription: "ESG-focused Decentralized Application for programmable receipts",
    appUrl: appUrl,
    appIcon: `${appUrl}/logo.png`,

    chains: [sepolia, mainnet, localhost],
    ssr: true, // Crucial for mobile device detection & hydration
    transports: {
      [sepolia.id]: http(),
      [mainnet.id]: http(),
      [localhost.id]: http(),
    },
  })
);
