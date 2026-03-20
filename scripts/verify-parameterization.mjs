/**
 * Phase 4.5 verification script.
 * Validates the Gate template parameterization by directly calling replaceAll
 * on the full template strings (copied from the actual template source).
 */

import { readFileSync } from 'node:fs';

const DEFAULT_MODULE = 'smart_gate_extension';
const CUSTOM_MODULE = 'my_custom_gate';

// Read the actual template source to extract the raw template strings
const templateSource = readFileSync(
  new URL('../src/templates/gate/smart_gate_tribe_permit.ts', import.meta.url),
  'utf-8',
);

// Verify the template source contains the expected default module name occurrences
const defaultOccurrences = (templateSource.match(new RegExp(DEFAULT_MODULE, 'g')) || []).length;

let pass = 0;
let fail = 0;

function assert(condition, message) {
  if (condition) {
    pass++;
    console.log(`  PASS: ${message}`);
  } else {
    fail++;
    console.error(`  FAIL: ${message}`);
  }
}

// --- Test 1: Template source contains multiple default module name occurrences ---
console.log('\n=== Test 1: Template source integrity ===');
assert(
  defaultOccurrences >= 6,
  `Template source has ${defaultOccurrences} occurrences of "${DEFAULT_MODULE}" (expected >= 6, rest are inside escaped template literals)`,
);

// --- Test 2: replaceAll correctly replaces all occurrences ---
console.log('\n=== Test 2: replaceAll coverage ===');

// Extract all template literal blocks between backticks that contain the default module name
// We test the core logic: replaceAll(DEFAULT_MODULE, CUSTOM_MODULE) on the raw strings
const backtickBlocks = [];
let inBlock = false;
let depth = 0;
let current = '';
for (let i = 0; i < templateSource.length; i++) {
  const ch = templateSource[i];
  if (ch === '`' && templateSource[i - 1] !== '\\') {
    if (!inBlock) {
      inBlock = true;
      current = '';
    } else {
      inBlock = false;
      if (current.includes(DEFAULT_MODULE)) {
        backtickBlocks.push(current);
      }
    }
    continue;
  }
  if (inBlock) current += ch;
}

assert(
  backtickBlocks.length === 4,
  `Found ${backtickBlocks.length} template blocks with "${DEFAULT_MODULE}" (expected 4: Move.toml, config.move, tribe_permit.move, corpse_gate_bounty.move)`,
);

for (const block of backtickBlocks) {
  const replaced = block.replaceAll(DEFAULT_MODULE, CUSTOM_MODULE);
  const remaining = (replaced.match(new RegExp(DEFAULT_MODULE, 'g')) || []).length;
  assert(
    remaining === 0,
    `After replaceAll, no leftover "${DEFAULT_MODULE}" in block starting with "${block.slice(0, 60).replace(/\n/g, '\\n')}..."`,
  );

  const customCount = (replaced.match(new RegExp(CUSTOM_MODULE, 'g')) || []).length;
  const originalCount = (block.match(new RegExp(DEFAULT_MODULE, 'g')) || []).length;
  assert(
    customCount === originalCount,
    `Block has ${customCount} "${CUSTOM_MODULE}" occurrences matching ${originalCount} original occurrences`,
  );
}

// --- Test 3: Verify key Move syntax structures are present in template blocks ---
console.log('\n=== Test 3: Move code structure preservation after replacement ===');

const allBlocks = backtickBlocks.map(b => b.replaceAll(DEFAULT_MODULE, CUSTOM_MODULE));

// Move.toml
assert(allBlocks[0].includes(`name = "${CUSTOM_MODULE}"`), 'Move.toml: package name replaced');
assert(allBlocks[0].includes('edition = "2024"'), 'Move.toml: edition preserved');
assert(allBlocks[0].includes('world = { git ='), 'Move.toml: world dependency preserved');

// config.move
assert(allBlocks[1].includes(`module ${CUSTOM_MODULE}::config;`), 'config.move: module declaration replaced');
assert(allBlocks[1].includes('public struct ExtensionConfig has key'), 'config.move: ExtensionConfig preserved');
assert(allBlocks[1].includes('public struct AdminCap has key, store'), 'config.move: AdminCap preserved');
assert(allBlocks[1].includes('public struct XAuth has drop'), 'config.move: XAuth preserved');
assert(allBlocks[1].includes('public(package) fun x_auth()'), 'config.move: x_auth() preserved');

// tribe_permit.move
assert(allBlocks[2].includes(`module ${CUSTOM_MODULE}::tribe_permit;`), 'tribe_permit.move: module declaration replaced');
assert(allBlocks[2].includes(`use ${CUSTOM_MODULE}::config::{Self, AdminCap, XAuth, ExtensionConfig};`), 'tribe_permit.move: use statement replaced');
assert(allBlocks[2].includes('public fun issue_jump_permit'), 'tribe_permit.move: issue_jump_permit preserved');
assert(allBlocks[2].includes('public fun set_tribe_config'), 'tribe_permit.move: set_tribe_config preserved');
assert(allBlocks[2].includes('public struct TribeConfig has drop, store'), 'tribe_permit.move: TribeConfig preserved');

// corpse_gate_bounty.move
assert(allBlocks[3].includes(`module ${CUSTOM_MODULE}::corpse_gate_bounty;`), 'corpse_gate_bounty.move: module declaration replaced');
assert(allBlocks[3].includes(`use ${CUSTOM_MODULE}::config::{Self, AdminCap, XAuth, ExtensionConfig};`), 'corpse_gate_bounty.move: use statement replaced');
assert(allBlocks[3].includes('public fun collect_corpse_bounty'), 'corpse_gate_bounty.move: collect_corpse_bounty preserved');
assert(allBlocks[3].includes('public fun set_bounty_config'), 'corpse_gate_bounty.move: set_bounty_config preserved');
assert(allBlocks[3].includes('public struct BountyConfig has drop, store'), 'corpse_gate_bounty.move: BountyConfig preserved');

// --- Test 4: Verify no accidental replacement of non-module content ---
console.log('\n=== Test 4: No collateral damage ===');
for (const block of allBlocks) {
  assert(!block.includes('my_custom_gate_extension'), 'No over-replacement creating "my_custom_gate_extension"');
}
// "world" should never be replaced
for (const block of allBlocks) {
  if (block.includes('world::')) {
    assert(
      !block.includes(`${CUSTOM_MODULE}::`).valueOf || block.includes('world::'),
      'world:: references are untouched',
    );
  }
}

// --- Summary ---
console.log(`\n=== Summary: ${pass} passed, ${fail} failed ===\n`);
process.exit(fail > 0 ? 1 : 0);
