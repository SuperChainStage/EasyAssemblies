export const TESTNET_RPC_URL = 'https://fullnode.testnet.sui.io:443';
export const TESTNET_EXPLORER_BASE_URL = 'https://suiscan.xyz/testnet';
export const TESTNET_WALLET_CHAIN = 'sui:testnet';
export const EVE_FRONTIER_RESOURCES_DOC_URL =
  'https://docs.evefrontier.com/tools/resources';

export const WORLD_CONTRACTS_GIT_URL =
  'https://github.com/evefrontier/world-contracts.git';
export const WORLD_CONTRACTS_SUBDIRECTORY = 'contracts/world';

export type CompilerNetwork = 'testnet';
export type DeploymentTargetId = 'testnet:utopia' | 'testnet:stillness';

export type WorldPackageReference = {
  publishedAt: string;
  originalId: string;
  sourceVersionTag: string;
};

export type DeploymentTargetResources = {
  worldApiUrl: string;
  worldApiDocsUrl: string;
  documentedWorldPackageId: string;
  objectRegistryId: string;
  killmailRegistryId: string;
  serverAddressRegistryId: string;
  locationRegistryId: string;
  energyConfigId: string;
  fuelConfigId: string;
  gateConfigId: string;
  adminAclId: string;
};

export type DeploymentTargetConfig = {
  id: DeploymentTargetId;
  label: string;
  environmentLabel: string;
  compileNetwork: CompilerNetwork;
  walletChain: typeof TESTNET_WALLET_CHAIN;
  rpcUrl: typeof TESTNET_RPC_URL;
  explorerBaseUrl: typeof TESTNET_EXPLORER_BASE_URL;
  worldPackageReference: WorldPackageReference;
  resources: DeploymentTargetResources;
};

export const DEPLOYMENT_TARGET_CONFIGS: Record<
  DeploymentTargetId,
  DeploymentTargetConfig
