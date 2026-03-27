/**
 * useWorldObjects — auto-fetch Character ID, OwnerCap ID, etc. from on-chain state.
 *
 * - **Character ID**: Queried from the wallet's owned `PlayerProfile` object.
 * - **OwnerCap ID**: Read from the assembly's `owner_cap_id` view function via `devInspect`.
 *
 * These lookups avoid making the user manually copy-paste opaque object IDs.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { bcs } from '@mysten/sui/bcs';

import {
  ASSEMBLY_MODULE,
  type AssemblyComponentType,
} from '@/config/constants';
import { useNetworkVariables } from '@/config/dapp-kit';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LookupStatus = 'idle' | 'loading' | 'success' | 'failed';

export interface WorldObjectsState {
  /** The user's Character object ID (auto-fetched from PlayerProfile). */
  characterId: string | null;
  characterStatus: LookupStatus;
  characterError?: string;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useWorldObjects() {
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const { worldPackageReference } = useNetworkVariables();
  const worldOriginalId = worldPackageReference.originalId;

  // ── Character auto-fetch ──
  const [charState, setCharState] = useState<WorldObjectsState>({
    characterId: null,
    characterStatus: 'idle',
  });

  // Track which wallet we last fetched for, to avoid re-fetching unnecessarily.
  const lastFetchedAddress = useRef<string | null>(null);

  useEffect(() => {
    const address = account?.address;
    if (!address) {
      setCharState({ characterId: null, characterStatus: 'idle' });
      lastFetchedAddress.current = null;
      return;
    }
    if (address === lastFetchedAddress.current) return;
    lastFetchedAddress.current = address;

    let cancelled = false;
    setCharState({ characterId: null, characterStatus: 'loading' });

    (async () => {
      try {
        const profileType = `${worldOriginalId}::character::PlayerProfile`;
        const result = await suiClient.getOwnedObjects({
          owner: address,
          filter: { StructType: profileType },
          options: { showContent: true },
          limit: 1,
        });

        if (cancelled) return;
        const profileData = result.data?.[0]?.data;
        if (!profileData) {
          setCharState({
            characterId: null,
            characterStatus: 'failed',
            characterError:
              'No PlayerProfile found. You may need to create a character in EVE Frontier first.',
          });
          return;
        }

        // Extract character_id from the PlayerProfile content
        const content = profileData.content;
        if (content?.dataType === 'moveObject') {
          const fields = content.fields as Record<string, unknown>;
          const characterId = fields?.character_id as string | undefined;
          if (characterId) {
            setCharState({
              characterId,
              characterStatus: 'success',
            });
            return;
          }
        }

        // Fallback: if content parsing failed, report the profile ID with a hint
        setCharState({
          characterId: null,
          characterStatus: 'failed',
          characterError:
            'Found PlayerProfile but could not parse character_id.',
        });
      } catch (err) {
        if (cancelled) return;
        setCharState({
          characterId: null,
          characterStatus: 'failed',
          characterError: `Lookup failed: ${String(err).slice(0, 120)}`,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [account?.address, suiClient, worldOriginalId]);

  // ── OwnerCap lookup (on demand) ──
  const lookupOwnerCap = useCallback(
    async (
      assemblyId: string,
      componentType: AssemblyComponentType,
    ): Promise<{ ownerCapId: string | null; error?: string }> => {
      if (!assemblyId || !assemblyId.startsWith('0x')) {
        return { ownerCapId: null, error: 'Invalid object ID format' };
      }

      try {
        const moduleName = ASSEMBLY_MODULE[componentType];
        const target =
          `${worldOriginalId}::${moduleName}::owner_cap_id` as `${string}::${string}::${string}`;

        const tx = new Transaction();
        tx.moveCall({
          target,
          arguments: [tx.object(assemblyId)],
        });

        const result = await suiClient.devInspectTransactionBlock({
          sender:
            account?.address ??
            '0x0000000000000000000000000000000000000000000000000000000000000000',
          transactionBlock: tx,
        });

        if (result.effects?.status?.status !== 'success') {
          return {
            ownerCapId: null,
            error: `Object not found or not a valid ${componentType}`,
          };
        }

        const returnValues = result.results?.[0]?.returnValues;
        if (!returnValues?.length) {
          return { ownerCapId: null, error: 'No return value from view function' };
        }

        const [valueBytes] = returnValues[0] as [number[], string];
        const bytes = new Uint8Array(valueBytes);
        // ID in Move is a 32-byte address
        const ownerCapId = `0x${bcs.Address.parse(bytes)}`;
        return { ownerCapId };
      } catch (err) {
        return {
          ownerCapId: null,
          error: `Lookup failed: ${String(err).slice(0, 120)}`,
        };
      }
    },
    [account?.address, suiClient, worldOriginalId],
  );

  return {
    ...charState,
    lookupOwnerCap,
  };
}
