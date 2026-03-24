import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from '@mysten/dapp-kit';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { SuiObjectChange } from '@mysten/sui/jsonRpc';
import { Transaction } from '@mysten/sui/transactions';
import { fromBase64 } from '@mysten/sui/utils';

import {
  WORLD_CONTRACTS_GIT_URL,
  WORLD_CONTRACTS_SUBDIRECTORY,
  type WorldPackageReference,
} from '@/config/constants';
import { useNetworkVariables } from '@/config/dapp-kit';
import {
  buildMovePackage,
  getSuiMoveVersion,
  initMoveCompiler,
  resolveDependencies,
} from '@zktx.io/sui-move-builder/lite';
import type { ResolvedDependencies } from '@zktx.io/sui-move-builder/lite';

export type BuildResult = Awaited<ReturnType<typeof buildMovePackage>>;
export type BuildSuccess = BuildResult & {
  success: true;
  modules: string[];
  dependencies?: string[];
  digest?: string;
};

const MAX_LOG_LINES = 300;
const UNSUPPORTED_CHARACTER_TRANSFER_CHECK =
  /let is_character =[\s\S]*?assert!\(!is_character, ECharacterTransfer\);/;
const COMPATIBLE_CHARACTER_TRANSFER_CHECK = [
  'let is_character = false;',
  '    assert!(!is_character, ECharacterTransfer);',
].join('\n');

type ResolvedDependencySnapshot = {
  name?: string;
  files?: Record<string, string>;
};

type BuildLogProgressEvent = {
  type: 'resolve_dep' | 'resolve_complete' | 'compile_complete' | string;
  current?: number;
  total?: number;
  name?: string;
  source?: string;
  count?: number;
};

type BuildSuccessWithWarnings = BuildSuccess & {
  warnings?: string;
};

type DependencyResolutionCacheEntry = {
  resolved: ResolvedDependencies;
  worldFiles: Record<string, string>;
  sanitizedChanged: boolean;
};

type GatePostDeployRule =
  | {
      kind: 'tribe';
      module: 'tribe_permit' | 'multi_rule';
      tribeId: number;
      expiryDurationMs?: number;
    }
  | {
      kind: 'toll';
      module: 'toll_gate' | 'multi_rule';
      price: number;
      ownerAddress?: string;
      expiryDurationMs?: number;
    }
  | {
      kind: 'bounty';
      module: 'bounty_gate';
      bountyTypeId: number;
      expiryDurationMs: number;
    };

type GatePostDeployPlan = {
  templateId: string;
  rules: GatePostDeployRule[];
};

export type PostDeployConfigStatus =
  | 'idle'
  | 'ready'
  | 'applying'
  | 'failed'
  | 'applied'
  | 'verifying'
  | 'verified';

export type VerifiedGateConfig = {
  rows: Array<{
    label: string;
    value: string;
  }>;
  verifiedAt: string;
};

export type PostDeployConfigState = {
  status: PostDeployConfigStatus;
  packageId?: string;
  extensionConfigId?: string;
  adminCapId?: string;
  configTxDigest?: string;
  error?: string;
  requestedPlan?: GatePostDeployPlan;
  verification?: VerifiedGateConfig;
};

const DEFAULT_TRIBE_ID = 100;
const DEFAULT_EXPIRY_MS = 3_600_000;
const DEFAULT_PRICE_MIST = 100_000_000;
const DEFAULT_BOUNTY_TYPE_ID = 1001;

const WORLD_DEPENDENCY_LINE_PATTERN =
  /^\s*world\s*=\s*\{(?=.*git\s*=\s*"https:\/\/github\.com\/evefrontier\/world-contracts\.git")(?=.*subdir\s*=\s*"contracts\/world")(?=.*rev\s*=\s*"[^"]+").*\}\s*$/m;

function moveTomlDeclaresWorldDependency(
  moveToml: string | undefined,
): boolean {
  return (
    typeof moveToml === 'string' && /^\s*world\s*=\s*\{.*\}\s*$/m.test(moveToml)
  );
}

function isSectionHeader(line: string): boolean {
  return /^\[[^\]]+\]$/.test(line.trim());
}

function rewriteMoveTomlForTargetWorldDependency(
  moveToml: string,
  sourceVersionTag: string,
): string {
  if (!WORLD_DEPENDENCY_LINE_PATTERN.test(moveToml)) {
    return moveToml;
  }

  return moveToml.replace(
    WORLD_DEPENDENCY_LINE_PATTERN,
    `world = { git = "${WORLD_CONTRACTS_GIT_URL}", subdir = "${WORLD_CONTRACTS_SUBDIRECTORY}", rev = "${sourceVersionTag}" }`,
  );
}

