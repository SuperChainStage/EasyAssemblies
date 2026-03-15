import { createNetworkConfig } from '@mysten/dapp-kit';

export const { networkConfig, useNetworkVariable, useNetworkVariables } =
  createNetworkConfig({
    devnet: { url: 'https://fullnode.devnet.sui.io:443', network: 'devnet' as const },
    testnet: { url: 'https://fullnode.testnet.sui.io:443', network: 'testnet' as const },
    mainnet: { url: 'https://fullnode.mainnet.sui.io:443', network: 'mainnet' as const },
  });

type Network = 'devnet' | 'testnet' | 'mainnet';
const VALID_NETWORKS: Network[] = ['devnet', 'testnet', 'mainnet'];

const saved =
  typeof window !== 'undefined'
    ? (localStorage.getItem('playmove_network') as Network | null)
    : null;

export const defaultNetwork: Network =
  saved && VALID_NETWORKS.includes(saved) ? saved : 'testnet';
