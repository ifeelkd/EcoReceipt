import { createConfig, http } from "wagmi";
import { mainnet, sepolia, localhost } from "wagmi/chains";
import { getDefaultConfig } from "connectkit";

// CRITICAL: The metadata URL must match the primary domain for mobile deep-linking
const appUrl = "https://ecoreceipt.vercel.app";

export const config = createConfig(
  getDefaultConfig({
    // Required API Keys - ensuring fallback is a valid ID if env var is missing in Vercel settings
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