function rewriteMoveTomlForLocalWorldDependency(
  moveToml: string,
  worldPackageId: string,
): string {
  const lines = moveToml.split('\n');
  const result: string[] = [];
  let inAddresses = false;
  let inDependencies = false;
  let sawAddresses = false;
  let sawDependencies = false;
  let worldAddressSet = false;
  let worldDependencySet = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (isSectionHeader(trimmed)) {
      if (inAddresses && !worldAddressSet) {
        result.push(`world = "${worldPackageId}"`);
        worldAddressSet = true;
      }
      if (inDependencies && !worldDependencySet) {
        result.push('world = { local = "deps/world" }');
        worldDependencySet = true;
      }

      inAddresses = /^\[addresses\]$/i.test(trimmed);
      inDependencies = /^\[dependencies\]$/i.test(trimmed);
      sawAddresses ||= inAddresses;
      sawDependencies ||= inDependencies;
      result.push(line);
      continue;
    }

    if (inAddresses && /^\s*world\s*=\s*"[^"]*"\s*$/.test(line)) {
      result.push(`world = "${worldPackageId}"`);
      worldAddressSet = true;
      continue;
    }

    if (inDependencies && /^\s*world\s*=\s*\{.*\}\s*$/.test(line)) {
      result.push('world = { local = "deps/world" }');
      worldDependencySet = true;
      continue;
    }

    result.push(line);
  }

  if (inAddresses && !worldAddressSet) {
    result.push(`world = "${worldPackageId}"`);
    worldAddressSet = true;
  }

  if (inDependencies && !worldDependencySet) {
    result.push('world = { local = "deps/world" }');
    worldDependencySet = true;
  }

  if (!sawAddresses) {
    if (result.length > 0 && result[result.length - 1] !== '') {
      result.push('');
    }
    result.push('[addresses]');
    result.push(`world = "${worldPackageId}"`);
  }

  if (!sawDependencies) {
    if (result.length > 0 && result[result.length - 1] !== '') {
      result.push('');
    }
    result.push('[dependencies]');
    result.push('world = { local = "deps/world" }');
  }

  return result.join('\n');
}

function createWorldDepMoveToml(worldPackageId: string): string {
  return [
    '[package]',
    'name = "world"',
    'edition = "2024.beta"',
    `published-at = "${worldPackageId}"`,
    '',
    '[addresses]',
    `world = "${worldPackageId}"`,
    '',
  ].join('\n');
}

function extractWorldFilesFromResolvedDependencies(
  resolved: ResolvedDependencies,
  worldPackageId: string,
): Record<string, string> {
  try {
    const dependencyPackages = JSON.parse(
      resolved.dependencies,
    ) as ResolvedDependencySnapshot[];
    if (!Array.isArray(dependencyPackages)) {
      return {};
    }

    for (const snapshot of dependencyPackages) {
      if (
        snapshot.name?.toLowerCase() !== 'world' ||
        snapshot.files === undefined
      ) {
        continue;
      }

      const worldFiles: Record<string, string> = {};
      const packagePrefix = `dependencies/${snapshot.name}/`;

      for (const [filePath, content] of Object.entries(snapshot.files)) {
        if (!filePath.startsWith(packagePrefix)) {
          continue;
        }

        const relativePath = filePath.slice(packagePrefix.length);
        if (/^tests\//i.test(relativePath)) {
          continue;
        }

        if (relativePath === 'Move.toml') {
          worldFiles['deps/world/Move.toml'] =
            createWorldDepMoveToml(worldPackageId);
          continue;
        }

        worldFiles[`deps/world/${relativePath}`] = content;
      }

      if (!('deps/world/Move.toml' in worldFiles)) {
        worldFiles['deps/world/Move.toml'] =
          createWorldDepMoveToml(worldPackageId);
      }

      return worldFiles;
    }
  } catch {
    return {};
  }

  return {};
}

function createLocalWorldBuildFiles(
  rootFiles: Record<string, string>,
  worldFiles: Record<string, string>,
  worldPackageId: string,
): Record<string, string> {
  const files: Record<string, string> = {
    'Move.toml': rewriteMoveTomlForLocalWorldDependency(
      rootFiles['Move.toml'] ?? '',
      worldPackageId,
    ),
  };

  for (const [filePath, content] of Object.entries(rootFiles)) {
    if (filePath === 'Move.toml' || filePath.startsWith('deps/world/')) {
      continue;
    }
    files[filePath] = content;
  }

  for (const [filePath, content] of Object.entries(worldFiles)) {
    files[filePath] = content;
  }

  return files;
}

function hasCompilableRootFiles(files: Record<string, string>): boolean {
  return (
    typeof files['Move.toml'] === 'string' &&
    Object.keys(files).some(
      path => path !== 'Move.toml' && path.endsWith('.move'),
    )
  );
}

function createDependencyResolutionCacheKey(
  targetId: string,
  files: Record<string, string>,
): string {
  const manifestFiles = Object.fromEntries(
    Object.entries(files)
      .filter(([path]) => {
        return (
          path === 'Move.toml' ||
          path === 'Move.lock' ||
          path === 'Published.toml' ||
          /^Move\.[^.]+\.toml$/i.test(path)
        );
      })
      .sort(([a], [b]) => a.localeCompare(b)),
  );

  return JSON.stringify({
    targetId,
    manifestFiles,
  });
}

function createWorldOnlyFileMap(
  localWorldFiles: Record<string, string>,
): Record<string, string> {
  const files: Record<string, string> = {};

  for (const [filePath, content] of Object.entries(localWorldFiles)) {
    if (!filePath.startsWith('deps/world/')) {
      continue;
    }
    files[filePath.replace('deps/world/', '')] = content;
  }

  return files;
}

function selectExtensionModules(
  modules: string[],
  worldModuleSet: ReadonlySet<string> | null,
  expectedRootModuleCount: number,
): { modules: string[]; usedFallback: boolean } {
  if (worldModuleSet !== null) {
    const filtered = modules.filter(module => !worldModuleSet.has(module));
    if (filtered.length > 0) {
      return { modules: filtered, usedFallback: false };
    }
  }

  if (expectedRootModuleCount > 0 && modules.length > expectedRootModuleCount) {
    return {
      modules: modules.slice(-expectedRootModuleCount),
      usedFallback: true,
    };
  }

  return { modules, usedFallback: false };
}

