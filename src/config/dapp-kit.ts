import { createNetworkConfig } from '@mysten/dapp-kit';

export const { networkConfig, useNetworkVariable, useNetworkVariables } =
  createNetworkConfig({
    devnet: { url: 'https://fullnode.devnet.sui.io:443' },
    testnet: { url: 'https://fullnode.testnet.sui.io:443' },
    mainnet: { url: 'https://fullnode.mainnet.sui.io:443' },
  });

type Network = 'devnet' | 'testnet' | 'mainnet';
const VALID_NETWORKS: Network[] = ['devnet', 'testnet', 'mainnet'];

const saved =
  typeof window !== 'undefined'
    ? (localStorage.getItem('playmove_network') as Network | null)
    : null;

export const defaultNetwork: Network =
  saved && VALID_NETWORKS.includes(saved) ? saved : 'testnet';
