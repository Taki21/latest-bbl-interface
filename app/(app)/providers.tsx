'use client';

import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {http} from 'viem';
import {base} from 'viem/chains';

import type {PrivyClientConfig} from '@privy-io/react-auth';
import {PrivyProvider} from '@privy-io/react-auth';

// 1. 'wagmi'에서 createConfig를 import합니다.
import { createConfig } from 'wagmi'; 

const queryClient = new QueryClient();

export const wagmiConfig = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(),
  },
});

const privyConfig: PrivyClientConfig = {
  embeddedWallets: {
    createOnLogin: 'users-without-wallets',
  },
  loginMethods: ['google', 'email'],
  appearance: {
    showWalletLoginFirst: false,
  },
};

export function Providers({children}: {children: React.ReactNode}) {
  return (
    <PrivyProvider
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      apiUrl={process.env.NEXT_PUBLIC_PRIVY_AUTH_URL as string}
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID as string}
      config={privyConfig}
      
      // 2. Wagmi 설정을 여기에 직접 전달합니다.
      wagmiVersion="2" 
      wagmiConfig={wagmiConfig} 
    >
      <QueryClientProvider client={queryClient}>
        {/* 3. <WagmiProvider> 없이 children을 바로 렌더링합니다. */}
        {children}
      </QueryClientProvider>
    </PrivyProvider>
  );
}