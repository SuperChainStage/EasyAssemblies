/**
 * useAuthorize — generic extension authorization hook.
 *
 * Constructs and executes a PTB:
 *   borrow_owner_cap<T> → authorize_extension<XAuth> → return_owner_cap<T>
 *
 * Works for all three assembly types: Gate, StorageUnit, Turret.
 */

import { useCallback, useState } from 'react';
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';

import {
  ASSEMBLY_MODULE,
  ASSEMBLY_STRUCT,
  WORLD_MODULES,
  type AssemblyComponentType,
} from '@/config/constants';
import { useNetworkVariables } from '@/config/dapp-kit';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AuthorizeParams = {
  /** What kind of assembly to authorize. */
  componentType: AssemblyComponentType;
  /** The user's Character object ID. */
  characterId: string;
  /** The assembly (Gate / StorageUnit / Turret) object ID. */
  assemblyId: string;
  /** The OwnerCap object ID for this assembly (held by the Character). */
  ownerCapId: string;
  /** The published extension package ID (contains config::XAuth). */
  extensionPackageId: string;
};

export type AuthorizeStatus =
  | 'idle'
  | 'authorizing'
  | 'success'
  | 'failed';

export type AuthorizeState = {
  status: AuthorizeStatus;
  txDigest?: string;
  error?: string;
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuthorize() {
  const [state, setState] = useState<AuthorizeState>({ status: 'idle' });

  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutateAsync: signAndExecuteTransaction } =
    useSignAndExecuteTransaction();
  const { walletChain, worldPackageReference } = useNetworkVariables();

  const worldPackageId = worldPackageReference.originalId;

  const authorize = useCallback(
    async (params: AuthorizeParams): Promise<string | null> => {
      if (!account) {
        setState({ status: 'failed', error: 'Wallet not connected' });
        return null;
      }

      setState({ status: 'authorizing' });

      const worldModule = ASSEMBLY_MODULE[params.componentType];
      const worldStruct = ASSEMBLY_STRUCT[params.componentType];
      const assemblyType = `${worldPackageId}::${worldModule}::${worldStruct}`;
      const xAuthType = `${params.extensionPackageId}::config::XAuth`;

      try {
        const tx = new Transaction();

        // 1. Borrow OwnerCap from Character
        const [ownerCap, returnReceipt] = tx.moveCall({
          target: `${worldPackageId}::${WORLD_MODULES.CHARACTER}::borrow_owner_cap`,
          typeArguments: [assemblyType],
          arguments: [
            tx.object(params.characterId),
            tx.object(params.ownerCapId),
          ],
        });

        // 2. Authorize extension on the assembly
        tx.moveCall({
          target: `${worldPackageId}::${worldModule}::authorize_extension`,
          typeArguments: [xAuthType],
          arguments: [tx.object(params.assemblyId), ownerCap],
        });

        // 3. Return OwnerCap
        tx.moveCall({
          target: `${worldPackageId}::${WORLD_MODULES.CHARACTER}::return_owner_cap`,
          typeArguments: [assemblyType],
          arguments: [
            tx.object(params.characterId),
            ownerCap,
            returnReceipt,
          ],
        });

        const res = await signAndExecuteTransaction({
          transaction: tx,
          chain: walletChain,
        });

        if (res.digest) {
          await suiClient.waitForTransaction({
            digest: res.digest,
            options: { showEffects: true },
          });
        }

        setState({ status: 'success', txDigest: res.digest });
        return res.digest ?? null;
      } catch (error) {
        setState({ status: 'failed', error: String(error) });
        return null;
      }
    },
    [account, signAndExecuteTransaction, suiClient, walletChain, worldPackageId],
  );

  const reset = useCallback(() => {
    setState({ status: 'idle' });
  }, []);

  return { authorizeState: state, authorize, resetAuthorize: reset };
}
