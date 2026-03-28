import { createConfig, http } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { getDefaultConfig } from "connectkit";

export const config = createConfig(
  getDefaultConfig({
    // Required API Keys
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "df075775438842c67cf7567085c88b43", // Public placeholder or user's

    // Required App Info
    appName: "EcoReceipt",

    // Optional App Info
    appDescription: "ESG-focused Decentralized Application for programmable receipts",
    appUrl: "https://ecoreceipt.xyz",
    appIcon: "https://ecoreceipt.xyz/logo.png",

    chains: [mainnet, sepolia],
    transports: {
      [mainnet.id]: http(),
      [sepolia.id]: http(),
    },
  })
);
