import { useNavigate, useSearchParams } from '@modern-js/runtime/router';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { ConnectModal, useCurrentAccount } from '@mysten/dapp-kit';
import { getTemplate } from '@/templates';
import { useMoveBuilder } from '@/hooks/useMoveBuilder';
import { StatusBar } from '@/components/StatusBar';
import { AuthorizePanel } from '@/components/AuthorizePanel';
import { useNetworkVariable } from '@/config/dapp-kit';
import './page.css';

type DeployStage = 'connect' | 'publish' | 'publishing' | 'authorize' | 'complete';

export default function DeployPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get('template');
  const explorerBaseUrl = useNetworkVariable('explorerBaseUrl');
  const account = useCurrentAccount();

  const template = templateId ? getTemplate(templateId) : undefined;

  useEffect(() => {
    if (!templateId || !getTemplate(templateId)) navigate('/', { replace: true });
  }, [templateId, navigate]);

  // Restore compiled data from forge
  const [files, setFiles] = useState<Record<string, string>>({});
  const activeConfig = useMemo<Record<string, unknown> | undefined>(() => {
    try {
      const raw = sessionStorage.getItem('forge_config');
      if (raw) return JSON.parse(raw);
    } catch { /* */ }
    return undefined;
  }, []);

  useEffect(() => {
    if (!templateId) return;
    let cancelled = false;
    const load = async () => {
      const tpl = getTemplate(templateId);
      if (!tpl) return;
      const cfgRaw = sessionStorage.getItem('forge_config');
      const cfg = cfgRaw ? (JSON.parse(cfgRaw) as Record<string, unknown>) : undefined;
      const fm = await tpl.files(cfg);
      if (cancelled) return;
      setFiles(fm);
    };
    load();
    return () => { cancelled = true; };
  }, [templateId]);

  const {
    busy, logs, buildOk, compiled,
    packageId, txDigest, isPublishing,
    postDeployConfig,
    onBuild, onDeploy,
    onRetryPostDeployConfig, onRefreshPostDeployConfig,
  } = useMoveBuilder(files, { templateId, config: activeConfig });

  // Stage tracking
  const stage: DeployStage = useMemo(() => {
    if (packageId && (postDeployConfig?.status === 'verified' || postDeployConfig?.status === 'applied')) return 'complete';
    if (packageId) return 'authorize';
    if (isPublishing) return 'publishing';
    if (!account) return 'connect';
    return 'publish';
  }, [account, packageId, isPublishing, postDeployConfig]);

  // Auto-build if we have files but no compiled output
  useEffect(() => {
    if (Object.keys(files).length > 0 && !compiled && !busy && buildOk === null) {
      onBuild();
    }
  }, [files, compiled, busy, buildOk, onBuild]);

  const handleDeploy = useCallback(async () => {
    if (!buildOk && !compiled) {
      await onBuild();
    }
    await onDeploy();
  }, [buildOk, compiled, onBuild, onDeploy]);

  return (
    <div className="deploy">
      {/* ── Custom Header ── */}
      <header className="deploy__header">
        <button type="button" className="deploy__back" onClick={() => navigate(-1 as unknown as string)}>
          ← Back to Forge
        </button>
        <div className="deploy__header-center">
          <h1 className="deploy__page-title">DEPLOYMENT</h1>
          <p className="deploy__page-desc">{template?.label ?? 'Smart Assembly'}</p>
        </div>
        <div className="deploy__header-right" />
      </header>

      {/* ── Pipeline (centered, scrollable) ── */}
      <div className="deploy__content">
        <div className="deploy__pipeline">
          {/* Step 1: Connect */}
          <div className={`deploy__step ${stage === 'connect' ? 'active' : account ? 'done' : ''}`}>
            <div className="deploy__step-indicator">
              <span className="deploy__step-num">{account ? '✓' : '1'}</span>
            </div>
            <div className="deploy__step-content">
              <h3 className="deploy__step-title">Connect Wallet</h3>
              {!account ? (
                <ConnectModal
                  trigger={
                    <button type="button" className="deploy__connect-btn">
                      Connect Wallet
                    </button>
                  }
                />
              ) : (
                <p className="deploy__step-info">
                  <span className="deploy__wallet-dot" />
                  {account.address.slice(0, 8)}…{account.address.slice(-6)}
                </p>
              )}
            </div>
          </div>

          <div className="deploy__step-line" />

          {/* Step 2: Publish */}
          <div className={`deploy__step ${stage === 'publish' || stage === 'publishing' ? 'active' : packageId ? 'done' : ''}`}>
            <div className="deploy__step-indicator">
              <span className="deploy__step-num">{packageId ? '✓' : '2'}</span>
            </div>
            <div className="deploy__step-content">
              <h3 className="deploy__step-title">Publish Package</h3>
              {packageId ? (
                <div className="deploy__address-rows">
                  <AddressRow label="Package ID" value={packageId} explorerBaseUrl={explorerBaseUrl} />
                  {txDigest && <AddressRow label="TX Digest" value={txDigest} explorerBaseUrl={explorerBaseUrl} type="tx" />}
                </div>
              ) : (
                <button
                  type="button"
                  className="deploy__publish-btn"
                  disabled={!account || !buildOk || isPublishing}
                  onClick={handleDeploy}
                >
                  {busy ? '⏳ Building…' : isPublishing ? '⏳ Publishing…' : buildOk ? '▶ Publish to Chain' : '⏳ Preparing…'}
                </button>
              )}
            </div>
          </div>

          <div className="deploy__step-line" />

          {/* Step 3: Authorize */}
          <div className={`deploy__step ${stage === 'authorize' ? 'active' : stage === 'complete' ? 'done' : ''}`}>
            <div className="deploy__step-indicator">
              <span className="deploy__step-num">{stage === 'complete' ? '✓' : '3'}</span>
            </div>
            <div className="deploy__step-content">
              <h3 className="deploy__step-title">Configure Extension</h3>
              {packageId && template && (
                <AuthorizePanel
                  componentType={template.assemblyType}
                  extensionPackageId={packageId}
                  explorerBaseUrl={explorerBaseUrl}
                />
              )}
            </div>
          </div>
        </div>

        {/* Build log summary (collapsible) */}
        {logs.length > 0 && (
          <details className="deploy__logs-details">
            <summary className="deploy__logs-summary">Build Log ({logs.length} entries)</summary>
            <div className="deploy__logs-content">
              {logs.map((l, i) => (
                <div key={i} className="deploy__log-line">
                  {l}
                </div>
              ))}
            </div>
          </details>
        )}
      </div>

      <StatusBar
        buildStatus={busy ? 'building' : buildOk === true ? 'success' : buildOk === false ? 'error' : 'idle'}
        deployStatus={isPublishing ? 'deploying' : packageId ? 'success' : 'idle'}
      />
    </div>
  );
}

/* ── Address Row Component ── */
function AddressRow({
  label,
  value,
  explorerBaseUrl,
  type = 'object',
}: {
  label: string;
  value: string;
  explorerBaseUrl?: string;
  type?: 'object' | 'tx';
}) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  const explorerUrl = explorerBaseUrl
    ? `${explorerBaseUrl}/${type === 'tx' ? 'txblock' : 'object'}/${value}`
    : undefined;

  return (
    <div className="deploy__addr-row">
      <span className="deploy__addr-label">{label}</span>
      <div className="deploy__addr-value-wrap">
        <code className="deploy__addr-value">{value.slice(0, 10)}…{value.slice(-8)}</code>
        <button type="button" className="deploy__addr-btn" onClick={handleCopy} title="Copy">
          {copied ? '✓' : '⎘'}
        </button>
        {explorerUrl && (
          <a className="deploy__addr-btn" href={explorerUrl} target="_blank" rel="noreferrer" title="Explorer">
            ↗
          </a>
        )}
      </div>
    </div>
  );
}
