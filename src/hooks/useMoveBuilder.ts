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
  DEFAULT_GATE_CONFIG,
  type GateExtensionConfig,
  validateGateConfig,
} from '@/config/gate-config';
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

function resolveGateDeployConfig(
  templateId: string | null | undefined,
  rawConfig?: Record<string, unknown>,
): GateExtensionConfig | null {
  if (templateId !== 'gate_tribe_permit') {
    return null;
  }

  const config: GateExtensionConfig = {
    ...DEFAULT_GATE_CONFIG,
    ...(rawConfig as Partial<GateExtensionConfig> | undefined),
  };
  const validation = validateGateConfig(config);
  return validation.valid ? config : null;
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
  const gateDeployConfig = resolveGateDeployConfig(
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
    }

    previousTargetRef.current = targetId;
  }, [environmentLabel, targetId]);

  const onBuild = async () => {
    addLog('── ── ── ── ──');
    addLog('🚀 Build started');
    addLog(`🎯 Target: ${environmentLabel} (${targetId})`);
    setBuildOk(null);
    setCompiled(null);
    setPackageId('');
    setTxDigest('');
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

          if (gateDeployConfig !== null) {
            const extensionConfigId = findChangedObjectIdByType(
              objectChanges,
              `${createdPkg}::config::ExtensionConfig`,
            );
            const adminCapId = findChangedObjectIdByType(
              objectChanges,
              `${createdPkg}::config::AdminCap`,
            );

            if (extensionConfigId && adminCapId) {
              addLog('⚙️ Applying post-deploy gate config…');
              addLog(
                `  tribe_id=${gateDeployConfig.tribeId}, permit_expiry_ms=${gateDeployConfig.expiryDurationMs}`,
              );

              const configTx = new Transaction();
              const extensionConfigObject = configTx.object(extensionConfigId);
              const adminCapObject = configTx.object(adminCapId);

              configTx.moveCall({
                target: `${createdPkg}::tribe_permit::set_tribe_config`,
                arguments: [
                  extensionConfigObject,
                  adminCapObject,
                  configTx.pure.u32(gateDeployConfig.tribeId),
                  configTx.pure.u64(gateDeployConfig.expiryDurationMs),
                ],
              });

              if (gateDeployConfig.bountyTypeId > 0) {
                addLog(
                  `  bounty_type_id=${gateDeployConfig.bountyTypeId}, bounty_expiry_ms=${gateDeployConfig.bountyExpiryMs}`,
                );
                configTx.moveCall({
                  target: `${createdPkg}::corpse_gate_bounty::set_bounty_config`,
                  arguments: [
                    extensionConfigObject,
                    adminCapObject,
                    configTx.pure.u64(gateDeployConfig.bountyTypeId),
                    configTx.pure.u64(gateDeployConfig.bountyExpiryMs),
                  ],
                });
              } else {
                addLog('  bounty config skipped (bounty_type_id = 0)');
              }

              try {
                const configRes = await signAndExecuteTransaction({
                  transaction: configTx,
                  chain: walletChain,
                });
                if (configRes.digest) {
                  addLog(`📜 Config tx digest: ${configRes.digest}`);
                  await suiClient.waitForTransaction({
                    digest: configRes.digest,
                    options: { showEffects: true },
                  });
                }
                addLog(`✅ Post-deploy config applied to ${extensionConfigId}`);
              } catch (configError) {
                addLog(`⚠️ Post-deploy config failed: ${String(configError)}`);
                addLog(
                  `⚠️ You can still configure later with AdminCap ${adminCapId} and ExtensionConfig ${extensionConfigId}`,
                );
              }
            } else {
              addLog(
                '⚠️ Could not locate AdminCap / ExtensionConfig object IDs in publish effects; post-deploy config skipped',
              );
            }
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
    onBuild,
    onDeploy,
  };
}
