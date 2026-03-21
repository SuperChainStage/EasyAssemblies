/**
 * Verify Turret chip code generation — checks that every preset
 * produces valid-looking Move code with no obvious issues.
 *
 * Run:  node scripts/verify-turret-chips.mjs
 */

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// We import the compiled TS via tsx or a simple dynamic approach.
// Since the project uses Modern.js, we'll just do a lightweight check
// by directly running the generator logic through Node with tsx.

async function main() {
  // Dynamic import via tsx if available, else fallback
  let generateTurretFiles, TURRET_PRESETS, TURRET_CHIPS;
  try {
    const gen = await import('../src/templates/turret/turret_code_generator.ts');
    generateTurretFiles = gen.generateTurretFiles;
    const presets = await import('../src/templates/turret/presets.ts');
    TURRET_PRESETS = presets.TURRET_PRESETS;
    const chips = await import('../src/templates/turret/chips.ts');
    TURRET_CHIPS = chips.TURRET_CHIPS;
  } catch (e) {
    console.error('Failed to import TS modules. Make sure tsx is available or compile first.');
    console.error(e.message);
    process.exit(1);
  }

  let passed = 0;
  let failed = 0;
  const errors = [];

  // ---- Test 1: All 15 chips exist ----
  console.log('\n=== Chip Registry ===');
  const expectedIds = ['E1','E2','E3','E4','E5','E6','W1','W2','W3','W4','W5','W6','W7','W8','W9'];
  for (const id of expectedIds) {
    const chip = TURRET_CHIPS.find(c => c.id === id);
    if (chip) {
      console.log(`  ✅ ${id} — ${chip.label}`);
      passed++;
    } else {
      console.log(`  ❌ ${id} — MISSING`);
      failed++;
      errors.push(`Chip ${id} not found`);
    }
  }

  // ---- Test 2: Each preset generates valid Move code ----
  console.log('\n=== Preset Code Generation ===');
  for (const preset of TURRET_PRESETS) {
    const selection = {
      enabledChips: [...preset.chips],
      chipConfigs: preset.chipConfigs ? { ...preset.chipConfigs } : {},
    };

    try {
      const files = generateTurretFiles({ moduleName: 'test_turret', selection });

      // Check Move.toml exists and has correct name
      const toml = files['Move.toml'];
      if (!toml || !toml.includes('name = "test_turret"')) {
        throw new Error('Move.toml missing or wrong name');
      }

      // Check turret.move exists
      const turretMove = files['sources/turret.move'];
      if (!turretMove) throw new Error('sources/turret.move missing');

      // Check critical elements
      const checks = [
        ['module declaration', 'module test_turret::turret;'],
        ['function signature', 'public fun get_target_priority_list('],
        ['receipt validation', 'receipt.turret_id() == object::id(turret)'],
        ['destroy receipt', 'turret::destroy_online_receipt(receipt, TurretAuth {})'],
        ['bcs serialization', 'bcs::to_bytes(&return_list)'],
        ['owner_character_id', 'owner_character_id'],
        ['owner_tribe', 'owner_tribe'],
        ['TurretAuth struct', 'public struct TurretAuth has drop {}'],
      ];

      let presetOk = true;
      for (const [label, expected] of checks) {
        if (!turretMove.includes(expected)) {
          errors.push(`${preset.id}: missing "${label}" — expected "${expected}"`);
          presetOk = false;
        }
      }

      // Check that enabled chip comments appear
      for (const chipId of preset.chips) {
        if (!turretMove.includes(`[${chipId}]`)) {
          errors.push(`${preset.id}: chip [${chipId}] comment not found in code`);
          presetOk = false;
        }
      }

      // Check that disabled chips do NOT appear (except in the comment header)
      const allChipIds = TURRET_CHIPS.map(c => c.id);
      const disabledChips = allChipIds.filter(id => !preset.chips.includes(id));
      for (const chipId of disabledChips) {
        // Remove the header comment "Chips: [E1, E2, ...]" before checking
        const bodyOnly = turretMove.split('module test_turret::turret;')[1] || '';
        if (bodyOnly.includes(`[${chipId}]`)) {
          errors.push(`${preset.id}: disabled chip [${chipId}] unexpectedly appears in code body`);
          presetOk = false;
        }
      }

      if (presetOk) {
        console.log(`  ✅ ${preset.id} (${preset.label}) — ${preset.chips.length} chips`);
        passed++;
      } else {
        console.log(`  ❌ ${preset.id} (${preset.label})`);
        failed++;
      }

    } catch (e) {
      console.log(`  ❌ ${preset.id} (${preset.label}) — ${e.message}`);
      failed++;
      errors.push(`${preset.id}: ${e.message}`);
    }
  }

  // ---- Test 3: Custom combination (all chips except conflicting) ----
  console.log('\n=== Custom Combination (max chips) ===');
  {
    // Enable all non-conflicting chips: E1-E3, E6, W1-W7, W8 (skip E4,E5 conflict, W9 conflicts W8)
    const maxSelection = {
      enabledChips: ['E1','E2','E3','E6','W1','W2','W3','W4','W5','W6','W7','W8'],
      chipConfigs: {
        E6: { protectedTribes: '100,200,300' },
        W3: { turretType: 'plasma', specBonus: 4000 },
        W4: { hpMultiplier: 60 },
        W5: { shieldMultiplier: 40 },
        W7: { enemyTribes: '500,600,700', enemyBoost: 9000 },
      },
    };
    try {
      const files = generateTurretFiles({ moduleName: 'max_turret', selection: maxSelection });
      const code = files['sources/turret.move'];
      if (!code) throw new Error('missing turret.move');

      // Check all enabled chips appear
      let ok = true;
      for (const id of maxSelection.enabledChips) {
        if (!code.includes(`[${id}]`)) {
          errors.push(`max combo: chip [${id}] not found`);
          ok = false;
        }
      }

      // Check plasma groups appear
      if (!code.includes('25, 420')) {
        errors.push('max combo: plasma groups not found');
        ok = false;
      }

      if (ok) {
        console.log(`  ✅ Max combo — 12 chips, plasma turret`);
        passed++;
      } else {
        console.log(`  ❌ Max combo`);
        failed++;
      }
    } catch (e) {
      console.log(`  ❌ Max combo — ${e.message}`);
      failed++;
    }
  }

  // ---- Test 4: Empty selection (no chips at all) ----
  console.log('\n=== Edge Case: Empty Selection ===');
  {
    try {
      const files = generateTurretFiles({
        moduleName: 'empty_turret',
        selection: { enabledChips: [], chipConfigs: {} },
      });
      const code = files['sources/turret.move'];
      if (!code) throw new Error('missing turret.move');
      if (!code.includes('(none selected)')) throw new Error('missing placeholder comment');
      if (!code.includes('turret::destroy_online_receipt')) throw new Error('missing receipt destroy');
      console.log(`  ✅ Empty selection — generates valid skeleton`);
      passed++;
    } catch (e) {
      console.log(`  ❌ Empty selection — ${e.message}`);
      failed++;
    }
  }

  // ---- Test 5: Module name replacement ----
  console.log('\n=== Module Name Replacement ===');
  {
    const customName = 'my_custom_turret';
    const files = generateTurretFiles({
      moduleName: customName,
      selection: { enabledChips: ['E1', 'W1'], chipConfigs: {} },
    });
    const toml = files['Move.toml'];
    const code = files['sources/turret.move'];

    let ok = true;
    if (!toml.includes(`name = "${customName}"`)) {
      errors.push(`module name: Move.toml doesn't use "${customName}"`);
      ok = false;
    }
    if (!code.includes(`module ${customName}::turret;`)) {
      errors.push(`module name: turret.move doesn't use "${customName}"`);
      ok = false;
    }
    if (code.includes('smart_turret_extension')) {
      errors.push('module name: default name still appears in code');
      ok = false;
    }

    if (ok) {
      console.log(`  ✅ Custom module name "${customName}"`);
      passed++;
    } else {
      console.log(`  ❌ Custom module name`);
      failed++;
    }
  }

  // ---- Summary ----
  console.log(`\n${'═'.repeat(50)}`);
  console.log(`  PASSED: ${passed}   FAILED: ${failed}`);
  if (errors.length > 0) {
    console.log('\n  Errors:');
    for (const e of errors) console.log(`    • ${e}`);
  }
  console.log(`${'═'.repeat(50)}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

main();