function normalizePublishedDependencies(
  dependencies: string[] | undefined,
  worldPackageReference: WorldPackageReference,
): string[] {
  const dependencyLinkPackageId = worldPackageReference.originalId;
  const normalizedDependencies = (dependencies ?? []).map(dependency => {
    if (
      dependency === worldPackageReference.originalId ||
      dependency === worldPackageReference.publishedAt
    ) {
      return dependencyLinkPackageId;
    }
    return dependency;
  });

  if (!normalizedDependencies.includes(dependencyLinkPackageId)) {
    normalizedDependencies.push(dependencyLinkPackageId);
  }

  return Array.from(new Set(normalizedDependencies));
}

function sanitizeDependencySnapshot(
  snapshot: ResolvedDependencySnapshot,
): boolean {
  if (
    !snapshot.name ||
    snapshot.name.toLowerCase() !== 'world' ||
    !snapshot.files
  ) {
    return false;
  }

  const packagePrefix = `dependencies/${snapshot.name}/`;
  let changed = false;

  for (const [filePath, content] of Object.entries(snapshot.files)) {
    if (!filePath.startsWith(packagePrefix)) {
      continue;
    }

    const relativePath = filePath.slice(packagePrefix.length);
    if (/^tests\//i.test(relativePath)) {
      delete snapshot.files[filePath];
      changed = true;
      continue;
    }

    if (
      /access_control\.move$/i.test(relativePath) &&
      UNSUPPORTED_CHARACTER_TRANSFER_CHECK.test(content)
    ) {
      snapshot.files[filePath] = content.replace(
        UNSUPPORTED_CHARACTER_TRANSFER_CHECK,
        COMPATIBLE_CHARACTER_TRANSFER_CHECK,
      );
      changed = true;
    }
  }

  return changed;
}

function sanitizeResolvedDependencies(
  resolved: ResolvedDependencies,
  compilerVersion: string | null,
): { resolved: ResolvedDependencies; changed: boolean } {
  if (compilerVersion !== '1.63.3') {
    return { resolved, changed: false };
  }

  let changed = false;

  const sanitizeJsonArray = (value: string): string => {
    try {
      const parsed = JSON.parse(value) as ResolvedDependencySnapshot[];
      if (!Array.isArray(parsed)) {
        return value;
      }

      let localChanged = false;
      for (const snapshot of parsed) {
        if (sanitizeDependencySnapshot(snapshot)) {
          localChanged = true;
        }
      }

      if (!localChanged) {
        return value;
      }

      changed = true;
      return JSON.stringify(parsed);
    } catch {
      return value;
    }
  };

  const nextResolved: ResolvedDependencies = {
    ...resolved,
    dependencies: sanitizeJsonArray(resolved.dependencies),
    lockfileDependencies: sanitizeJsonArray(resolved.lockfileDependencies),
  };

  return { resolved: nextResolved, changed };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function defaultGateEnabledChips(
  templateId: string | null | undefined,
): string[] {
  switch (templateId) {
    case 'gate_tribe_permit':
      return ['A1', 'C1'];
    case 'gate_toll':
      return ['P1', 'R1', 'C1'];
    case 'gate_bounty':
      return ['I1', 'C1'];
    case 'gate_open_permit':
      return ['C1'];
    case 'gate_multi_rule':
      return ['A1', 'P1', 'R1', 'C1'];
    default:
      return [];
  }
}

function resolveEnabledChips(
  templateId: string | null | undefined,
  rawConfig?: Record<string, unknown>,
): Set<string> {
  const enabled = Array.isArray(rawConfig?.enabledChips)
    ? rawConfig.enabledChips.filter(
        (value): value is string => typeof value === 'string',
      )
    : defaultGateEnabledChips(templateId);

  return new Set(enabled);
}

function resolveChipConfigs(
  rawConfig?: Record<string, unknown>,
): Record<string, Record<string, unknown>> {
  if (!isRecord(rawConfig?.chipConfigs)) {
    return {};
  }

  const chipConfigs: Record<string, Record<string, unknown>> = {};
  for (const [chipId, value] of Object.entries(rawConfig.chipConfigs)) {
    if (isRecord(value)) {
      chipConfigs[chipId] = value;
    }
  }
  return chipConfigs;
}

function readNumericConfig(
  rawConfig: Record<string, unknown> | undefined,
  chipConfigs: Record<string, Record<string, unknown>>,
  chipId: string,
  key: string,
  fallback: number,
  allowZero = false,
): number {
  const rawValue = chipConfigs[chipId]?.[key] ?? rawConfig?.[key];
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  if (allowZero ? parsed >= 0 : parsed > 0) {
    return Math.trunc(parsed);
  }
  return fallback;
}

function readStringConfig(
  rawConfig: Record<string, unknown> | undefined,
  chipConfigs: Record<string, Record<string, unknown>>,
  chipId: string,
  key: string,
  fallback = '',
): string {
  const rawValue = chipConfigs[chipId]?.[key] ?? rawConfig?.[key];
  return typeof rawValue === 'string' ? rawValue.trim() : fallback;
}

function resolveGateDeployPlan(
  templateId: string | null | undefined,
  rawConfig?: Record<string, unknown>,
): GatePostDeployPlan | null {
  if (
    templateId !== 'gate_tribe_permit' &&
    templateId !== 'gate_toll' &&
    templateId !== 'gate_bounty' &&
    templateId !== 'gate_open_permit' &&
    templateId !== 'gate_multi_rule'
  ) {
    return null;
  }

  const enabledChips = resolveEnabledChips(templateId, rawConfig);
  const chipConfigs = resolveChipConfigs(rawConfig);
  const expiryDurationMs = readNumericConfig(
    rawConfig,
    chipConfigs,
    'C1',
    'expiryDurationMs',
    DEFAULT_EXPIRY_MS,
  );
  const tribeId = readNumericConfig(
    rawConfig,
    chipConfigs,
    'A1',
    'tribeId',
    DEFAULT_TRIBE_ID,
  );
  const price = readNumericConfig(
    rawConfig,
    chipConfigs,
    'P1',
    'price',
    DEFAULT_PRICE_MIST,
    true,
  );
  const ownerAddress = readStringConfig(
    rawConfig,
    chipConfigs,
    'R1',
    'ownerAddress',
  );
  const bountyTypeId = readNumericConfig(
    rawConfig,
    chipConfigs,
    'I1',
    'bountyTypeId',
    DEFAULT_BOUNTY_TYPE_ID,
    true,
  );

  switch (templateId) {
    case 'gate_tribe_permit':
      return enabledChips.has('A1')
        ? {
            templateId,
            rules: [
              {
                kind: 'tribe',
                module: 'tribe_permit',
                tribeId,
                expiryDurationMs,
              },
            ],
          }
        : null;
    case 'gate_toll':
      return enabledChips.has('P1')
        ? {
            templateId,
            rules: [
              {
                kind: 'toll',
                module: 'toll_gate',
                price,
                ownerAddress,
                expiryDurationMs,
              },
            ],
          }
        : null;
    case 'gate_bounty':
      return {
        templateId,
        rules: [
          {
            kind: 'bounty',
            module: 'bounty_gate',
            bountyTypeId: enabledChips.has('I1') ? bountyTypeId : 0,
            expiryDurationMs,
          },
        ],
      };
    case 'gate_open_permit':
      return null;
    case 'gate_multi_rule': {
      const rules: GatePostDeployRule[] = [];
      if (enabledChips.has('A1')) {
        rules.push({
          kind: 'tribe',
          module: 'multi_rule',
          tribeId,
        });
      }
      if (enabledChips.has('P1')) {
        rules.push({
          kind: 'toll',
          module: 'multi_rule',
          price,
          ownerAddress,
        });
      }
      return rules.length > 0 ? { templateId, rules } : null;
    }
    default:
      return null;
  }
}

function findChangedObjectIdByType(
  objectChanges: SuiObjectChange[],
  objectType: string,
): string | undefined {
  const match = objectChanges.find(change => {
    return (
      'objectId' in change &&
      'objectType' in change &&
      change.objectType === objectType
    );
  });

  return match !== undefined && 'objectId' in match
    ? match.objectId
    : undefined;
}

function coerceNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && /^\d+$/.test(value)) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function extractMoveStructFields(
  value: unknown,
): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  if (
    'fields' in value &&
    typeof value.fields === 'object' &&
    value.fields !== null
  ) {
    return value.fields as Record<string, unknown>;
  }

  return value as Record<string, unknown>;
}