> = {
  'testnet:utopia': {
    id: 'testnet:utopia',
    label: 'Utopia (testnet)',
    environmentLabel: 'Utopia',
    compileNetwork: 'testnet',
    walletChain: TESTNET_WALLET_CHAIN,
    rpcUrl: TESTNET_RPC_URL,
    explorerBaseUrl: TESTNET_EXPLORER_BASE_URL,
    worldPackageReference: {
      // Synced from world-contracts/contracts/world/Published.toml [published.testnet_utopia].
      publishedAt:
        '0x07e6b810c2dff6df56ea7fbad9ff32f4d84cbee53e496267515887b712924bd1',
      originalId:
        '0xd12a70c74c1e759445d6f209b01d43d860e97fcf2ef72ccbbd00afd828043f75',
      sourceVersionTag: 'v0.0.21',
    },
    resources: {
      // Synced from builder-documentation/tools/resources.md and docs.evefrontier.com/tools/resources.
      worldApiUrl: 'https://world-api-utopia.uat.pub.evefrontier.com',
      worldApiDocsUrl:
        'https://world-api-utopia.uat.pub.evefrontier.com/docs/index.html',
      documentedWorldPackageId:
        '0xd12a70c74c1e759445d6f209b01d43d860e97fcf2ef72ccbbd00afd828043f75',
      objectRegistryId:
        '0xc2b969a72046c47e24991d69472afb2216af9e91caf802684514f39706d7dc57',
      killmailRegistryId:
        '0xa92de75fde403a6ccfcb1d5a380f79befaed9f1a2210e10f1c5867a4cd82b84e',
      serverAddressRegistryId:
        '0x9a9f2f7d1b8cf100feb532223aa6c38451edb05406323af5054f9d974555708b',
      locationRegistryId:
        '0x62e6ec4caea639e21e4b8c3cf0104bace244b3f1760abed340cc3285905651cf',
      energyConfigId:
        '0x9285364e8104c04380d9cc4a001bbdfc81a554aad441c2909c2d3bd52a0c9c62',
      fuelConfigId:
        '0x0f354c803af170ac0d1ac9068625c6321996b3013dc67bdaf14d06f93fa1671f',
      gateConfigId:
        '0x69a392c514c4ca6d771d8aa8bf296d4d7a021e244e792eb6cd7a0c61047fc62b',
      adminAclId:
        '0xa8655c6721967e631d8fd157bc88f7943c5e1263335c4ab553247cd3177d4e86',
    },
  },
  'testnet:stillness': {
    id: 'testnet:stillness',
    label: 'Stillness (testnet)',
    environmentLabel: 'Stillness',
    compileNetwork: 'testnet',
    walletChain: TESTNET_WALLET_CHAIN,
    rpcUrl: TESTNET_RPC_URL,
    explorerBaseUrl: TESTNET_EXPLORER_BASE_URL,
    worldPackageReference: {
      // Synced from world-contracts/contracts/world/Published.toml [published.testnet_stillness].
      publishedAt:
        '0x28b497559d65ab320d9da4613bf2498d5946b2c0ae3597ccfda3072ce127448c',
      originalId:
        '0x28b497559d65ab320d9da4613bf2498d5946b2c0ae3597ccfda3072ce127448c',
      sourceVersionTag: 'v0.0.18',
    },
    resources: {
      // Synced from builder-documentation/tools/resources.md and docs.evefrontier.com/tools/resources.
      worldApiUrl: 'https://world-api-stillness.live.tech.evefrontier.com',
      worldApiDocsUrl:
        'https://world-api-stillness.live.tech.evefrontier.com/docs/index.html',
      documentedWorldPackageId:
        '0x28b497559d65ab320d9da4613bf2498d5946b2c0ae3597ccfda3072ce127448c',
      objectRegistryId:
        '0x454a9aa3d37e1d08d3c9181239c1b683781e4087fbbbd48c935d54b6736fd05c',
      killmailRegistryId:
        '0x7fd9a32d0bbe7b1cfbb7140b1dd4312f54897de946c399edb21c3a12e52ce283',
      serverAddressRegistryId:
        '0xeb97b81668699672b1147c28dacb3d595534c48f4e177d3d80337dbde464f05f',
      locationRegistryId:
        '0xc87dca9c6b2c95e4a0cbe1f8f9eeff50171123f176fbfdc7b49eef4824fc596b',
      energyConfigId:
        '0xd77693d0df5656d68b1b833e2a23cc81eb3875d8d767e7bd249adde82bdbc952',
      fuelConfigId:
        '0x4fcf28a9be750d242bc5d2f324429e31176faecb5b84f0af7dff3a2a6e243550',
      gateConfigId:
        '0xd6d9230faec0230c839a534843396e97f5f79bdbd884d6d5103d0125dc135827',
      adminAclId:
        '0x8ca0e61465f94e60f9c2dadf9566edfe17aa272215d9c924793d2721b3477f93',
    },
  },
};

export const DEPLOYMENT_TARGET_OPTIONS = [
  DEPLOYMENT_TARGET_CONFIGS['testnet:utopia'],
  DEPLOYMENT_TARGET_CONFIGS['testnet:stillness'],
] as const;

export const DEFAULT_DEPLOYMENT_TARGET: DeploymentTargetId = 'testnet:utopia';

export function isDeploymentTargetId(
  value: string,
): value is DeploymentTargetId {
  return value in DEPLOYMENT_TARGET_CONFIGS;
}

export function getDeploymentTargetConfig(
  targetId: DeploymentTargetId,
): DeploymentTargetConfig {
  return DEPLOYMENT_TARGET_CONFIGS[targetId];
}

// ---------------------------------------------------------------------------
// World contract module paths (used for authorization & rule configuration)
// ---------------------------------------------------------------------------

export const WORLD_MODULES = {
  CHARACTER: 'character',
  GATE: 'gate',
  STORAGE_UNIT: 'storage_unit',
  TURRET: 'turret',
} as const;

export type AssemblyComponentType = 'gate' | 'storage_unit' | 'turret';

/** Map from assembly component type → world contract module name. */
export const ASSEMBLY_MODULE: Record<AssemblyComponentType, string> = {
  gate: WORLD_MODULES.GATE,
  storage_unit: WORLD_MODULES.STORAGE_UNIT,
  turret: WORLD_MODULES.TURRET,
};

/** Map from assembly component type → world contract struct name. */
export const ASSEMBLY_STRUCT: Record<AssemblyComponentType, string> = {
  gate: 'Gate',
  storage_unit: 'StorageUnit',
  turret: 'Turret',
};
