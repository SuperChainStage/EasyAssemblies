import { AssemblyTemplate } from './types';

export const TEMPLATES: Record<string, AssemblyTemplate> = {
  gate_tribe_permit: {
    id: 'gate_tribe_permit',
    label: 'Smart Gate — Tribe Permit',
    assemblyType: 'gate',
    description: 'A smart gate that allows access based on an EVE NFT permit.',
    detail: 'This is a mock implementation pending Task 2.x',
    files: () => ({
      'Move.toml': `[package]
name = "SmartGate"
version = "0.0.1"

[dependencies]
Sui = { git = "https://github.com/MystenLabs/sui.git", subdir = "crates/sui-framework/packages/sui-framework", rev = "framework/testnet" }
`,
      'sources/gate.move': `module smart_gate::tribe_permit {
    // Basic mock module for testing playground compilation
    use sui::tx_context::TxContext;

    public entry fun init_mock(ctx: &mut TxContext) {
        // ...
    }
}
`,
    }),
  },
};

export function getTemplate(id: string): AssemblyTemplate | undefined {
  return TEMPLATES[id];
}
