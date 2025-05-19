'use client';

import { WagmiProvider, createConfig, http, useAccount, useConnect, useDisconnect } from "wagmi";
import { coinbaseWallet, walletConnect } from "wagmi/connectors";
import { sepolia, mainnet, polygon, base, baseSepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query' 

import { Web3AuthInstance, Web3AuthConnectorInstance } from "./Web3AuthConnectorInstance";
import { Web3AuthProvider } from "@/context/Web3AuthContext";

const queryClient = new QueryClient()

const chainsAllowed = [
  base,
  //baseSepolia
];

const web3AuthInstance = Web3AuthInstance(chainsAllowed);

// Set up client
const config = createConfig({
  chains: [
    base, 
    //baseSepolia
  ],
  transports: {
    [base.id]: http(),
    //[baseSepolia.id]: http(),
  },
  connectors: [
    Web3AuthConnectorInstance(web3AuthInstance, "google"),
    Web3AuthConnectorInstance(web3AuthInstance, "apple"),
  ],
});

export function Providers(props) {
  //const { locale } = useRouter();

  return (
    <Web3AuthProvider web3AuthInstance={web3AuthInstance}>
      <WagmiProvider config={config} initialState={props.initialState}>
        <QueryClientProvider client={queryClient}>
            {props.children}
        </QueryClientProvider>
      </WagmiProvider>
    </Web3AuthProvider>
  );
}