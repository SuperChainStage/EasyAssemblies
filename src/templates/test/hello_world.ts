import type { AssemblyTemplate } from '../types';

export const helloWorldTest: AssemblyTemplate = {
  id: 'test_hello_world',
  label: '[Test] Hello World',
  assemblyType: 'gate',
  description: 'Simple Hello World — no dependencies, for pipeline testing only',
  detail: 'Mint a HelloWorldObject. Used to verify the compile + deploy pipeline works.',
  files: () => ({
    'Move.toml': `[package]
name = "hello_world"
version = "0.0.1"
edition = "2024.beta"

[dependencies]

[addresses]
hello_world = "0x0"
`,
    'sources/hello_world.move': `module hello_world::hello_world;

use std::string;

public struct HelloWorldObject has key, store {
    id: UID,
    text: string::String,
}

#[lint_allow(self_transfer)]
public fun mint(ctx: &mut TxContext) {
    let object = HelloWorldObject {
        id: object::new(ctx),
        text: b"Hello World!".to_string(),
    };
    transfer::public_transfer(object, ctx.sender());
}
`,
  }),
};
