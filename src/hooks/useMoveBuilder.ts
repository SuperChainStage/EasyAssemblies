import { useState, useRef, useCallback, useEffect } from 'react';
import {
  useCurrentAccount,
  useSuiClientContext,
  useSuiClient,
  useSignAndExecuteTransaction,
} from '@mysten/dapp-kit';

import { Transaction } from '@mysten/sui/transactions';
import { fromBase64 } from '@mysten/sui/utils';

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

export function useMoveBuilder(files: Record<string, string>) {
  const [busy, setBusy] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [buildOk, setBuildOk] = useState<boolean | null>(null);
  const [compiled, setCompiled] = useState<BuildResult | null>(null);
  const [packageId, setPackageId] = useState('');
  const [txDigest, setTxDigest] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  const compilerRef = useRef<Promise<void> | null>(null);
  const versionRef = useRef<string | null>(null);

  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutateAsync: signAndExecuteTransaction } =
    useSignAndExecuteTransaction();

  const { network } = useSuiClientContext();

  const addLog = useCallback((msg: string) => {
    const ts = new Date().toLocaleTimeString();
    setLogs(prev => {
      const next = [...prev, `[${ts}] ${msg}`];
      return next.length > MAX_LOG_LINES
        ? next.slice(next.length - MAX_LOG_LINES)
        : next;
    });
  }, []);

  useEffect(() => {
    let canceled = false;
    (async () => {
      if (!compilerRef.current) {
        compilerRef.current = initMoveCompiler();
      }
      try {
        await compilerRef.current;
      } catch {
        return;
      }
      if (canceled) return;
      try {
        const v = versionRef.current ?? (await getSuiMoveVersion());
        versionRef.current = v;
        const ts = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, `[${ts}] 📌 Compiler ready — ${v}`]);
      } catch {
        /* silent */
      }
    })();
    return () => {
      canceled = true;
    };
  }, []);

  const onBuild = async () => {
    addLog('── ── ── ── ──');
    addLog('🚀 Build started');
    setBuildOk(null);
    setCompiled(null);
    setPackageId('');
    setTxDigest('');
    setBusy(true);

    const start = performance.now();
    try {
      if (!compilerRef.current) {
        compilerRef.current = initMoveCompiler();
      }
      await compilerRef.current;
      const compilerVersion = versionRef.current ?? (await getSuiMoveVersion());
      versionRef.current = compilerVersion;

      addLog('📦 Resolving dependencies…');
      const resolved = await resolveDependencies({
        files,
        ansiColor: true,
        network: network as 'devnet' | 'testnet' | 'mainnet',
      });
      const sanitized = sanitizeResolvedDependencies(resolved, compilerVersion);
      if (sanitized.changed) {
        addLog(
          `⚠️ Applied world v0.0.18 compatibility patch for browser compiler ${compilerVersion}`,
        );
      }

      const sourceFiles = Object.fromEntries(
        Object.entries(files).filter(
          ([p]) => p === 'Move.toml' || p.endsWith('.move'),
        ),
      );

      addLog('🔨 Compiling…');

      const result = await buildMovePackage({
        files: sourceFiles,
        resolvedDependencies: sanitized.resolved,
        silenceWarnings: false,
        ansiColor: true,
        network: network as 'devnet' | 'testnet' | 'mainnet',
        onProgress: (ev: any) => {
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
        addLog(`✅ Build succeeded in ${elapsed}s`);
        addLog(`Digest: ${success.digest ?? '-'}`);
        addLog(`Modules: ${success.modules?.length ?? 0}`);
        if ('warnings' in success && (success as any).warnings)
          addLog(`⚠️ ${(success as any).warnings}`);
        setBuildOk(true);
        setCompiled(result);
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
    addLog('🚀 Publishing…');

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
      const res = await signAndExecuteTransaction({ transaction: tx as any });
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

        const createdPkgInfo = (txb.objectChanges || []).find(
          (o: any) => o.type === 'published',
        );
        const createdPkg =
          createdPkgInfo && 'packageId' in createdPkgInfo
            ? (createdPkgInfo as any).packageId
            : undefined;
        if (createdPkg) {
          addLog(`📦 Package ID: ${createdPkg}`);
          setPackageId(createdPkg);
        } else {
          addLog('Package ID no found in effects');
        }
      } catch (e) {
        addLog(`⚠️ Lookup failed: ${String(e)}`);
      }
    } catch (e) {
      addLog(`❌ Publish failed: ${String(e)}`);
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