export function useMoveBuilder(
  files: Record<string, string>,
  options?: {
    templateId?: string | null;
    config?: Record<string, unknown>;
  },
) {
  const [busy, setBusy] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [buildOk, setBuildOk] = useState<boolean | null>(null);
  const [compiled, setCompiled] = useState<BuildResult | null>(null);
  const [packageId, setPackageId] = useState('');
  const [txDigest, setTxDigest] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [postDeployConfig, setPostDeployConfig] =
    useState<PostDeployConfigState>({
      status: 'idle',
    });

  const compilerRef = useRef<Promise<void> | null>(null);
  const versionRef = useRef<string | null>(null);
  const previousTargetRef = useRef<string | null>(null);
  const dependencyCacheRef = useRef<
    Map<string, DependencyResolutionCacheEntry>
  >(new Map());
  const dependencyResolvePromiseRef = useRef<
    Map<string, Promise<DependencyResolutionCacheEntry>>
  >(new Map());

  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutateAsync: signAndExecuteTransaction } =
    useSignAndExecuteTransaction();

  const {
    targetId,
    environmentLabel,
    compileNetwork,
    walletChain,
    worldPackageReference,
  } = useNetworkVariables();
  const gateDeployPlan = resolveGateDeployPlan(
    options?.templateId,
    options?.config,
  );

  const addLog = useCallback((msg: string) => {
    const ts = new Date().toLocaleTimeString();
    setLogs(prev => {
      const next = [...prev, `[${ts}] ${msg}`];
      return next.length > MAX_LOG_LINES
        ? next.slice(next.length - MAX_LOG_LINES)
        : next;
    });
  }, []);

  const ensureCompilerVersion = useCallback(async (): Promise<string> => {
    try {
      if (!compilerRef.current) {
        compilerRef.current = initMoveCompiler();
      }
      await compilerRef.current;
    } catch (error) {
      compilerRef.current = null;
      throw error;
    }

    const compilerVersion = versionRef.current ?? (await getSuiMoveVersion());
    versionRef.current = compilerVersion;
    return compilerVersion;
  }, []);

  const prepareFilesForTarget = useCallback(
    (inputFiles: Record<string, string>): Record<string, string> => {
      const moveToml = inputFiles['Move.toml'] ?? '';
      const targetMoveToml = rewriteMoveTomlForTargetWorldDependency(
        moveToml,
        worldPackageReference.sourceVersionTag,
      );

      return targetMoveToml === moveToml
        ? inputFiles
        : {
            ...inputFiles,
            'Move.toml': targetMoveToml,
          };
    },
    [worldPackageReference.sourceVersionTag],
  );

  const resolveBuildDependencies = useCallback(
    async (
      preparedFiles: Record<string, string>,
      compilerVersion: string,
    ): Promise<{
      entry: DependencyResolutionCacheEntry;
      fromCache: boolean;
    }> => {
      const cacheKey = createDependencyResolutionCacheKey(
        targetId,
        preparedFiles,
      );
      const cached = dependencyCacheRef.current.get(cacheKey);
      if (cached) {
        return { entry: cached, fromCache: true };
      }

      let pending = dependencyResolvePromiseRef.current.get(cacheKey);
      if (!pending) {
        pending = (async () => {
          const resolved = await resolveDependencies({
            files: preparedFiles,
            ansiColor: true,
            network: compileNetwork,
          });
          const sanitized = sanitizeResolvedDependencies(
            resolved,
            compilerVersion,
          );

          const entry: DependencyResolutionCacheEntry = {
            resolved: sanitized.resolved,
            worldFiles: moveTomlDeclaresWorldDependency(
              preparedFiles['Move.toml'],
            )
              ? extractWorldFilesFromResolvedDependencies(
                  sanitized.resolved,
                  worldPackageReference.originalId,
                )
              : {},
            sanitizedChanged: sanitized.changed,
          };

          dependencyCacheRef.current.set(cacheKey, entry);
          return entry;
        })().finally(() => {
          dependencyResolvePromiseRef.current.delete(cacheKey);
        });

        dependencyResolvePromiseRef.current.set(cacheKey, pending);
      }

      return {
        entry: await pending,
        fromCache: false,
      };
    },
    [compileNetwork, targetId, worldPackageReference.originalId],
  );

  useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        const v = await ensureCompilerVersion();
        if (canceled) return;
        const ts = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, `[${ts}] 📌 Compiler ready — ${v}`]);
      } catch {
        return;
      }
    })();
    return () => {
      canceled = true;
    };
  }, [ensureCompilerVersion]);

  useEffect(() => {
    if (!hasCompilableRootFiles(files)) {
      return;
    }

    const preparedFiles = prepareFilesForTarget(files);
    const cacheKey = createDependencyResolutionCacheKey(
      targetId,
      preparedFiles,
    );
    if (
      dependencyCacheRef.current.has(cacheKey) ||
      dependencyResolvePromiseRef.current.has(cacheKey)
    ) {
      return;
    }

    let canceled = false;
    void (async () => {
      try {
        const compilerVersion = await ensureCompilerVersion();
        await resolveBuildDependencies(preparedFiles, compilerVersion);
      } catch {
        if (canceled) return;
        // Ignore warm-up failures; build will surface the actionable error.
      }
    })();

    return () => {
      canceled = true;
    };
  }, [
    files,
    targetId,
    ensureCompilerVersion,
    prepareFilesForTarget,
    resolveBuildDependencies,
  ]);

  useEffect(() => {
    if (
      previousTargetRef.current !== null &&
      previousTargetRef.current !== targetId
    ) {
      const ts = new Date().toLocaleTimeString();
      setLogs(prev => [
        ...prev,
        `[${ts}] 🎯 Target changed to ${environmentLabel} (${targetId}); rebuild required`,
      ]);
      setBuildOk(null);
      setCompiled(null);
      setPackageId('');
      setTxDigest('');
      setPostDeployConfig({ status: 'idle' });
    }

    previousTargetRef.current = targetId;
  }, [environmentLabel, targetId]);

  const verifyGatePostDeployConfig = useCallback(
    async (input: {
      packageId: string;
      extensionConfigId: string;
      requestedPlan: GatePostDeployPlan;
      preserveStatusOnFailure?: PostDeployConfigStatus;
    }): Promise<VerifiedGateConfig | null> => {
      setPostDeployConfig(prev => ({
        ...prev,
        status: 'verifying',
        error: undefined,
      }));
      addLog('🔎 Reading back on-chain gate config…');

      try {
        const dynamicFields = await suiClient.getDynamicFields({
          parentId: input.extensionConfigId,
        });
        const objectIdByFieldType = new Map(
          dynamicFields.data.map(field => [field.name.type, field.objectId]),
        );

        const readFieldValue = async (
          fieldType: string,
        ): Promise<Record<string, unknown> | null> => {
          const fieldObjectId = objectIdByFieldType.get(fieldType);
          if (!fieldObjectId) {
            return null;
          }

          const response = await suiClient.getObject({
            id: fieldObjectId,
            options: { showContent: true },
          });
          const content = response.data?.content;
          if (content?.dataType !== 'moveObject') {
            return null;
          }

          const dynamicField = extractMoveStructFields(content.fields);
          if (dynamicField === null) {
            return null;
          }

          return extractMoveStructFields(dynamicField.value);
        };
        const rows: VerifiedGateConfig['rows'] = [];

        for (const rule of input.requestedPlan.rules) {
          switch (rule.kind) {
            case 'tribe': {
              const tribeValue = await readFieldValue(
                `${input.packageId}::${rule.module}::TribeConfigKey`,
              );
              rows.push({
                label: 'Tribe',
                value: String(coerceNumber(tribeValue?.tribe) ?? '-'),
              });
              if (rule.expiryDurationMs !== undefined) {
                rows.push({
                  label: 'Permit Ms',
                  value: String(
                    coerceNumber(tribeValue?.expiry_duration_ms) ?? '-',
                  ),
                });
              }
              break;
            }
            case 'toll': {
              const tollValue = await readFieldValue(
                `${input.packageId}::${rule.module}::TollConfigKey`,
              );
              rows.push({
                label: 'Price',
                value: String(coerceNumber(tollValue?.price) ?? '-'),
              });
              rows.push({
                label: 'Owner',
                value:
                  typeof tollValue?.owner_address === 'string'
                    ? tollValue.owner_address
                    : '-',
              });
              if (rule.expiryDurationMs !== undefined) {
                rows.push({
                  label: 'Permit Ms',
                  value: String(
                    coerceNumber(tollValue?.expiry_duration_ms) ?? '-',
                  ),
                });
              }
              break;
            }
            case 'bounty': {
              const bountyValue = await readFieldValue(
                `${input.packageId}::${rule.module}::BountyConfigKey`,
              );
              rows.push({
                label: 'Bounty Type',
                value: String(coerceNumber(bountyValue?.bounty_type_id) ?? '-'),
              });
              rows.push({
                label: 'Permit Ms',
                value: String(
                  coerceNumber(bountyValue?.expiry_duration_ms) ?? '-',
                ),
              });
              break;
            }
          }
        }

        const verification: VerifiedGateConfig = {
          rows,
          verifiedAt: new Date().toISOString(),
        };

        setPostDeployConfig(prev => ({
          ...prev,
          status: 'verified',
          verification,
          error: undefined,
        }));
        if (verification.rows.length === 0) {
          addLog('✅ Readback verified no dynamic gate rules');
        } else {
          for (const row of verification.rows) {
            addLog(`✅ Readback verified ${row.label}: ${row.value}`);
          }
        }

        return verification;
      } catch (error) {
        const message = String(error);
        setPostDeployConfig(prev => ({
          ...prev,
          status: input.preserveStatusOnFailure ?? 'applied',
          error: message,
        }));
        addLog(`⚠️ Readback failed: ${message}`);
        return null;
      }
    },
    [addLog, suiClient],
  );

  const applyGatePostDeployConfig = useCallback(
    async (input: {
      packageId: string;
      extensionConfigId: string;
      adminCapId: string;
      requestedPlan: GatePostDeployPlan;
    }): Promise<void> => {
      setPostDeployConfig(prev => ({
        ...prev,
        status: 'applying',
        packageId: input.packageId,
        extensionConfigId: input.extensionConfigId,
        adminCapId: input.adminCapId,
        requestedPlan: input.requestedPlan,
        verification: undefined,
        error: undefined,
      }));

      addLog('⚙️ Applying post-deploy gate config…');

      const configTx = new Transaction();
      const extensionConfigObject = configTx.object(input.extensionConfigId);
      const adminCapObject = configTx.object(input.adminCapId);

      for (const rule of input.requestedPlan.rules) {
        switch (rule.kind) {
          case 'tribe':
            if (rule.module === 'tribe_permit') {
              addLog(
                `  tribe_permit.tribe_id=${rule.tribeId}, permit_expiry_ms=${rule.expiryDurationMs ?? DEFAULT_EXPIRY_MS}`,
              );
              configTx.moveCall({
                target: `${input.packageId}::tribe_permit::set_tribe_config`,
                arguments: [
                  extensionConfigObject,
                  adminCapObject,
                  configTx.pure.u32(rule.tribeId),
                  configTx.pure.u64(rule.expiryDurationMs ?? DEFAULT_EXPIRY_MS),
                ],
              });
            } else {
              addLog(`  multi_rule.tribe_id=${rule.tribeId}`);
              configTx.moveCall({
                target: `${input.packageId}::multi_rule::set_tribe_config`,
                arguments: [
                  extensionConfigObject,
                  adminCapObject,
                  configTx.pure.u32(rule.tribeId),
                ],
              });
            }
            break;
          case 'toll': {
            const ownerAddress =
              rule.ownerAddress && rule.ownerAddress.length > 0
                ? rule.ownerAddress
                : account?.address;
            if (!ownerAddress) {
              throw new Error(
                'Missing owner address for toll config; connect a wallet or provide one explicitly.',
              );
            }

            if (rule.module === 'toll_gate') {
              addLog(
                `  toll_gate.price=${rule.price}, owner=${ownerAddress}, permit_expiry_ms=${rule.expiryDurationMs ?? DEFAULT_EXPIRY_MS}`,
              );
              configTx.moveCall({
                target: `${input.packageId}::toll_gate::set_toll_config`,
                arguments: [
                  extensionConfigObject,
                  adminCapObject,
                  configTx.pure.u64(rule.price),
                  configTx.pure.address(ownerAddress),
                  configTx.pure.u64(rule.expiryDurationMs ?? DEFAULT_EXPIRY_MS),
                ],
              });
            } else {
              addLog(`  multi_rule.price=${rule.price}, owner=${ownerAddress}`);
              configTx.moveCall({
                target: `${input.packageId}::multi_rule::set_toll_config`,
                arguments: [
                  extensionConfigObject,
                  adminCapObject,
                  configTx.pure.u64(rule.price),
                  configTx.pure.address(ownerAddress),
                ],
              });
            }
            break;
          }
          case 'bounty':
            addLog(
              `  bounty_gate.bounty_type_id=${rule.bountyTypeId}, permit_expiry_ms=${rule.expiryDurationMs}`,
            );
            configTx.moveCall({
              target: `${input.packageId}::bounty_gate::set_bounty_config`,
              arguments: [
                extensionConfigObject,
                adminCapObject,
                configTx.pure.u64(rule.bountyTypeId),
                configTx.pure.u64(rule.expiryDurationMs),
              ],
            });
            break;
        }
      }

      try {
        const configRes = await signAndExecuteTransaction({
          transaction: configTx,
          chain: walletChain,
        });

        setPostDeployConfig(prev => ({
          ...prev,
          status: 'applied',
          configTxDigest: configRes.digest,
          error: undefined,
        }));

        if (configRes.digest) {
          addLog(`📜 Config tx digest: ${configRes.digest}`);
          await suiClient.waitForTransaction({
            digest: configRes.digest,
            options: { showEffects: true },
          });
        }
        addLog(`✅ Post-deploy config applied to ${input.extensionConfigId}`);

        await verifyGatePostDeployConfig({
          packageId: input.packageId,
          extensionConfigId: input.extensionConfigId,
          requestedPlan: input.requestedPlan,
          preserveStatusOnFailure: 'applied',
        });
      } catch (error) {
        const message = String(error);
        setPostDeployConfig(prev => ({
          ...prev,
          status: 'failed',
          packageId: input.packageId,
          extensionConfigId: input.extensionConfigId,
          adminCapId: input.adminCapId,
          requestedPlan: input.requestedPlan,
          error: message,
        }));
        addLog(`⚠️ Post-deploy config failed: ${message}`);
        addLog(
          `⚠️ You can retry later with AdminCap ${input.adminCapId} and ExtensionConfig ${input.extensionConfigId}`,
        );
      }
    },
    [
      account,
      addLog,
      signAndExecuteTransaction,
      suiClient,
      verifyGatePostDeployConfig,
      walletChain,
    ],
  );

  const onRetryPostDeployConfig = useCallback(async () => {
    if (
      postDeployConfig.packageId === undefined ||
      postDeployConfig.extensionConfigId === undefined ||
      postDeployConfig.adminCapId === undefined ||
      postDeployConfig.requestedPlan === undefined
    ) {
      addLog('⚠️ No pending post-deploy config to retry');
      return;
    }

    await applyGatePostDeployConfig({
      packageId: postDeployConfig.packageId,
      extensionConfigId: postDeployConfig.extensionConfigId,
      adminCapId: postDeployConfig.adminCapId,
      requestedPlan: postDeployConfig.requestedPlan,
    });
  }, [addLog, applyGatePostDeployConfig, postDeployConfig]);

  const onRefreshPostDeployConfig = useCallback(async () => {
    if (
      postDeployConfig.packageId === undefined ||
      postDeployConfig.extensionConfigId === undefined ||
      postDeployConfig.requestedPlan === undefined
    ) {
      addLog('⚠️ No deployed gate config available to refresh');
      return;
    }

    await verifyGatePostDeployConfig({
      packageId: postDeployConfig.packageId,
      extensionConfigId: postDeployConfig.extensionConfigId,
      requestedPlan: postDeployConfig.requestedPlan,
      preserveStatusOnFailure:
        postDeployConfig.status === 'failed' ? 'failed' : 'applied',
    });
  }, [addLog, postDeployConfig, verifyGatePostDeployConfig]);

  const onBuild = async () => {
    addLog('── ── ── ── ──');
    addLog('🚀 Build started');
    addLog(`🎯 Target: ${environmentLabel} (${targetId})`);
    setBuildOk(null);
    setCompiled(null);
    setPackageId('');
    setTxDigest('');
    setPostDeployConfig({ status: 'idle' });
    setBusy(true);

    const start = performance.now();
    try {
      if (!hasCompilableRootFiles(files)) {
        addLog('⏳ Template files are still loading; retry in a moment');
        setBuildOk(false);
        return;
      }

      const compilerVersion = await ensureCompilerVersion();
      const preparedFiles = prepareFilesForTarget(files);
      if (preparedFiles !== files) {
        addLog(
          `📦 Target ${environmentLabel} uses world source ${worldPackageReference.sourceVersionTag}`,
        );
      }

      addLog('📦 Resolving dependencies…');
      const dependencyResolution = await resolveBuildDependencies(
        preparedFiles,
        compilerVersion,
      );
      if (dependencyResolution.fromCache) {
        addLog('♻️ Reused warmed dependency resolution');
      }
      if (dependencyResolution.entry.sanitizedChanged) {
        addLog(
          `⚠️ Applied world v0.0.18 compatibility patch for browser compiler ${compilerVersion}`,
        );
      }

      const rootSourceFiles = Object.fromEntries(
        Object.entries(preparedFiles).filter(
          ([p]) => p === 'Move.toml' || p.endsWith('.move'),
        ),
      );
      const rootModuleCount = Object.keys(rootSourceFiles).filter(
        path => path !== 'Move.toml' && path.endsWith('.move'),
      ).length;
      const shouldUseLocalWorldBuild = moveTomlDeclaresWorldDependency(
        preparedFiles['Move.toml'],
      );

      let buildFiles = rootSourceFiles;
      let buildResolvedDependencies: ResolvedDependencies | undefined =
        dependencyResolution.entry.resolved;
      let localWorldBuildApplied = false;

      if (shouldUseLocalWorldBuild) {
        const worldFiles = dependencyResolution.entry.worldFiles;
        if (Object.keys(worldFiles).length > 0) {
          buildFiles = createLocalWorldBuildFiles(
            rootSourceFiles,
            worldFiles,
            worldPackageReference.originalId,
          );
          buildResolvedDependencies = undefined;
          localWorldBuildApplied = true;
          addLog(
            `📦 Re-linked world dependency through local deps/world -> ${worldPackageReference.originalId}`,
          );
        } else {
          addLog(
            '⚠️ Could not extract world source from resolved dependencies; falling back to direct dependency build',
          );
        }
      }

      addLog('🔨 Compiling…');

      const result = await buildMovePackage({
        files: buildFiles,
        resolvedDependencies: buildResolvedDependencies,
        silenceWarnings: false,
        ansiColor: true,
        network: compileNetwork,
        onProgress: (ev: BuildLogProgressEvent) => {
          switch (ev.type) {
            case 'resolve_dep':
              addLog(
                `  dep [${ev.current}/${ev.total}]: ${ev.name} (${ev.source})`,
              );
              break;
            case 'resolve_complete':
              addLog(`Dependencies resolved (${ev.count})`);
              break;
            case 'compile_complete':
              addLog('Compilation complete');
              break;
          }
        },
      });

      const elapsed = ((performance.now() - start) / 1000).toFixed(1);

      if ('error' in result && result.error) {
        addLog('❌ Build failed');
        addLog(result.error);
        setBuildOk(false);
      } else {
        const success = result as BuildSuccess;
        let modules = success.modules ?? [];
        let dependencies = success.dependencies ?? [];

        if (localWorldBuildApplied && worldPackageReference !== undefined) {
          const worldOnlyFiles = createWorldOnlyFileMap(buildFiles);
          let worldModuleSet: ReadonlySet<string> | null = null;

          try {
            const worldOnlyResult = await buildMovePackage({
              files: worldOnlyFiles,
              silenceWarnings: true,
              ansiColor: true,
              network: compileNetwork,
            });
            if (!('error' in worldOnlyResult)) {
              worldModuleSet = new Set(worldOnlyResult.modules);
            }
          } catch {
            worldModuleSet = null;
          }

          const selectedModules = selectExtensionModules(
            modules,
            worldModuleSet,
            rootModuleCount,
          );
          modules = selectedModules.modules;
          dependencies = normalizePublishedDependencies(
            dependencies,
            worldPackageReference,
          );

          if (worldModuleSet !== null) {
            addLog(
              `📦 Filtered bundled world modules (${success.modules.length} -> ${modules.length})`,
            );
          } else if (selectedModules.usedFallback) {
            addLog(
              `⚠️ World-only module detection failed; keeping the last ${modules.length} root modules`,
            );
          }
        }

        const normalizedSuccess = {
          ...success,
          modules,
          dependencies,
        } as BuildSuccessWithWarnings;
        const warnings = normalizedSuccess.warnings;
        addLog(`✅ Build succeeded in ${elapsed}s`);
        addLog(`Digest: ${normalizedSuccess.digest ?? '-'}`);
        addLog(`Modules: ${normalizedSuccess.modules?.length ?? 0}`);
        if (warnings) addLog(`⚠️ ${warnings}`);
        setBuildOk(true);
        setCompiled(normalizedSuccess);
      }
    } catch (e) {
      addLog(`❌ ${String(e)}`);
      setBuildOk(false);
    } finally {
      setBusy(false);
    }
  };

  const onDeploy = async () => {
    if (!compiled || !account) return;
    const comp = compiled as BuildSuccess;
    if (!comp.modules?.length) return;

    setPackageId('');
    setTxDigest('');
    setIsPublishing(true);
    addLog(`🚀 Publishing to ${environmentLabel} (${targetId})…`);

    const tx = new Transaction();
    const modules = comp.modules.map(
      (m: string) => Array.from(fromBase64(m)) as number[],
    );
    const [upgradeCap] = tx.publish({
      modules,
      dependencies: comp.dependencies ?? [],
    });
    tx.transferObjects([upgradeCap], tx.pure.address(account.address));

    try {
      const res = await signAndExecuteTransaction({
        transaction: tx,
        chain: walletChain,
      });
      const digest = res.digest;
      if (!digest) {
        addLog('❌ Transaction failed (no digest)');
        return;
      }
      addLog(`📜 Tx digest: ${digest}`);
      setTxDigest(digest);

      try {
        const txb = await suiClient.waitForTransaction({
          digest,
          options: { showEffects: true, showObjectChanges: true },
        });

        const objectChanges = txb.objectChanges ?? [];
        const createdPkgInfo = objectChanges.find(
          (
            change,
          ): change is Extract<
            (typeof objectChanges)[number],
            { type: 'published' }
          > => change.type === 'published',
        );
        const createdPkg = createdPkgInfo?.packageId;
        if (createdPkg) {
          addLog(`📦 Package ID: ${createdPkg}`);
          setPackageId(createdPkg);

          if (gateDeployPlan !== null) {
            const extensionConfigId = findChangedObjectIdByType(
              objectChanges,
              `${createdPkg}::config::ExtensionConfig`,
            );
            const adminCapId = findChangedObjectIdByType(
              objectChanges,
              `${createdPkg}::config::AdminCap`,
            );

            if (extensionConfigId && adminCapId) {
              setPostDeployConfig({
                status: 'ready',
                packageId: createdPkg,
                extensionConfigId,
                adminCapId,
                requestedPlan: gateDeployPlan,
              });
              await applyGatePostDeployConfig({
                packageId: createdPkg,
                extensionConfigId,
                adminCapId,
                requestedPlan: gateDeployPlan,
              });
            } else {
              setPostDeployConfig({
                status: 'failed',
                packageId: createdPkg,
                requestedPlan: gateDeployPlan,
                error:
                  'Could not locate AdminCap / ExtensionConfig object IDs in publish effects.',
              });
              addLog(
                '⚠️ Could not locate AdminCap / ExtensionConfig object IDs in publish effects; post-deploy config skipped',
              );
            }
          } else if (options?.templateId?.startsWith('gate_')) {
            addLog(
              'ℹ️ This gate configuration is compile-time only; no post-deploy config transaction is required',
            );
          }
        } else {
          addLog('Package ID no found in effects');
        }
      } catch (e) {
        addLog(`⚠️ Lookup failed: ${String(e)}`);
      }
    } catch (e) {
      const message = String(e);
      if (/PublishUpgradeMissingDependency/i.test(message)) {
        addLog(
          `❌ Publish failed: world dependency linkage did not match the live ${environmentLabel} world package`,
        );
      } else {
        addLog(`❌ Publish failed: ${message}`);
      }
    } finally {
      setIsPublishing(false);
    }
  };

  return {
    busy,
    logs,
    buildOk,
    compiled,
    packageId,
    txDigest,
    isPublishing,
    postDeployConfig,
    onBuild,
    onDeploy,
    onRetryPostDeployConfig,
    onRefreshPostDeployConfig,
  };
}
