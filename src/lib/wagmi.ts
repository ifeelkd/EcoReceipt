import { createConfig, http } from "wagmi";
import { mainnet, sepolia, localhost as wagmiLocalhost } from "wagmi/chains";
import { getDefaultConfig } from "connectkit";

const ALCHEMY_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || "W91WjxbmOlFUdjwmuD-MT";

// CRITICAL: The metadata URL must match the primary domain for mobile deep-linking
const appUrl = "https://ecoreceipt.vercel.app";

const localhost = {
  ...wagmiLocalhost,
  nativeCurrency: {
    name: "Sepolia Ether",
    symbol: "SepoliaETH",
    decimals: 18,
  },
};

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
      [sepolia.id]: http(`https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`),
      [mainnet.id]: http('https://cloudflare-eth.com'),
      [localhost.id]: http(),
    },
  })
);
