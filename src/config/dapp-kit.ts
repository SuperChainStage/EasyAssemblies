import { createNetworkConfig } from '@mysten/dapp-kit';

import {
  DEFAULT_DEPLOYMENT_TARGET,
  DEPLOYMENT_TARGET_CONFIGS,
  type DeploymentTargetId,
  type WorldPackageReference,
  isDeploymentTargetId,
} from './constants';

export type DeploymentTargetVariables = {
  targetId: DeploymentTargetId;
  environmentLabel: string;
  compileNetwork: 'testnet';
  walletChain: 'sui:testnet';
  explorerBaseUrl: string;
  worldPackageReference: WorldPackageReference;
};

export const { networkConfig, useNetworkVariable, useNetworkVariables } =
  createNetworkConfig({
    'testnet:utopia': {
      url: DEPLOYMENT_TARGET_CONFIGS['testnet:utopia'].rpcUrl,
      network: 'testnet' as const,
      variables: {
        targetId: 'testnet:utopia',
        environmentLabel:
          DEPLOYMENT_TARGET_CONFIGS['testnet:utopia'].environmentLabel,
        compileNetwork:
          DEPLOYMENT_TARGET_CONFIGS['testnet:utopia'].compileNetwork,
        walletChain: DEPLOYMENT_TARGET_CONFIGS['testnet:utopia'].walletChain,
        explorerBaseUrl:
          DEPLOYMENT_TARGET_CONFIGS['testnet:utopia'].explorerBaseUrl,
        worldPackageReference:
          DEPLOYMENT_TARGET_CONFIGS['testnet:utopia'].worldPackageReference,
      } satisfies DeploymentTargetVariables,
    },
    'testnet:stillness': {
      url: DEPLOYMENT_TARGET_CONFIGS['testnet:stillness'].rpcUrl,
      network: 'testnet' as const,
      variables: {
        targetId: 'testnet:stillness',
        environmentLabel:
          DEPLOYMENT_TARGET_CONFIGS['testnet:stillness'].environmentLabel,
        compileNetwork:
          DEPLOYMENT_TARGET_CONFIGS['testnet:stillness'].compileNetwork,
        walletChain: DEPLOYMENT_TARGET_CONFIGS['testnet:stillness'].walletChain,
        explorerBaseUrl:
          DEPLOYMENT_TARGET_CONFIGS['testnet:stillness'].explorerBaseUrl,
        worldPackageReference:
          DEPLOYMENT_TARGET_CONFIGS['testnet:stillness'].worldPackageReference,
      } satisfies DeploymentTargetVariables,
    },
  });

type Network = DeploymentTargetId;

const saved =
  typeof window !== 'undefined'
    ? localStorage.getItem('playmove_network')
    : null;

export const defaultNetwork: Network =
  saved !== null && isDeploymentTargetId(saved)
    ? saved
    : DEFAULT_DEPLOYMENT_TARGET;
