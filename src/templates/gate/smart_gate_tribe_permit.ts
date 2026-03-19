import { AssemblyTemplate } from '../types';

export const smartGateTribePermit: AssemblyTemplate = {
  id: 'gate_tribe_permit',
  label: 'Smart Gate — Tribe Permit',
  assemblyType: 'gate',
  description: 'Players can jump if they belong to a specific starter tribe',
  detail: 'This setup publishes a shared configuration object and a specialized permit issuer. The gate owner sets a target tribe ID, and any character matching that tribe ID can request a permit to jump through the gate.',
  files: () => ({
    'Move.toml': `[package]
name = "smart_gate_extension"
edition = "2024"

[dependencies]
world = { git = "https://github.com/evefrontier/world-contracts.git", subdir = "contracts/world", rev = "v0.0.21" }

[environments]
testnet = "4c78adac"
testnet_internal = "4c78adac"
testnet_utopia = "4c78adac"
testnet_stillness = "4c78adac"
`,
    'sources/config.move': `/// Builder extensions shared configuration.
///
/// This module publishes a single shared \`ExtensionConfig\` object at package publish time
/// Other builder-extension modules can attach their own typed rule/config
/// structs under that shared object using Sui dynamic fields.
module smart_gate_extension::config;

use sui::dynamic_field as df;

public struct ExtensionConfig has key {
    id: UID,
}

public struct AdminCap has key, store {
    id: UID,
}

// This can be any type that is authorized to call the \`issue_jump_permit\` function.
// eg: AlgorithmicWarfareAuth, TribalAuth, GoonCorpAuth, etc.
public struct XAuth has drop {}

fun init(ctx: &mut TxContext) {
    let admin_cap = AdminCap { id: object::new(ctx) };
    transfer::transfer(admin_cap, ctx.sender());

    let config = ExtensionConfig { id: object::new(ctx) };
    transfer::share_object(config);
}

// === Dynamic field helpers ===
//
// These helpers let other modules attach their own config structs as dynamic fields
// under the shared \`ExtensionConfig\` object.
//
// Typical pattern:
// - define a per-rule key type \`K has copy, drop, store\`
// - define a per-rule value type \`V has store, drop\`
// - call \`set_rule<K, V>(&mut extension_config, &admin_cap, K {}, V { ... })\`
public fun has_rule<K: copy + drop + store>(config: &ExtensionConfig, key: K): bool {
    df::exists_(&config.id, key)
}

public fun borrow_rule<K: copy + drop + store, V: store>(config: &ExtensionConfig, key: K): &V {
    df::borrow(&config.id, key)
}

public fun borrow_rule_mut<K: copy + drop + store, V: store>(
    config: &mut ExtensionConfig,
    _: &AdminCap,
    key: K,
): &mut V {
    df::borrow_mut(&mut config.id, key)
}

public fun add_rule<K: copy + drop + store, V: store>(
    config: &mut ExtensionConfig,
    _: &AdminCap,
    key: K,
    value: V,
) {
    df::add(&mut config.id, key, value);
}

/// Insert-or-overwrite a rule. If a value already exists for \`key\`, it is removed and dropped.
public fun set_rule<K: copy + drop + store, V: store + drop>(
    config: &mut ExtensionConfig,
    _: &AdminCap,
    key: K,
    value: V,
) {
    if (df::exists_(&config.id, copy key)) {
        let _old: V = df::remove(&mut config.id, copy key);
        // dropped
    };
    df::add(&mut config.id, key, value);
}

public fun remove_rule<K: copy + drop + store, V: store>(
    config: &mut ExtensionConfig,
    _: &AdminCap,
    key: K,
): V {
    df::remove(&mut config.id, key)
}

/// Mint an \`XAuth\` witness. Restricted to this package to prevent unauthorized use.
public(package) fun x_auth(): XAuth {
    XAuth {}
}
`,
    'sources/tribe_permit.move': `/// Example builder extension for \`world::gate\` using the typed-witness extension pattern.
///
/// This module demonstrates how builders/players can enforce custom jump rules by issuing a
/// \`world::gate::JumpPermit\` from extension logic:
/// - Gate owners configure a gate to use this extension by authorizing the witness type \`XAuth\`
///   on the gate (via \`world::gate::authorize_extension<XAuth>\`).
/// - Once configured, travelers must use \`world::gate::jump_with_permit\`; default \`jump\` is not allowed.
/// - This extension issues permits through \`issue_jump_permit\`, which:
///   - checks a simple rule (character must belong to the configured starter \`tribe\`)
///   - calls \`world::gate::issue_jump_permit<XAuth>\` to mint a single-use permit to the character.
///
/// Configuration for this extension is stored in the shared \`ExtensionConfig\` object.
#[allow(unused_use)]
module smart_gate_extension::tribe_permit;

use smart_gate_extension::config::{Self, AdminCap, XAuth, ExtensionConfig};
use sui::clock::Clock;
use world::{character::Character, gate::{Self, Gate}};

// === Errors ===
#[error(code = 0)]
const ENotStarterTribe: vector<u8> = b"Character is not a starter tribe";
#[error(code = 1)]
const ENoTribeConfig: vector<u8> = b"Missing TribeConfig on ExtensionConfig";
#[error(code = 2)]
const EExpiryOverflow: vector<u8> = b"Expiry timestamp overflow";

/// Stored as a dynamic field value under \`ExtensionConfig\`.
public struct TribeConfig has drop, store {
    tribe: u32,
    expiry_duration_ms: u64,
}

/// Dynamic-field key for \`TribeConfig\`.
public struct TribeConfigKey has copy, drop, store {}

// === View Functions ===
public fun tribe(extension_config: &ExtensionConfig): u32 {
    assert!(extension_config.has_rule<TribeConfigKey>(TribeConfigKey {}), ENoTribeConfig);
    extension_config.borrow_rule<TribeConfigKey, TribeConfig>(TribeConfigKey {}).tribe
}

public fun expiry_duration_ms(extension_config: &ExtensionConfig): u64 {
    assert!(extension_config.has_rule<TribeConfigKey>(TribeConfigKey {}), ENoTribeConfig);
    extension_config.borrow_rule<TribeConfigKey, TribeConfig>(TribeConfigKey {}).expiry_duration_ms
}

/// Issue a \`JumpPermit\` to only starter tribes
public fun issue_jump_permit(
    extension_config: &ExtensionConfig,
    source_gate: &Gate,
    destination_gate: &Gate,
    character: &Character,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    assert!(extension_config.has_rule<TribeConfigKey>(TribeConfigKey {}), ENoTribeConfig);
    let tribe_cfg = extension_config.borrow_rule<TribeConfigKey, TribeConfig>(TribeConfigKey {});

    // Check if the character's tribe is a starter tribe
    assert!(character.tribe() == tribe_cfg.tribe, ENotStarterTribe);

    let expiry_ms = tribe_cfg.expiry_duration_ms;
    let ts = clock.timestamp_ms();
    assert!(ts <= (0xFFFFFFFFFFFFFFFFu64 - expiry_ms), EExpiryOverflow);
    let expires_at_timestamp_ms = ts + expiry_ms;
    gate::issue_jump_permit<XAuth>(
        source_gate,
        destination_gate,
        character,
        config::x_auth(),
        expires_at_timestamp_ms,
        ctx,
    );
}

// === Admin Functions ===
public fun set_tribe_config(
    extension_config: &mut ExtensionConfig,
    admin_cap: &AdminCap,
    tribe: u32,
    expiry_duration_ms: u64,
) {
    extension_config.set_rule<TribeConfigKey, TribeConfig>(
        admin_cap,
        TribeConfigKey {},
        TribeConfig { tribe, expiry_duration_ms },
    );
}
`,
    'sources/corpse_gate_bounty.move': `/// Example builder extension for the \`world\` package.
///
/// This module demonstrates how to extend \`world\`'s \`StorageUnit\` and \`Gate\` assemblies:
/// - withdraw an item from a player's \`StorageUnit\` (with owner auth)
/// - validate it against a bounty rule (stored under \`ExtensionConfig\`)
/// - deposit it into an owner \`StorageUnit\`
/// - issue a \`world::gate::JumpPermit\` so the player can use the gate
module smart_gate_extension::corpse_gate_bounty;

use smart_gate_extension::config::{Self, AdminCap, XAuth, ExtensionConfig};
use sui::clock::Clock;
use world::{
    access::OwnerCap,
    character::Character,
    gate::{Self, Gate},
    storage_unit::StorageUnit
};

// === Errors ===
#[error(code = 0)]
const ECorpseTypeIdEmpty: vector<u8> = b"Corpse type id is empty";
#[error(code = 1)]
const ECorpseTypeMismatch: vector<u8> = b"Corpse type id mismatch";
#[error(code = 2)]
const ENoBountyConfig: vector<u8> = b"Missing BountyConfig on ExtensionConfig";
#[error(code = 3)]
const EExpiryOverflow: vector<u8> = b"Expiry timestamp overflow";

/// Stored as a dynamic field value under \`ExtensionConfig\`.
public struct BountyConfig has drop, store {
    bounty_type_id: u64,
    expiry_duration_ms: u64,
}

/// Dynamic-field key for \`BountyConfig\`.
public struct BountyConfigKey has copy, drop, store {}

/// Submit a corpse to get a \`JumpPermit\` for using the gate.
public fun collect_corpse_bounty<T: key>(
    extension_config: &ExtensionConfig,
    storage_unit: &mut StorageUnit,
    source_gate: &Gate,
    destination_gate: &Gate,
    character: &Character,
    player_inventory_owner_cap: &OwnerCap<T>,
    corpse_type_id: u64,
    quantity: u32,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    assert!(extension_config.has_rule<BountyConfigKey>(BountyConfigKey {}), ENoBountyConfig);
    let bounty_cfg = extension_config.borrow_rule<
        BountyConfigKey,
        BountyConfig,
    >(BountyConfigKey {});

    // Withdraw the corpse from the player's inventory (owner-authorized).
    let corpse = storage_unit.withdraw_by_owner<T>(
        character,
        player_inventory_owner_cap,
        corpse_type_id,
        quantity,
        ctx,
    );

    // Check if the corpse is of the correct type.
    assert!(corpse.type_id() == bounty_cfg.bounty_type_id, ECorpseTypeMismatch);

    storage_unit.deposit_item<XAuth>(
        character,
        corpse,
        config::x_auth(),
        ctx,
    );

    let expiry_ms = bounty_cfg.expiry_duration_ms;
    let ts = clock.timestamp_ms();
    assert!(ts <= (0xFFFFFFFFFFFFFFFFu64 - expiry_ms), EExpiryOverflow);
    let expires_at_timestamp_ms = ts + expiry_ms;
    gate::issue_jump_permit<XAuth>(
        source_gate,
        destination_gate,
        character,
        config::x_auth(),
        expires_at_timestamp_ms,
        ctx,
    );
}

// === View Functions ===
public fun bounty_type_id(extension_config: &ExtensionConfig): u64 {
    extension_config.borrow_rule<BountyConfigKey, BountyConfig>(BountyConfigKey {}).bounty_type_id
}

public fun bounty_expiry_duration_ms(extension_config: &ExtensionConfig): u64 {
    extension_config
        .borrow_rule<BountyConfigKey, BountyConfig>(BountyConfigKey {})
        .expiry_duration_ms
}

// === Admin Functions ===
public fun set_bounty_config(
    extension_config: &mut ExtensionConfig,
    admin_cap: &AdminCap,
    bounty_type_id: u64,
    expiry_duration_ms: u64,
) {
    assert!(bounty_type_id != 0, ECorpseTypeIdEmpty);
    extension_config.set_rule<BountyConfigKey, BountyConfig>(
        admin_cap,
        BountyConfigKey {},
        BountyConfig { bounty_type_id, expiry_duration_ms },
    );
}
`,
  }),
};
