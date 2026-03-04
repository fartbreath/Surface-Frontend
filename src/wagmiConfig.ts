import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { mainnet, sepolia, arbitrum, base } from 'wagmi/chains'
import { http } from 'wagmi'

export const wagmiConfig = getDefaultConfig({
  appName: 'Surface Vault Manager',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ?? 'fallback',
  chains: [sepolia, mainnet, arbitrum, base],
  transports: {
    [sepolia.id]:  http('https://1rpc.io/sepolia'),
    [mainnet.id]:  http('https://eth.llamarpc.com'),
    [arbitrum.id]: http('https://arb1.arbitrum.io/rpc'),
    [base.id]:     http('https://mainnet.base.org'),
  },
  ssr: false,
})
