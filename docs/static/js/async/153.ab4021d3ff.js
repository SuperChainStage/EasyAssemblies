"use strict";(globalThis.rspackChunkeasy_assemblies=globalThis.rspackChunkeasy_assemblies||[]).push([["153"],{26977(e,t,i){i.d(t,{e:()=>a});var o=i(62615),r=i(51275),n=i(5826);function a(e){let{buildStatus:t,deployStatus:i}=e,{network:a,selectNetwork:s}=(0,r.$8)(),u=n.aF[a];return(0,o.jsxs)("footer",{className:"ev-statusbar",children:[(0,o.jsxs)("div",{className:"ev-statusbar__left",children:[t&&"idle"!==t&&(0,o.jsx)("span",{className:`ev-statusbar__ind ev-statusbar__ind--${t}`,children:"building"===t?"\u23F3 Building":"success"===t?"\u2713 Built":"\u2717 Error"}),i&&"idle"!==i&&(0,o.jsx)("span",{className:`ev-statusbar__ind ev-statusbar__ind--${"deploying"===i?"building":i}`,children:"deploying"===i?"\u23F3 Deploying":"success"===i?"\u2713 Deployed":"\u2717 Error"})]}),(0,o.jsxs)("div",{className:"ev-statusbar__right",children:[(0,o.jsxs)("button",{type:"button",className:"ev-statusbar__net-toggle",onClick:()=>{let e=n.vu.map(e=>e.id),t=e.indexOf(a),i=e[(t+1)%e.length];s(i),localStorage.setItem("playmove_network",i)},title:"Switch network",children:[(0,o.jsx)("span",{className:"ev-statusbar__dot"}),(0,o.jsx)("span",{children:(null==u?void 0:u.environmentLabel)??a}),(0,o.jsx)("span",{className:"ev-statusbar__swap",children:"\u21C4"})]}),(0,o.jsx)("span",{className:"ev-statusbar__item ev-statusbar__item--dim",children:"v0.1.0"})]})]})}},54104(e,t,i){i.d(t,{ln:()=>Y,My:()=>J,ul:()=>Z,$F:()=>et});let o=[{id:"A1",category:"access",selectionMode:"radio",radioGroup:"access_mode",label:"Single Tribe",description:"Only characters belonging to the configured tribe may pass.",defaultEnabled:!0,configFields:[{key:"tribeId",label:"Allowed Tribe ID",type:"number",defaultValue:100,phase:"post-deploy"}],codeSnippet:()=>`
    // [A1] Single Tribe Check
    assert!(extension_config.has_rule<TribeConfigKey>(TribeConfigKey {}), ENoTribeConfig);
    let tribe_cfg = extension_config.borrow_rule<TribeConfigKey, TribeConfig>(TribeConfigKey {});
    assert!(character.tribe() == tribe_cfg.tribe, ENotAllowedTribe);`},{id:"A2",category:"access",selectionMode:"radio",radioGroup:"access_mode",label:"Multi-Tribe Whitelist",description:"Allow characters from any of the listed ally tribes.",defaultEnabled:!1,configFields:[{key:"allowedTribes",label:"Allowed Tribe IDs (comma-separated)",type:"string",defaultValue:"100,200,300",placeholder:"e.g. 100,200,300",phase:"compile"}],codeSnippet:e=>{let t=String((null==e?void 0:e.allowedTribes)??"100,200,300").split(",").map(e=>e.trim()).filter(Boolean);return`
    // [A2] Multi-Tribe Whitelist
    {
        let allowed_tribes: vector<u32> = vector[${t.join(", ")}];
        let char_tribe = character.tribe();
        let mut allowed = false;
        let mut i = 0u64;
        while (i < allowed_tribes.length()) {
            if (char_tribe == allowed_tribes[i]) { allowed = true; };
            i = i + 1;
        };
        assert!(allowed, ENotAllowedTribe);
    };`}},{id:"A3",category:"access",selectionMode:"radio",radioGroup:"access_mode",label:"Tribe Blacklist",description:"Block characters from the listed tribes; everyone else may pass.",defaultEnabled:!1,configFields:[{key:"blockedTribes",label:"Blocked Tribe IDs (comma-separated)",type:"string",defaultValue:"500,600",placeholder:"e.g. 500,600",phase:"compile"}],codeSnippet:e=>{let t=String((null==e?void 0:e.blockedTribes)??"500,600").split(",").map(e=>e.trim()).filter(Boolean);return`
    // [A3] Tribe Blacklist
    {
        let blocked_tribes: vector<u32> = vector[${t.join(", ")}];
        let char_tribe = character.tribe();
        let mut j = 0u64;
        while (j < blocked_tribes.length()) {
            assert!(char_tribe != blocked_tribes[j], EBlockedTribe);
            j = j + 1;
        };
    };`}},{id:"P1",category:"payment",selectionMode:"checkbox",label:"Fixed Price",description:"Require a fixed SUI payment to pass through the gate.",defaultEnabled:!0,configFields:[{key:"price",label:"Price (MIST)",type:"number",defaultValue:1e8,placeholder:"100000000 = 0.1 SUI",phase:"post-deploy"}],codeSnippet:()=>`
    // [P1] Fixed Price
    assert!(extension_config.has_rule<TollConfigKey>(TollConfigKey {}), ENoTollConfig);
    let toll_cfg = extension_config.borrow_rule<TollConfigKey, TollConfig>(TollConfigKey {});
    let mut required_price = toll_cfg.price;`},{id:"P2",category:"payment",selectionMode:"checkbox",label:"Tribe Discount",description:"Members of specified tribes pay a discounted price.",defaultEnabled:!1,configFields:[{key:"discountTribes",label:"Discount Tribe IDs (comma-separated)",type:"string",defaultValue:"100,200",placeholder:"e.g. 100,200",phase:"compile"},{key:"discountPct",label:"Discount percentage (0-99)",type:"number",defaultValue:50,phase:"compile"}],codeSnippet:e=>{let t=String((null==e?void 0:e.discountTribes)??"100,200").split(",").map(e=>e.trim()).filter(Boolean),i=Number((null==e?void 0:e.discountPct)??50);return`
    // [P2] Tribe Discount
    {
        let discount_tribes: vector<u32> = vector[${t.join(", ")}];
        let char_tribe_d = character.tribe();
        let mut d = 0u64;
        while (d < discount_tribes.length()) {
            if (char_tribe_d == discount_tribes[d]) {
                required_price = required_price * ${100-i} / 100;
            };
            d = d + 1;
        };
    };`}},{id:"P3",category:"payment",selectionMode:"checkbox",label:"Free for Tribe",description:"Members of specified tribes pass for free.",defaultEnabled:!1,configFields:[{key:"freeTribes",label:"Free Tribe IDs (comma-separated)",type:"string",defaultValue:"100",placeholder:"e.g. 100",phase:"compile"}],codeSnippet:e=>{let t=String((null==e?void 0:e.freeTribes)??"100").split(",").map(e=>e.trim()).filter(Boolean);return`
    // [P3] Free for Tribe
    {
        let free_tribes: vector<u32> = vector[${t.join(", ")}];
        let char_tribe_f = character.tribe();
        let mut f = 0u64;
        while (f < free_tribes.length()) {
            if (char_tribe_f == free_tribes[f]) {
                required_price = 0;
            };
            f = f + 1;
        };
    };`}},{id:"R1",category:"revenue",selectionMode:"checkbox",label:"Owner Collect",description:"Transfer the payment directly to the gate owner.",defaultEnabled:!0,configFields:[{key:"ownerAddress",label:"Owner address",type:"string",defaultValue:"",placeholder:"Leave blank to use deployer wallet",phase:"post-deploy"}],codeSnippet:()=>`
    // [R1] Owner Collect \u{2014} validate payment amount, handle change, transfer to owner
    if (required_price > 0) {
        assert!(coin::value(&payment) >= required_price, EInsufficientPayment);
        let paid = coin::value(&payment);
        if (paid > required_price) {
            let change = payment.split(paid - required_price, ctx);
            transfer::public_transfer(change, ctx.sender());
        };
        transfer::public_transfer(payment, toll_cfg.owner_address);
    } else {
        transfer::public_transfer(payment, ctx.sender());
    };`},{id:"I1",category:"item",selectionMode:"radio",radioGroup:"item_mode",label:"Single Item Type",description:"Accept only one specific item type as bounty.",defaultEnabled:!0,configFields:[{key:"bountyTypeId",label:"Required Item Type ID",type:"number",defaultValue:1001,phase:"post-deploy"}],codeSnippet:()=>`
    // [I1] Single Item Type
    assert!(extension_config.has_rule<BountyConfigKey>(BountyConfigKey {}), ENoBountyConfig);
    let bounty_cfg = extension_config.borrow_rule<BountyConfigKey, BountyConfig>(BountyConfigKey {});
    assert!(corpse.type_id() == bounty_cfg.bounty_type_id, EItemTypeMismatch);`},{id:"I2",category:"item",selectionMode:"radio",radioGroup:"item_mode",label:"Multi-Item Accept",description:"Accept any of several item types as bounty.",defaultEnabled:!1,configFields:[{key:"acceptedTypes",label:"Accepted Item Type IDs (comma-separated)",type:"string",defaultValue:"1001,1002,1003",placeholder:"e.g. 1001,1002,1003",phase:"compile"}],codeSnippet:e=>{let t=String((null==e?void 0:e.acceptedTypes)??"1001,1002,1003").split(",").map(e=>e.trim()).filter(Boolean);return`
    // [I2] Multi-Item Accept
    {
        let accepted_types: vector<u64> = vector[${t.join(", ")}];
        let submitted_type = corpse.type_id();
        let mut accepted = false;
        let mut m = 0u64;
        while (m < accepted_types.length()) {
            if (submitted_type == accepted_types[m]) { accepted = true; };
            m = m + 1;
        };
        assert!(accepted, EItemTypeNotAccepted);
    };`}},{id:"I3",category:"item",selectionMode:"checkbox",label:"Minimum Quantity",description:"Require a minimum number of items to be submitted.",defaultEnabled:!1,configFields:[{key:"minQuantity",label:"Minimum quantity",type:"number",defaultValue:5,phase:"compile"}],codeSnippet:e=>{let t=Number((null==e?void 0:e.minQuantity)??5);return`
    // [I3] Minimum Quantity
    assert!(quantity >= ${t}, EInsufficientQuantity);`}},{id:"C1",category:"config",selectionMode:"checkbox",label:"Fixed Expiry",description:"Permit expiry duration (milliseconds). Default: 1 hour.",defaultEnabled:!0,configFields:[{key:"expiryDurationMs",label:"Permit expiry (ms)",type:"number",defaultValue:36e5,placeholder:"3600000 = 1 hour",phase:"post-deploy"}],codeSnippet:()=>""}];function r(e){let t=new Set({tribe_permit:["A1","A2","A3","C1"],toll_gate:["P1","P2","P3","R1","C1"],bounty_gate:["I1","I2","I3","C1"],open_permit:["C1"],multi_rule:["A1","A2","A3","P1","P2","P3","R1","C1"]}[e]??[]);return o.filter(e=>t.has(e.id))}let n="smart_gate_extension";function a(e,t){return t===n?e:e.replaceAll(n,t)}function s(e,t){let i=o.filter(i=>i.category===e&&t.enabledChips.includes(i.id));return 0===i.length?"":i.map(e=>e.codeSnippet(t.chipConfigs[e.id])).join("\n")}function u(e,t){return t.enabledChips.includes(e)}function l(e){var t;let i=Number(null==(t=e.chipConfigs.C1)?void 0:t.expiryDurationMs);return Number.isFinite(i)&&i>0?i:36e5}let c={tribe_permit:e=>{let t,i,o,r,n,a;return{filename:"sources/tribe_permit.move",content:(t=s("access",e),i=l(e),r=(o=u("A1",e))?`
public struct TribeConfig has drop, store {
    tribe: u32,
    expiry_duration_ms: u64,
}

public struct TribeConfigKey has copy, drop, store {}
`:"",n=o?`
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
`:"",a=o?"let expiry_ms = tribe_cfg.expiry_duration_ms;":`let expiry_ms: u64 = ${i};`,`/// Tribe Permit Gate \u{2014} generated by EasyAssemblies.
///
/// Chips: [${e.enabledChips.join(", ")}]
#[allow(unused_use)]
module smart_gate_extension::tribe_permit;

use smart_gate_extension::config::{Self, AdminCap, XAuth, ExtensionConfig};
use sui::clock::Clock;
use world::{character::Character, gate::{Self, Gate}};

// === Errors ===
#[error(code = 0)]
const ENotAllowedTribe: vector<u8> = b"Character tribe not allowed";
#[error(code = 1)]
const ENoTribeConfig: vector<u8> = b"Missing TribeConfig on ExtensionConfig";
#[error(code = 2)]
const EExpiryOverflow: vector<u8> = b"Expiry timestamp overflow";
#[error(code = 3)]
const EBlockedTribe: vector<u8> = b"Character tribe is blocked";
${r}
public fun issue_jump_permit(
    extension_config: &ExtensionConfig,
    source_gate: &Gate,
    destination_gate: &Gate,
    character: &Character,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    // \u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550} Access chips \u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}${t||`
    // (none selected)`}

    // \u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550} Issue permit \u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}
    ${a}
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
${n}`)}},toll_gate:e=>{let t,i;return{filename:"sources/toll_gate.move",content:(t=s("payment",e),i=s("revenue",e),l(e),`/// Toll Gate \u{2014} generated by EasyAssemblies.
///
/// Chips: [${e.enabledChips.join(", ")}]
#[allow(unused_use, unused_variable, unused_mut_parameter)]
module smart_gate_extension::toll_gate;

use smart_gate_extension::config::{Self, AdminCap, XAuth, ExtensionConfig};
use sui::clock::Clock;
use sui::coin::{Self, Coin};
use sui::sui::SUI;
use world::{character::Character, gate::{Self, Gate}};

// === Errors ===
#[error(code = 0)]
const ENoTollConfig: vector<u8> = b"Missing TollConfig on ExtensionConfig";
#[error(code = 1)]
const EInsufficientPayment: vector<u8> = b"Insufficient payment amount";
#[error(code = 2)]
const EExpiryOverflow: vector<u8> = b"Expiry timestamp overflow";

public struct TollConfig has drop, store {
    price: u64,
    owner_address: address,
    expiry_duration_ms: u64,
}

public struct TollConfigKey has copy, drop, store {}

public fun buy_pass(
    extension_config: &ExtensionConfig,
    source_gate: &Gate,
    destination_gate: &Gate,
    character: &Character,
    mut payment: Coin<SUI>,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    // \u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550} Payment chips \u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}${t||`
    // (none selected)`}

    // \u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550} Revenue chips \u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}${i||`
    // (none selected)`}

    // \u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550} Issue permit \u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}
    let expiry_ms = toll_cfg.expiry_duration_ms;
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
public fun set_toll_config(
    extension_config: &mut ExtensionConfig,
    admin_cap: &AdminCap,
    price: u64,
    owner_address: address,
    expiry_duration_ms: u64,
) {
    extension_config.set_rule<TollConfigKey, TollConfig>(
        admin_cap,
        TollConfigKey {},
        TollConfig { price, owner_address, expiry_duration_ms },
    );
}
`)}},bounty_gate:e=>{let t;return{filename:"sources/bounty_gate.move",content:(t=s("item",e),l(e),`/// Bounty Gate \u{2014} generated by EasyAssemblies.
///
/// Chips: [${e.enabledChips.join(", ")}]
#[allow(unused_use, unused_variable)]
module smart_gate_extension::bounty_gate;

use smart_gate_extension::config::{Self, AdminCap, XAuth, ExtensionConfig};
use sui::clock::Clock;
use world::{
    access::OwnerCap,
    character::Character,
    gate::{Self, Gate},
    storage_unit::StorageUnit,
};

// === Errors ===
#[error(code = 0)]
const ENoBountyConfig: vector<u8> = b"Missing BountyConfig on ExtensionConfig";
#[error(code = 1)]
const EItemTypeMismatch: vector<u8> = b"Item type mismatch";
#[error(code = 2)]
const EItemTypeNotAccepted: vector<u8> = b"Item type not accepted";
#[error(code = 3)]
const EInsufficientQuantity: vector<u8> = b"Insufficient item quantity";
#[error(code = 4)]
const EExpiryOverflow: vector<u8> = b"Expiry timestamp overflow";

public struct BountyConfig has drop, store {
    bounty_type_id: u64,
    expiry_duration_ms: u64,
}

public struct BountyConfigKey has copy, drop, store {}

public fun collect_bounty<T: key>(
    extension_config: &ExtensionConfig,
    storage_unit: &mut StorageUnit,
    source_gate: &Gate,
    destination_gate: &Gate,
    character: &Character,
    player_inventory_owner_cap: &OwnerCap<T>,
    item_type_id: u64,
    quantity: u32,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let corpse = storage_unit.withdraw_by_owner<T>(
        character,
        player_inventory_owner_cap,
        item_type_id,
        quantity,
        ctx,
    );

    // \u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550} Item chips \u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}${t||`
    // (none selected)`}

    storage_unit.deposit_item<XAuth>(
        character,
        corpse,
        config::x_auth(),
        ctx,
    );

    // \u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550} Issue permit \u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}
    let bounty_cfg = extension_config.borrow_rule<BountyConfigKey, BountyConfig>(BountyConfigKey {});
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

// === Admin Functions ===
public fun set_bounty_config(
    extension_config: &mut ExtensionConfig,
    admin_cap: &AdminCap,
    bounty_type_id: u64,
    expiry_duration_ms: u64,
) {
    extension_config.set_rule<BountyConfigKey, BountyConfig>(
        admin_cap,
        BountyConfigKey {},
        BountyConfig { bounty_type_id, expiry_duration_ms },
    );
}
`)}},open_permit:e=>{let t;return{filename:"sources/open_permit.move",content:(t=l(e),`/// Open Permit Gate \u{2014} generated by EasyAssemblies.
///
/// Anyone can request a permit. No access restrictions.
/// Chips: [${e.enabledChips.join(", ")}]
#[allow(unused_use)]
module smart_gate_extension::open_permit;

use smart_gate_extension::config::{Self, XAuth};
use sui::clock::Clock;
use world::{character::Character, gate::{Self, Gate}};

// === Errors ===
#[error(code = 0)]
const EExpiryOverflow: vector<u8> = b"Expiry timestamp overflow";

const PERMIT_DURATION_MS: u64 = ${t};

public fun request_permit(
    source_gate: &Gate,
    destination_gate: &Gate,
    character: &Character,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let ts = clock.timestamp_ms();
    assert!(ts <= (0xFFFFFFFFFFFFFFFFu64 - PERMIT_DURATION_MS), EExpiryOverflow);
    let expires_at = ts + PERMIT_DURATION_MS;
    gate::issue_jump_permit<XAuth>(
        source_gate,
        destination_gate,
        character,
        config::x_auth(),
        expires_at,
        ctx,
    );
}
`)}},multi_rule:e=>{let t,i,o,r,n,a,c,d,p,g,m;return{filename:"sources/multi_rule.move",content:(t=s("access",e),i=s("payment",e),o=s("revenue",e),r=l(e),n=u("P1",e),c=(a=u("A1",e))?`
public struct TribeConfig has drop, store {
    tribe: u32,
}

public struct TribeConfigKey has copy, drop, store {}
`:"",d=n?`
public struct TollConfig has drop, store {
    price: u64,
    owner_address: address,
}

public struct TollConfigKey has copy, drop, store {}
`:"",p=n?`
    mut payment: Coin<SUI>,`:"",g=n?`
use sui::coin::{Self, Coin};
use sui::sui::SUI;`:"",m=[],a&&m.push(`
public fun set_tribe_config(
    extension_config: &mut ExtensionConfig,
    admin_cap: &AdminCap,
    tribe: u32,
) {
    extension_config.set_rule<TribeConfigKey, TribeConfig>(
        admin_cap,
        TribeConfigKey {},
        TribeConfig { tribe },
    );
}`),n&&m.push(`
public fun set_toll_config(
    extension_config: &mut ExtensionConfig,
    admin_cap: &AdminCap,
    price: u64,
    owner_address: address,
) {
    extension_config.set_rule<TollConfigKey, TollConfig>(
        admin_cap,
        TollConfigKey {},
        TollConfig { price, owner_address },
    );
}`),`/// Multi-Rule Gate \u{2014} generated by EasyAssemblies.
///
/// Combines access control and payment rules in a single gate.
/// Chips: [${e.enabledChips.join(", ")}]
#[allow(unused_use, unused_variable, unused_mut_parameter)]
module smart_gate_extension::multi_rule;

use smart_gate_extension::config::{Self, AdminCap, XAuth, ExtensionConfig};
use sui::clock::Clock;${g}
use world::{character::Character, gate::{Self, Gate}};

// === Errors ===
#[error(code = 0)]
const ENotAllowedTribe: vector<u8> = b"Character tribe not allowed";
#[error(code = 1)]
const ENoTribeConfig: vector<u8> = b"Missing TribeConfig on ExtensionConfig";
#[error(code = 2)]
const EBlockedTribe: vector<u8> = b"Character tribe is blocked";
#[error(code = 3)]
const ENoTollConfig: vector<u8> = b"Missing TollConfig on ExtensionConfig";
#[error(code = 4)]
const EInsufficientPayment: vector<u8> = b"Insufficient payment amount";
#[error(code = 5)]
const EExpiryOverflow: vector<u8> = b"Expiry timestamp overflow";
${c}${d}
public fun issue_jump_permit(
    extension_config: &ExtensionConfig,
    source_gate: &Gate,
    destination_gate: &Gate,
    character: &Character,${p}
    clock: &Clock,
    ctx: &mut TxContext,
) {
    // \u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550} Access chips \u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}${t||`
    // (none selected)`}

    // \u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550} Payment chips \u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}${i||`
    // (none selected)`}

    // \u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550} Revenue chips \u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}${o||`
    // (none selected)`}

    // \u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550} Issue permit \u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}
    let expiry_ms: u64 = ${r};
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
${m.join("\n")}
`)}}};function d(e){let t=e.moduleName||n,i=(0,c[e.templateTag])(e.selection);return{"Move.toml":`[package]
name = "${t}"
edition = "2024"

[dependencies]
world = { git = "https://github.com/evefrontier/world-contracts.git", subdir = "contracts/world", rev = "v0.0.21" }

[environments]
testnet = "4c78adac"
testnet_internal = "4c78adac"
testnet_utopia = "4c78adac"
testnet_stillness = "4c78adac"
`,"sources/config.move":a(`/// Shared configuration for gate extensions \u{2014} generated by EasyAssemblies.
module smart_gate_extension::config;

use sui::dynamic_field as df;

public struct ExtensionConfig has key {
    id: UID,
}

public struct AdminCap has key, store {
    id: UID,
}

public struct XAuth has drop {}

fun init(ctx: &mut TxContext) {
    let admin_cap = AdminCap { id: object::new(ctx) };
    transfer::transfer(admin_cap, ctx.sender());

    let config = ExtensionConfig { id: object::new(ctx) };
    transfer::share_object(config);
}

public fun has_rule<K: copy + drop + store>(config: &ExtensionConfig, key: K): bool {
    df::exists_(&config.id, key)
}

public fun borrow_rule<K: copy + drop + store, V: store>(config: &ExtensionConfig, key: K): &V {
    df::borrow(&config.id, key)
}

public fun set_rule<K: copy + drop + store, V: store + drop>(
    config: &mut ExtensionConfig,
    _: &AdminCap,
    key: K,
    value: V,
) {
    if (df::exists_(&config.id, copy key)) {
        let _old: V = df::remove(&mut config.id, copy key);
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

public(package) fun x_auth(): XAuth {
    XAuth {}
}
`,t),[i.filename]:a(i.content,t)}}let p=[{id:"single_tribe",label:"Single Tribe",description:"Only one tribe may pass through.",chips:["A1","C1"]},{id:"alliance",label:"Alliance",description:"Multiple allied tribes may pass through.",chips:["A2","C1"],chipConfigs:{A2:{allowedTribes:"100,200,300"}}},{id:"embargo",label:"Embargo",description:"Block specific tribes; everyone else passes.",chips:["A3","C1"],chipConfigs:{A3:{blockedTribes:"500,600"}}}],g=[{id:"simple_toll",label:"Simple Toll",description:"Fixed price, fees go to the gate owner.",chips:["P1","R1","C1"]},{id:"alliance_discount",label:"Alliance Discount",description:"Allied tribes get a discounted fare.",chips:["P1","P2","R1","C1"],chipConfigs:{P2:{discountTribes:"100,200",discountPct:50}}},{id:"friendly_gate",label:"Friendly Gate",description:"Allied tribes pass free; others pay.",chips:["P1","P3","R1","C1"],chipConfigs:{P3:{freeTribes:"100"}}},{id:"toll_with_change",label:"Toll + Change",description:"Fixed price with automatic change returned to the traveler.",chips:["P1","R1","C1"]}],m=[{id:"simple_bounty",label:"Simple Bounty",description:"Submit a single item type to gain passage.",chips:["I1","C1"]},{id:"multi_bounty",label:"Multi-Bounty",description:"Accept any of several item types.",chips:["I2","C1"],chipConfigs:{I2:{acceptedTypes:"1001,1002,1003"}}},{id:"bulk_bounty",label:"Bulk Bounty",description:"Require a minimum quantity of items.",chips:["I1","I3","C1"],chipConfigs:{I3:{minQuantity:5}}}],_=[{id:"tribe_toll",label:"Tribe + Toll",description:"Only the configured tribe may pass, and they must pay.",chips:["A1","P1","R1","C1"]},{id:"vip_gate",label:"VIP Gate",description:"Whitelisted tribes pass free; everyone else pays.",chips:["A2","P1","P3","R1","C1"],chipConfigs:{A2:{allowedTribes:"100,200,300"},P3:{freeTribes:"100,200,300"}}},{id:"embargo_toll",label:"Embargo + Toll",description:"Blacklisted tribes are blocked; everyone else pays.",chips:["A3","P1","R1","C1"],chipConfigs:{A3:{blockedTribes:"500,600"}}}];function f(){let e=p["0"];return{enabledChips:[...e.chips],chipConfigs:e.chipConfigs?structuredClone(e.chipConfigs):{}}}let h={id:"gate_tribe_permit",label:"Tribe Permit Gate",assemblyType:"gate",description:"Only characters from a configured tribe can jump through.",detail:"Deploy a gate extension that checks the traveler's tribe before issuing a jump permit. Choose single-tribe, multi-tribe whitelist, or blacklist mode.",chipConfig:{chips:r("tribe_permit"),presets:p,categories:[{key:"access",label:"Access Control",icon:"\u{1F510}"},{key:"config",label:"Configuration",icon:"\u2699\uFE0F"}],defaultModuleName:"smart_gate_extension"},files:e=>{let{moduleName:t,selection:i}=function(e){if(!e)return{moduleName:"smart_gate_extension",selection:f()};let t="string"==typeof e.moduleName&&e.moduleName?e.moduleName:"smart_gate_extension";return{moduleName:t,selection:{enabledChips:Array.isArray(e.enabledChips)?e.enabledChips:f().enabledChips,chipConfigs:e.chipConfigs&&"object"==typeof e.chipConfigs?e.chipConfigs:{}}}}(e);return d({templateTag:"tribe_permit",moduleName:t,selection:i})}};function b(){let e=g["0"];return{enabledChips:[...e.chips],chipConfigs:e.chipConfigs?structuredClone(e.chipConfigs):{}}}let y={id:"gate_toll",label:"Toll Gate",assemblyType:"gate",description:"Charge SUI tokens for passage; supports discounts and free tribes.",detail:"Deploy a gate extension that requires travelers to pay a configurable SUI fee. Optionally grant discounts or free passage to allied tribes.",chipConfig:{chips:r("toll_gate"),presets:g,categories:[{key:"payment",label:"Payment Rules",icon:"\u{1F4B0}"},{key:"revenue",label:"Revenue",icon:"\u{1F3E6}"},{key:"config",label:"Configuration",icon:"\u2699\uFE0F"}],defaultModuleName:"smart_gate_extension"},files:e=>{let{moduleName:t,selection:i}=function(e){if(!e)return{moduleName:"smart_gate_extension",selection:b()};let t="string"==typeof e.moduleName&&e.moduleName?e.moduleName:"smart_gate_extension";return{moduleName:t,selection:{enabledChips:Array.isArray(e.enabledChips)?e.enabledChips:b().enabledChips,chipConfigs:e.chipConfigs&&"object"==typeof e.chipConfigs?e.chipConfigs:{}}}}(e);return d({templateTag:"toll_gate",moduleName:t,selection:i})}};function C(){let e=m["0"];return{enabledChips:[...e.chips],chipConfigs:e.chipConfigs?structuredClone(e.chipConfigs):{}}}let w={id:"gate_bounty",label:"Bounty Gate",assemblyType:"gate",description:"Submit items to earn passage; supports multi-item and bulk bounties.",detail:"Deploy a gate extension where travelers deposit items into the gate owner's storage unit in exchange for a jump permit. Configure accepted item types and quantities.",chipConfig:{chips:r("bounty_gate"),presets:m,categories:[{key:"item",label:"Item Validation",icon:"\u{1F4E6}"},{key:"config",label:"Configuration",icon:"\u2699\uFE0F"}],defaultModuleName:"smart_gate_extension"},files:e=>{let{moduleName:t,selection:i}=function(e){if(!e)return{moduleName:"smart_gate_extension",selection:C()};let t="string"==typeof e.moduleName&&e.moduleName?e.moduleName:"smart_gate_extension";return{moduleName:t,selection:{enabledChips:Array.isArray(e.enabledChips)?e.enabledChips:C().enabledChips,chipConfigs:e.chipConfigs&&"object"==typeof e.chipConfigs?e.chipConfigs:{}}}}(e);return d({templateTag:"bounty_gate",moduleName:t,selection:i})}},x={id:"gate_open_permit",label:"Open Permit Gate",assemblyType:"gate",description:"Anyone can request a permit \u2014 no access restrictions.",detail:"Deploy a gate extension that issues jump permits to anyone who requests one. Useful for tracking gate usage via on-chain events, or as a placeholder before adding rules later.",chipConfig:{chips:r("open_permit"),presets:[{id:"open_default",label:"Open Gate",description:"Anyone can request a permit \u2014 no restrictions.",chips:["C1"]}],categories:[{key:"config",label:"Configuration",icon:"\u2699\uFE0F"}],defaultModuleName:"smart_gate_extension"},files:e=>{var t;let{moduleName:i,selection:o}=(t=e)?{moduleName:"string"==typeof t.moduleName&&t.moduleName?t.moduleName:"smart_gate_extension",selection:{enabledChips:["C1"],chipConfigs:t.chipConfigs&&"object"==typeof t.chipConfigs?t.chipConfigs:{}}}:{moduleName:"smart_gate_extension",selection:{enabledChips:["C1"],chipConfigs:{}}};return d({templateTag:"open_permit",moduleName:i,selection:o})}};function v(){let e=_["0"];return{enabledChips:[...e.chips],chipConfigs:e.chipConfigs?structuredClone(e.chipConfigs):{}}}let k={id:"gate_multi_rule",label:"Multi-Rule Gate",assemblyType:"gate",description:"Combine tribe access control with payment rules in one gate.",detail:"Deploy an advanced gate extension that chains access checks (tribe whitelist/blacklist) with payment rules (toll, discounts, free passage). The most flexible Gate template.",chipConfig:{chips:r("multi_rule"),presets:_,categories:[{key:"access",label:"Access Control",icon:"\u{1F510}"},{key:"payment",label:"Payment Rules",icon:"\u{1F4B0}"},{key:"revenue",label:"Revenue",icon:"\u{1F3E6}"},{key:"config",label:"Configuration",icon:"\u2699\uFE0F"}],defaultModuleName:"smart_gate_extension"},files:e=>{let{moduleName:t,selection:i}=function(e){if(!e)return{moduleName:"smart_gate_extension",selection:v()};let t="string"==typeof e.moduleName&&e.moduleName?e.moduleName:"smart_gate_extension";return{moduleName:t,selection:{enabledChips:Array.isArray(e.enabledChips)?e.enabledChips:v().enabledChips,chipConfigs:e.chipConfigs&&"object"==typeof e.chipConfigs?e.chipConfigs:{}}}}(e);return d({templateTag:"multi_rule",moduleName:t,selection:i})}},T=[{id:"E1",category:"exclude",selectionMode:"checkbox",label:"Friendly Fire Protection",description:"Do not shoot same-tribe members unless they are attacking.",defaultEnabled:!0,codeSnippet:()=>`
        // [E1] Friendly Fire Protection
        if (turret::character_tribe(candidate) == owner_tribe && !turret::is_aggressor(candidate)) {
            excluded = true;
        };`},{id:"E2",category:"exclude",selectionMode:"checkbox",label:"Owner Protection",description:"Never shoot the turret owner's own ship.",defaultEnabled:!0,codeSnippet:()=>`
        // [E2] Owner Protection
        if (turret::character_id(candidate) != 0 && turret::character_id(candidate) == owner_character_id) {
            excluded = true;
        };`},{id:"E3",category:"exclude",selectionMode:"checkbox",label:"Ceasefire Detection",description:"Stop shooting targets that ceased attacking.",defaultEnabled:!0,codeSnippet:()=>`
        // [E3] Ceasefire Detection
        if (behaviour_to_u8(turret::behaviour_change(candidate)) == STOPPED_ATTACK) {
            excluded = true;
        };`},{id:"E4",category:"exclude",selectionMode:"checkbox",label:"NPC Ignore",description:"Ignore all NPCs, only engage player ships.",defaultEnabled:!1,conflictsWith:["E5","W6"],codeSnippet:()=>`
        // [E4] NPC Ignore
        if (turret::character_id(candidate) == 0) {
            excluded = true;
        };`},{id:"E5",category:"exclude",selectionMode:"checkbox",label:"Player Ignore",description:"Ignore all player ships, only engage NPCs.",defaultEnabled:!1,conflictsWith:["E4"],codeSnippet:()=>`
        // [E5] Player Ignore
        if (turret::character_id(candidate) != 0) {
            excluded = true;
        };`},{id:"E6",category:"exclude",selectionMode:"checkbox",label:"Tribe Whitelist",description:"Protect ships belonging to listed ally tribes.",defaultEnabled:!1,configFields:[{key:"protectedTribes",label:"Protected Tribe IDs (comma-separated)",type:"string",defaultValue:"100,200",placeholder:"e.g. 100,200,300"}],codeSnippet:e=>{let t=String((null==e?void 0:e.protectedTribes)??"100,200").split(",").map(e=>e.trim()).filter(Boolean);return`
        // [E6] Tribe Whitelist
        {
            let protected_tribes: vector<u32> = vector[${t.join(", ")}];
            let target_tribe = turret::character_tribe(candidate);
            let mut j = 0u64;
            while (j < protected_tribes.length()) {
                if (target_tribe == protected_tribes[j]) {
                    excluded = true;
                };
                j = j + 1;
            };
        };`}},{id:"W1",category:"weight",selectionMode:"checkbox",label:"Aggressor Priority",description:"Targets that started attacking get +10 000 weight.",defaultEnabled:!0,codeSnippet:()=>`
            // [W1] Aggressor Priority
            if (behaviour_to_u8(turret::behaviour_change(candidate)) == STARTED_ATTACK) {
                weight = weight + 10000;
            };`},{id:"W2",category:"weight",selectionMode:"checkbox",label:"Proximity Alert",description:"Hostile ships entering range get +1 000 weight.",defaultEnabled:!0,codeSnippet:()=>`
            // [W2] Proximity Alert
            if (behaviour_to_u8(turret::behaviour_change(candidate)) == ENTERED) {
                if (turret::character_tribe(candidate) != owner_tribe || turret::is_aggressor(candidate)) {
                    weight = weight + 1000;
                };
            };`},{id:"W3",category:"weight",selectionMode:"checkbox",label:"Ship Class Specialization",description:"Prioritize ship classes your turret is specialized against.",defaultEnabled:!1,configFields:[{key:"turretType",label:"Turret Type",type:"enum",defaultValue:"autocannon",options:[{label:"Autocannon (Shuttle, Corvette)",value:"autocannon"},{label:"Plasma (Frigate, Destroyer)",value:"plasma"},{label:"Howitzer (Cruiser, Combat BC)",value:"howitzer"}]},{key:"specBonus",label:"Specialization bonus weight",type:"number",defaultValue:5e3}],codeSnippet:e=>{let t=String((null==e?void 0:e.turretType)??"autocannon"),i=Number((null==e?void 0:e.specBonus)??5e3),o={autocannon:"31, 237",plasma:"25, 420",howitzer:"26, 419"},r=o[t]??o.autocannon;return`
            // [W3] Ship Class Specialization (${t})
            {
                let tgt_group = turret::group_id(candidate);
                let spec_groups: vector<u64> = vector[${r}];
                let mut s = 0u64;
                while (s < spec_groups.length()) {
                    if (tgt_group == spec_groups[s]) {
                        weight = weight + ${i};
                    };
                    s = s + 1;
                };
            };`}},{id:"W4",category:"weight",selectionMode:"checkbox",label:"Weakest First",description:"Prioritize low-HP targets (higher weight for lower HP).",defaultEnabled:!1,configFields:[{key:"hpMultiplier",label:"Weight per 1% missing HP",type:"number",defaultValue:50}],codeSnippet:e=>{let t=Number((null==e?void 0:e.hpMultiplier)??50);return`
            // [W4] Weakest First
            weight = weight + (100 - turret::hp_ratio(candidate)) * ${t};`}},{id:"W5",category:"weight",selectionMode:"checkbox",label:"Shieldless Priority",description:"Prioritize targets with depleted shields.",defaultEnabled:!1,configFields:[{key:"shieldMultiplier",label:"Weight per 1% missing shield",type:"number",defaultValue:30}],codeSnippet:e=>{let t=Number((null==e?void 0:e.shieldMultiplier)??30);return`
            // [W5] Shieldless Priority
            weight = weight + (100 - turret::shield_ratio(candidate)) * ${t};`}},{id:"W6",category:"weight",selectionMode:"checkbox",label:"Anti-NPC Focus",description:"NPC targets get +3 000 weight.",defaultEnabled:!1,conflictsWith:["E4"],codeSnippet:()=>`
            // [W6] Anti-NPC Focus
            if (turret::character_id(candidate) == 0) {
                weight = weight + 3000;
            };`},{id:"W7",category:"weight",selectionMode:"checkbox",label:"Tribe Enemy Boost",description:"Extra weight for ships from designated enemy tribes.",defaultEnabled:!1,configFields:[{key:"enemyTribes",label:"Enemy Tribe IDs (comma-separated)",type:"string",defaultValue:"500,600",placeholder:"e.g. 500,600"},{key:"enemyBoost",label:"Enemy weight boost",type:"number",defaultValue:8e3}],codeSnippet:e=>{let t=String((null==e?void 0:e.enemyTribes)??"500,600").split(",").map(e=>e.trim()).filter(Boolean),i=Number((null==e?void 0:e.enemyBoost)??8e3);return`
            // [W7] Tribe Enemy Boost
            {
                let enemy_tribes: vector<u32> = vector[${t.join(", ")}];
                let tgt_tribe = turret::character_tribe(candidate);
                let mut k = 0u64;
                while (k < enemy_tribes.length()) {
                    if (tgt_tribe == enemy_tribes[k]) {
                        weight = weight + ${i};
                    };
                    k = k + 1;
                };
            };`}},{id:"W8",category:"weight",selectionMode:"checkbox",label:"Size Priority (Big First)",description:"Prioritize large ships \u2014 Combat BC > Cruiser > ... > Shuttle.",defaultEnabled:!1,conflictsWith:["W9"],codeSnippet:()=>`
            // [W8] Size Priority \u{2014} Big First
            {
                let g = turret::group_id(candidate);
                if (g == 419) { weight = weight + 6000; }       // Combat BC
                else if (g == 26) { weight = weight + 5000; }   // Cruiser
                else if (g == 420) { weight = weight + 4000; }  // Destroyer
                else if (g == 25) { weight = weight + 3000; }   // Frigate
                else if (g == 237) { weight = weight + 2000; }  // Corvette
                else if (g == 31) { weight = weight + 1000; };  // Shuttle
            };`},{id:"W9",category:"weight",selectionMode:"checkbox",label:"Size Priority (Small First)",description:"Prioritize small ships \u2014 Shuttle > Corvette > ... > Combat BC.",defaultEnabled:!1,conflictsWith:["W8"],codeSnippet:()=>`
            // [W9] Size Priority \u{2014} Small First
            {
                let g = turret::group_id(candidate);
                if (g == 31) { weight = weight + 6000; }       // Shuttle
                else if (g == 237) { weight = weight + 5000; }  // Corvette
                else if (g == 25) { weight = weight + 4000; }   // Frigate
                else if (g == 420) { weight = weight + 3000; }  // Destroyer
                else if (g == 26) { weight = weight + 2000; }   // Cruiser
                else if (g == 419) { weight = weight + 1000; };  // Combat BC
            };`}];T.filter(e=>"exclude"===e.category),T.filter(e=>"weight"===e.category);let E="smart_turret_extension";function A(e,t){let i=T.filter(i=>i.category===e&&t.enabledChips.includes(i.id));return 0===i.length?"":i.map(e=>{let i=t.chipConfigs[e.id];return e.codeSnippet(i)}).join("\n")}let S=["E3","W1","W2"],I=[{id:"default_plus",label:"Default Plus",description:"Matches world-contract defaults \u2014 a safe starting point.",chips:["E1","E2","E3","W1","W2"]},{id:"tribal_defender",label:"Tribal Defender",description:"Protect allies, focus fire on enemy tribes.",chips:["E1","E2","E3","E6","W1","W2","W7"],chipConfigs:{E6:{protectedTribes:"100,200"},W7:{enemyTribes:"500,600",enemyBoost:8e3}}},{id:"anti_ship",label:"Anti-Ship Specialist",description:"Prioritize ship classes your turret is specialized against.",chips:["E1","E2","E3","W1","W2","W3"],chipConfigs:{W3:{turretType:"autocannon",specBonus:5e3}}},{id:"damage_finisher",label:"Damage Finisher",description:"Focus fire on wounded targets to maximize kills.",chips:["E1","E2","E3","W1","W2","W4","W5"],chipConfigs:{W4:{hpMultiplier:50},W5:{shieldMultiplier:30}}},{id:"npc_hunter",label:"NPC Hunter",description:"Ignore players, engage only NPCs.",chips:["E2","E3","E5","W1","W6"]},{id:"pacifist",label:"Pacifist",description:"Only retaliate \u2014 shoot targets that attack you first.",chips:["E1","E2","E3","W1"]}];function F(){let e=I["0"];return{enabledChips:[...e.chips],chipConfigs:e.chipConfigs?{...e.chipConfigs}:{}}}let P=[{id:"A0",category:"access",selectionMode:"radio",radioGroup:"ssu_access",label:"Open Access",description:"Anyone can interact \u2014 no restrictions.",defaultEnabled:!0,codeSnippet:()=>""},{id:"A1",category:"access",selectionMode:"radio",radioGroup:"ssu_access",label:"Tribe Whitelist",description:"Only characters from listed tribes may interact.",defaultEnabled:!1,configFields:[{key:"allowedTribes",label:"Allowed Tribe IDs (comma-separated)",type:"string",defaultValue:"100,200",placeholder:"e.g. 100,200",phase:"compile"}],codeSnippet:e=>{let t=String((null==e?void 0:e.allowedTribes)??"100,200").split(",").map(e=>e.trim()).filter(Boolean);return`
    // [A1] Tribe Whitelist
    {
        let allowed_tribes: vector<u32> = vector[${t.join(", ")}];
        let char_tribe = character.tribe();
        let mut allowed = false;
        let mut i = 0u64;
        while (i < allowed_tribes.length()) {
            if (char_tribe == allowed_tribes[i]) { allowed = true; };
            i = i + 1;
        };
        assert!(allowed, ENotAllowedTribe);
    };`}},{id:"A2",category:"access",selectionMode:"radio",radioGroup:"ssu_access",label:"Tribe Blacklist",description:"Block characters from listed tribes; everyone else may interact.",defaultEnabled:!1,configFields:[{key:"blockedTribes",label:"Blocked Tribe IDs (comma-separated)",type:"string",defaultValue:"500,600",placeholder:"e.g. 500,600",phase:"compile"}],codeSnippet:e=>{let t=String((null==e?void 0:e.blockedTribes)??"500,600").split(",").map(e=>e.trim()).filter(Boolean);return`
    // [A2] Tribe Blacklist
    {
        let blocked_tribes: vector<u32> = vector[${t.join(", ")}];
        let char_tribe = character.tribe();
        let mut j = 0u64;
        while (j < blocked_tribes.length()) {
            assert!(char_tribe != blocked_tribes[j], EBlockedTribe);
            j = j + 1;
        };
    };`}},{id:"V1",category:"pricing",selectionMode:"checkbox",label:"Fixed Price",description:"Each item has a fixed per-unit price in SUI.",defaultEnabled:!0,configFields:[{key:"pricePerUnit",label:"Price per unit (MIST)",type:"number",defaultValue:1e8,placeholder:"100000000 = 0.1 SUI",phase:"post-deploy"}],codeSnippet:()=>""},{id:"V2",category:"pricing",selectionMode:"checkbox",label:"Tribe Discount",description:"Members of specified tribes pay a discounted price.",defaultEnabled:!1,configFields:[{key:"discountTribes",label:"Discount Tribe IDs (comma-separated)",type:"string",defaultValue:"100,200",placeholder:"e.g. 100,200",phase:"compile"},{key:"discountRate",label:"Discounted price percentage (1\u201399)",type:"number",defaultValue:80,phase:"compile"}],codeSnippet:e=>{let t=String((null==e?void 0:e.discountTribes)??"100,200").split(",").map(e=>e.trim()).filter(Boolean),i=Number((null==e?void 0:e.discountRate)??80);return`
    // [V2] Tribe Discount
    {
        let discount_tribes: vector<u32> = vector[${t.join(", ")}];
        let char_tribe_d = character.tribe();
        let mut d = 0u64;
        while (d < discount_tribes.length()) {
            if (char_tribe_d == discount_tribes[d]) {
                total_price = total_price * ${i} / 100;
            };
            d = d + 1;
        };
    };`}},{id:"V3",category:"pricing",selectionMode:"checkbox",label:"Free for Tribe",description:"Members of specified tribes get items for free.",defaultEnabled:!1,configFields:[{key:"freeTribes",label:"Free Tribe IDs (comma-separated)",type:"string",defaultValue:"100",placeholder:"e.g. 100",phase:"compile"}],codeSnippet:e=>{let t=String((null==e?void 0:e.freeTribes)??"100").split(",").map(e=>e.trim()).filter(Boolean);return`
    // [V3] Free for Tribe
    {
        let free_tribes: vector<u32> = vector[${t.join(", ")}];
        let char_tribe_f = character.tribe();
        let mut f = 0u64;
        while (f < free_tribes.length()) {
            if (char_tribe_f == free_tribes[f]) {
                total_price = 0;
            };
            f = f + 1;
        };
    };`}},{id:"V4",category:"pricing",selectionMode:"checkbox",label:"Bulk Discount",description:"Discount applied when buying above a quantity threshold.",defaultEnabled:!1,configFields:[{key:"bulkThreshold",label:"Minimum quantity for discount",type:"number",defaultValue:10,phase:"compile"},{key:"bulkRate",label:"Discounted price percentage (1\u201399)",type:"number",defaultValue:90,phase:"compile"}],codeSnippet:e=>{let t=Number((null==e?void 0:e.bulkThreshold)??10),i=Number((null==e?void 0:e.bulkRate)??90);return`
    // [V4] Bulk Discount
    if (quantity >= ${t}) {
        total_price = total_price * ${i} / 100;
    };`}},{id:"R1",category:"revenue",selectionMode:"checkbox",label:"Owner Collect",description:"Transfer payment directly to the SSU owner.",defaultEnabled:!0,configFields:[{key:"ownerAddress",label:"Owner address",type:"string",defaultValue:"",placeholder:"Leave blank to use deployer wallet",phase:"post-deploy"}],codeSnippet:()=>""},{id:"S1",category:"stock",selectionMode:"radio",radioGroup:"stock_mode",label:"Single Item Type",description:"Vending machine sells one item type at a single price.",defaultEnabled:!0,codeSnippet:()=>""},{id:"S2",category:"stock",selectionMode:"radio",radioGroup:"stock_mode",label:"Multi-Item Catalog",description:"Vending machine sells multiple item types with independent pricing.",defaultEnabled:!1,codeSnippet:()=>""},{id:"I0",category:"item",selectionMode:"radio",radioGroup:"item_mode",label:"Any Item",description:"No item type restrictions.",defaultEnabled:!0,codeSnippet:()=>""},{id:"I1",category:"item",selectionMode:"radio",radioGroup:"item_mode",label:"Item Whitelist",description:"Only allow specific item types to be stored.",defaultEnabled:!1,configFields:[{key:"allowedItems",label:"Allowed Item Type IDs (comma-separated)",type:"string",defaultValue:"1001,1002,1003",placeholder:"e.g. 1001,1002",phase:"compile"}],codeSnippet:e=>{let t=String((null==e?void 0:e.allowedItems)??"1001,1002,1003").split(",").map(e=>e.trim()).filter(Boolean);return`
    // [I1] Item Whitelist
    {
        let allowed_items: vector<u64> = vector[${t.join(", ")}];
        let mut item_allowed = false;
        let mut k = 0u64;
        while (k < allowed_items.length()) {
            if (item_type_id == allowed_items[k]) { item_allowed = true; };
            k = k + 1;
        };
        assert!(item_allowed, EItemTypeNotAllowed);
    };`}},{id:"I2",category:"item",selectionMode:"checkbox",label:"Deposit Only",description:"Only deposits are allowed \u2014 withdrawals are blocked.",defaultEnabled:!1,codeSnippet:()=>""},{id:"W1",category:"swap",selectionMode:"radio",radioGroup:"swap_mode",label:"Fixed Ratio Swap",description:"Exchange items at a fixed ratio (e.g. 3 ore \u2192 1 metal).",defaultEnabled:!0,configFields:[{key:"inputTypeId",label:"Input Item Type ID",type:"number",defaultValue:1001,phase:"post-deploy"},{key:"outputTypeId",label:"Output Item Type ID",type:"number",defaultValue:2001,phase:"post-deploy"},{key:"ratioNum",label:"Output ratio numerator",type:"number",defaultValue:1,phase:"post-deploy"},{key:"ratioDen",label:"Output ratio denominator",type:"number",defaultValue:3,phase:"post-deploy"}],codeSnippet:()=>""},{id:"W2",category:"swap",selectionMode:"radio",radioGroup:"swap_mode",label:"Multi-Pair Swap",description:"Support multiple swap pairs with independent ratios.",defaultEnabled:!1,codeSnippet:()=>""},{id:"D1",category:"airdrop",selectionMode:"checkbox",label:"Fixed Airdrop",description:"Each claimant receives a fixed quantity of one item type.",defaultEnabled:!0,configFields:[{key:"itemTypeId",label:"Airdrop Item Type ID",type:"number",defaultValue:1001,phase:"post-deploy"},{key:"quantity",label:"Quantity per claim",type:"number",defaultValue:1,phase:"post-deploy"}],codeSnippet:()=>""},{id:"D2",category:"airdrop",selectionMode:"radio",radioGroup:"claim_mode",label:"Claim Once",description:"Each character can claim the airdrop only once.",defaultEnabled:!0,codeSnippet:()=>""},{id:"D3",category:"airdrop",selectionMode:"radio",radioGroup:"claim_mode",label:"Unlimited Claims",description:"Characters can claim the airdrop multiple times.",defaultEnabled:!1,codeSnippet:()=>""}];function N(e){let t=new Set({vending_machine:["V1","V2","V3","V4","R1","S1","S2","A0","A1"],item_swap:["W1","W2","A0","A1"],gated_locker:["A1","A2","I0","I1","I2"],airdrop_hub:["D1","D2","D3","A0","A1"],open_storage:[]}[e]??[]);return P.filter(e=>t.has(e.id))}let M="smart_storage_unit_extension";function V(e,t){return t===M?e:e.replaceAll(M,t)}function K(e,t){let i=P.filter(i=>i.category===e&&t.enabledChips.includes(i.id));return 0===i.length?"":i.map(e=>e.codeSnippet(t.chipConfigs[e.id])).join("\n")}function D(e,t){return t.enabledChips.includes(e)}let j={open_storage:()=>({filename:"sources/open_storage.move",content:`/// Open Storage \u{2014} generated by EasyAssemblies.
///
/// Unrestricted shared warehouse. Anyone can deposit to and withdraw from the
/// open inventory via this extension's witness type.
module smart_storage_unit_extension::open_storage;

use smart_storage_unit_extension::config::{Self, XAuth};
use world::{character::Character, inventory::Item, storage_unit::StorageUnit};

/// Deposit an item into the SSU's open inventory.
/// The caller obtains \`item\` from a preceding \`withdraw_by_owner\` in the PTB.
public fun open_deposit(
    storage_unit: &mut StorageUnit,
    character: &Character,
    item: Item,
    ctx: &mut TxContext,
) {
    storage_unit.deposit_to_open_inventory<XAuth>(character, item, config::x_auth(), ctx);
}

/// Withdraw an item from the SSU's open inventory.
/// The caller should \`deposit_by_owner\` the returned Item in the same PTB.
public fun open_withdraw(
    storage_unit: &mut StorageUnit,
    character: &Character,
    type_id: u64,
    quantity: u32,
    ctx: &mut TxContext,
): Item {
    storage_unit.withdraw_from_open_inventory<XAuth>(character, config::x_auth(), type_id, quantity, ctx)
}
`}),gated_locker:e=>{let t,i,o;return{filename:"sources/locker.move",content:(t=K("access",e),i=K("item",e),o=D("I2",e)?`
    // [I2] Deposit Only \u{2014} withdrawals are blocked
    abort EWithdrawNotAllowed`:"",`/// Gated Locker \u{2014} generated by EasyAssemblies.
///
/// A shared warehouse with access restrictions. Players deposit to / withdraw
/// from the open inventory, gated by tribe and item-type checks.
/// Chips: [${e.enabledChips.join(", ")}]
#[allow(unused_use, unused_variable)]
module smart_storage_unit_extension::locker;

use smart_storage_unit_extension::config::{Self, XAuth, ExtensionConfig};
use world::{access::OwnerCap, character::Character, storage_unit::StorageUnit};

// === Errors ===
#[error(code = 0)]
const ENotAllowedTribe: vector<u8> = b"Character tribe not allowed";
#[error(code = 1)]
const EBlockedTribe: vector<u8> = b"Character tribe is blocked";
#[error(code = 2)]
const EItemTypeNotAllowed: vector<u8> = b"Item type not allowed";
#[error(code = 3)]
const EWithdrawNotAllowed: vector<u8> = b"Withdrawals are not allowed";

/// Deposit items from the caller's owned inventory into the shared open inventory.
public fun guarded_deposit<T: key>(
    extension_config: &ExtensionConfig,
    storage_unit: &mut StorageUnit,
    character: &Character,
    owner_cap: &OwnerCap<T>,
    item_type_id: u64,
    quantity: u32,
    ctx: &mut TxContext,
) {
    // \u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550} Access chips \u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}${t||`
    // (open access)`}

    // \u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550} Item chips \u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}${i||`
    // (any item)`}

    let item = storage_unit.withdraw_by_owner<T>(character, owner_cap, item_type_id, quantity, ctx);
    storage_unit.deposit_to_open_inventory<XAuth>(character, item, config::x_auth(), ctx);
}

/// Withdraw items from the shared open inventory into the caller's owned inventory.
public fun guarded_withdraw(
    extension_config: &ExtensionConfig,
    storage_unit: &mut StorageUnit,
    character: &Character,
    item_type_id: u64,
    quantity: u32,
    ctx: &mut TxContext,
) {${o}

    // \u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550} Access chips \u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}${t||`
    // (open access)`}

    // \u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550} Item chips \u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}${i||`
    // (any item)`}

    let item = storage_unit.withdraw_from_open_inventory<XAuth>(character, config::x_auth(), item_type_id, quantity, ctx);
    storage_unit.deposit_to_owned<XAuth>(character, item, config::x_auth(), ctx);
}
`)}},vending_machine:e=>{let t,i,o,r,n,a,s,u,l,c,d;return{filename:"sources/vending.move",content:(r=D("V1",e),n=D("S2",e),a=K("access",e),s=K("pricing",e),u=r?`
use sui::coin::{Self, Coin};
use sui::sui::SUI;`:"",t=r?n?`
public struct VendingConfig has drop, store {
    owner_address: address,
}
public struct VendingConfigKey has copy, drop, store {}

public struct ItemPriceEntry has drop, store {
    price_per_unit: u64,
}
public struct ItemPriceKey has copy, drop, store { type_id: u64 }
`:`
public struct VendingConfig has drop, store {
    price_per_unit: u64,
    owner_address: address,
}
public struct VendingConfigKey has copy, drop, store {}
`:"",i=r?n?`
    // \u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550} Pricing (multi-item) \u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}
    assert!(extension_config.has_rule<VendingConfigKey>(VendingConfigKey {}), ENoPriceConfig);
    let vending_cfg = extension_config.borrow_rule<VendingConfigKey, VendingConfig>(VendingConfigKey {});
    assert!(extension_config.has_rule<ItemPriceKey>(ItemPriceKey { type_id: item_type_id }), ENoPriceConfig);
    let item_price = extension_config.borrow_rule<ItemPriceKey, ItemPriceEntry>(ItemPriceKey { type_id: item_type_id });
    let mut total_price = item_price.price_per_unit * (quantity as u64);`:`
    // \u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550} Pricing \u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}
    assert!(extension_config.has_rule<VendingConfigKey>(VendingConfigKey {}), ENoPriceConfig);
    let vending_cfg = extension_config.borrow_rule<VendingConfigKey, VendingConfig>(VendingConfigKey {});
    let mut total_price = vending_cfg.price_per_unit * (quantity as u64);`:`
    // (no pricing \u{2014} free dispenser)`,o=r?`
    // \u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550} Revenue \u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}
    if (total_price > 0) {
        assert!(coin::value(&payment) >= total_price, EInsufficientPayment);
        let paid = coin::value(&payment);
        if (paid > total_price) {
            let change = payment.split(paid - total_price, ctx);
            transfer::public_transfer(change, ctx.sender());
        };
        transfer::public_transfer(payment, vending_cfg.owner_address);
    } else {
        transfer::public_transfer(payment, ctx.sender());
    };`:"",l=r?`
    mut payment: Coin<SUI>,`:"",c=[],r&&!n&&c.push(`
public fun set_vending_config(
    extension_config: &mut ExtensionConfig,
    admin_cap: &AdminCap,
    price_per_unit: u64,
    owner_address: address,
) {
    extension_config.set_rule<VendingConfigKey, VendingConfig>(
        admin_cap,
        VendingConfigKey {},
        VendingConfig { price_per_unit, owner_address },
    );
}`),r&&n&&c.push(`
public fun set_vending_config(
    extension_config: &mut ExtensionConfig,
    admin_cap: &AdminCap,
    owner_address: address,
) {
    extension_config.set_rule<VendingConfigKey, VendingConfig>(
        admin_cap,
        VendingConfigKey {},
        VendingConfig { owner_address },
    );
}

public fun set_item_price(
    extension_config: &mut ExtensionConfig,
    admin_cap: &AdminCap,
    type_id: u64,
    price_per_unit: u64,
) {
    extension_config.set_rule<ItemPriceKey, ItemPriceEntry>(
        admin_cap,
        ItemPriceKey { type_id },
        ItemPriceEntry { price_per_unit },
    );
}`),d=s?`
    // \u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550} Price modifiers \u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}${s}`:"",`/// Vending Machine \u{2014} generated by EasyAssemblies.
///
/// Players pay SUI to purchase items from the SSU's main inventory.
/// Chips: [${e.enabledChips.join(", ")}]
#[allow(unused_use, unused_variable, unused_mut_parameter)]
module smart_storage_unit_extension::vending;

use smart_storage_unit_extension::config::{Self, AdminCap, XAuth, ExtensionConfig};${u}
use world::{character::Character, storage_unit::StorageUnit};

// === Errors ===
#[error(code = 0)]
const ENotAllowedTribe: vector<u8> = b"Character tribe not allowed";
#[error(code = 1)]
const ENoPriceConfig: vector<u8> = b"Missing price configuration";
#[error(code = 2)]
const EInsufficientPayment: vector<u8> = b"Insufficient payment amount";
${t}
public fun buy_item(
    extension_config: &ExtensionConfig,
    storage_unit: &mut StorageUnit,
    character: &Character,${l}
    item_type_id: u64,
    quantity: u32,
    ctx: &mut TxContext,
) {
    // \u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550} Access chips \u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}${a||`
    // (open access)`}
${i}${d}
${o}
    // \u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550} Item Delivery \u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}
    let item = storage_unit.withdraw_item<XAuth>(character, config::x_auth(), item_type_id, quantity, ctx);
    storage_unit.deposit_to_owned<XAuth>(character, item, config::x_auth(), ctx);
}

// === Admin Functions ===
${c.join("\n")}
`)}},item_swap:e=>{let t,i,o,r,n;return{filename:"sources/swap.move",content:(t=D("W2",e),i=K("access",e),o=t?`
public struct SwapPair has drop, store {
    output_type_id: u64,
    ratio_num: u64,
    ratio_den: u64,
}
public struct SwapPairKey has copy, drop, store { input_type_id: u64 }
`:`
public struct SwapRule has drop, store {
    input_type_id: u64,
    output_type_id: u64,
    ratio_num: u64,
    ratio_den: u64,
}
public struct SwapRuleKey has copy, drop, store {}
`,r=t?`
    // \u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550} Swap (multi-pair) \u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}
    assert!(extension_config.has_rule<SwapPairKey>(SwapPairKey { input_type_id }), ENoSwapRule);
    let swap_pair = extension_config.borrow_rule<SwapPairKey, SwapPair>(SwapPairKey { input_type_id });
    let output_quantity = (input_quantity as u64) * swap_pair.ratio_num / swap_pair.ratio_den;
    assert!(output_quantity > 0, EZeroOutput);
    let output_type_id = swap_pair.output_type_id;`:`
    // \u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550} Swap (fixed ratio) \u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}
    assert!(extension_config.has_rule<SwapRuleKey>(SwapRuleKey {}), ENoSwapRule);
    let swap_rule = extension_config.borrow_rule<SwapRuleKey, SwapRule>(SwapRuleKey {});
    assert!(input_type_id == swap_rule.input_type_id, EWrongInputType);
    let output_quantity = (input_quantity as u64) * swap_rule.ratio_num / swap_rule.ratio_den;
    assert!(output_quantity > 0, EZeroOutput);
    let output_type_id = swap_rule.output_type_id;`,n=t?`
public fun set_swap_pair(
    extension_config: &mut ExtensionConfig,
    admin_cap: &AdminCap,
    input_type_id: u64,
    output_type_id: u64,
    ratio_num: u64,
    ratio_den: u64,
) {
    extension_config.set_rule<SwapPairKey, SwapPair>(
        admin_cap,
        SwapPairKey { input_type_id },
        SwapPair { output_type_id, ratio_num, ratio_den },
    );
}`:`
public fun set_swap_rule(
    extension_config: &mut ExtensionConfig,
    admin_cap: &AdminCap,
    input_type_id: u64,
    output_type_id: u64,
    ratio_num: u64,
    ratio_den: u64,
) {
    extension_config.set_rule<SwapRuleKey, SwapRule>(
        admin_cap,
        SwapRuleKey {},
        SwapRule { input_type_id, output_type_id, ratio_num, ratio_den },
    );
}`,`/// Item Swap \u{2014} generated by EasyAssemblies.
///
/// Players submit items of one type and receive items of another type
/// based on a configured swap ratio.
/// Chips: [${e.enabledChips.join(", ")}]
#[allow(unused_use, unused_variable)]
module smart_storage_unit_extension::swap;

use smart_storage_unit_extension::config::{Self, AdminCap, XAuth, ExtensionConfig};
use world::{access::OwnerCap, character::Character, storage_unit::StorageUnit};

// === Errors ===
#[error(code = 0)]
const ENotAllowedTribe: vector<u8> = b"Character tribe not allowed";
#[error(code = 1)]
const ENoSwapRule: vector<u8> = b"Missing swap rule configuration";
#[error(code = 2)]
const EWrongInputType: vector<u8> = b"Input item type does not match swap rule";
#[error(code = 3)]
const EZeroOutput: vector<u8> = b"Swap output quantity is zero";
${o}
public fun swap_items<T: key>(
    extension_config: &ExtensionConfig,
    storage_unit: &mut StorageUnit,
    character: &Character,
    owner_cap: &OwnerCap<T>,
    input_type_id: u64,
    input_quantity: u32,
    ctx: &mut TxContext,
) {
    // \u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550} Access chips \u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}${i||`
    // (open access)`}
${r}

    // \u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550} Execute swap \u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}
    let input_item = storage_unit.withdraw_by_owner<T>(character, owner_cap, input_type_id, input_quantity, ctx);
    storage_unit.deposit_item<XAuth>(character, input_item, config::x_auth(), ctx);
    let output_item = storage_unit.withdraw_item<XAuth>(character, config::x_auth(), output_type_id, (output_quantity as u32), ctx);
    storage_unit.deposit_to_owned<XAuth>(character, output_item, config::x_auth(), ctx);
}

// === Admin Functions ===
${n}
`)}},airdrop_hub:e=>{let t,i,o,r,n;return{filename:"sources/airdrop.move",content:(t=D("D2",e),i=K("access",e),o=t?`
public struct ClaimKey has copy, drop, store { character_id: ID }
`:"",r=t?`
    // [D2] Claim Once \u{2014} check if already claimed
    let char_id = object::id(character);
    assert!(!config::has_rule<ClaimKey>(extension_config, ClaimKey { character_id: char_id }), EAlreadyClaimed);`:"",n=t?`
    // [D2] Mark as claimed
    config::set_flag(extension_config, ClaimKey { character_id: char_id });`:"",`/// Airdrop Hub \u{2014} generated by EasyAssemblies.
///
/// SSU owner stocks items; players claim a fixed quantity per visit.
/// Chips: [${e.enabledChips.join(", ")}]
#[allow(unused_use, unused_variable)]
module smart_storage_unit_extension::airdrop;

use smart_storage_unit_extension::config::{Self, AdminCap, XAuth, ExtensionConfig};
use world::{character::Character, storage_unit::StorageUnit};

// === Errors ===
#[error(code = 0)]
const ENotAllowedTribe: vector<u8> = b"Character tribe not allowed";
#[error(code = 1)]
const ENoAirdropConfig: vector<u8> = b"Missing airdrop configuration";
#[error(code = 2)]
const EAlreadyClaimed: vector<u8> = b"Airdrop already claimed by this character";

public struct AirdropConfig has drop, store {
    item_type_id: u64,
    quantity: u32,
}
public struct AirdropConfigKey has copy, drop, store {}
${o}
public fun claim_airdrop(
    extension_config: ${t?"&mut ExtensionConfig":"&ExtensionConfig"},
    storage_unit: &mut StorageUnit,
    character: &Character,
    ctx: &mut TxContext,
) {
    // \u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550} Access chips \u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}${i||`
    // (open access)`}
${r}
    // \u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550} Airdrop \u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}
    assert!(extension_config.has_rule<AirdropConfigKey>(AirdropConfigKey {}), ENoAirdropConfig);
    let airdrop_cfg = extension_config.borrow_rule<AirdropConfigKey, AirdropConfig>(AirdropConfigKey {});
    let airdrop_type_id = airdrop_cfg.item_type_id;
    let airdrop_quantity = airdrop_cfg.quantity;

    let item = storage_unit.withdraw_item<XAuth>(character, config::x_auth(), airdrop_type_id, airdrop_quantity, ctx);
    storage_unit.deposit_to_owned<XAuth>(character, item, config::x_auth(), ctx);
${n}
}

// === Admin Functions ===
public fun set_airdrop_config(
    extension_config: &mut ExtensionConfig,
    admin_cap: &AdminCap,
    item_type_id: u64,
    quantity: u32,
) {
    extension_config.set_rule<AirdropConfigKey, AirdropConfig>(
        admin_cap,
        AirdropConfigKey {},
        AirdropConfig { item_type_id, quantity },
    );
}
`)}}};function $(e){let t=e.moduleName||M,i=(0,j[e.templateTag])(e.selection);return{"Move.toml":`[package]
name = "${t}"
edition = "2024"

[dependencies]
world = { git = "https://github.com/evefrontier/world-contracts.git", subdir = "contracts/world", rev = "v0.0.21" }

[environments]
testnet = "4c78adac"
testnet_internal = "4c78adac"
testnet_utopia = "4c78adac"
testnet_stillness = "4c78adac"
`,"sources/config.move":V(`/// Shared configuration for SSU extensions \u{2014} generated by EasyAssemblies.
module smart_storage_unit_extension::config;

use sui::dynamic_field as df;

public struct ExtensionConfig has key {
    id: UID,
}

public struct AdminCap has key, store {
    id: UID,
}

public struct XAuth has drop {}

fun init(ctx: &mut TxContext) {
    let admin_cap = AdminCap { id: object::new(ctx) };
    transfer::transfer(admin_cap, ctx.sender());

    let config = ExtensionConfig { id: object::new(ctx) };
    transfer::share_object(config);
}

public fun has_rule<K: copy + drop + store>(config: &ExtensionConfig, key: K): bool {
    df::exists_(&config.id, key)
}

public fun borrow_rule<K: copy + drop + store, V: store>(config: &ExtensionConfig, key: K): &V {
    df::borrow(&config.id, key)
}

public fun set_rule<K: copy + drop + store, V: store + drop>(
    config: &mut ExtensionConfig,
    _: &AdminCap,
    key: K,
    value: V,
) {
    if (df::exists_(&config.id, copy key)) {
        let _old: V = df::remove(&mut config.id, copy key);
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

/// Package-visible flag writer \u{2014} used by airdrop claim-once tracking.
public(package) fun set_flag<K: copy + drop + store>(config: &mut ExtensionConfig, key: K) {
    if (!df::exists_(&config.id, copy key)) {
        df::add(&mut config.id, key, true);
    };
}

public(package) fun x_auth(): XAuth {
    XAuth {}
}
`,t),[i.filename]:V(i.content,t)}}let W=[{id:"simple_vending",label:"Simple Vending",description:"Single item, fixed price, anyone can buy.",chips:["V1","R1","S1","A0"]},{id:"multi_item_shop",label:"Multi-Item Shop",description:"Multiple item types, each with an independent price.",chips:["V1","R1","S2","A0"]},{id:"tribal_shop",label:"Tribal Shop",description:"Only specific tribes can purchase, with a tribe discount.",chips:["V1","V2","R1","S2","A1"],chipConfigs:{V2:{discountTribes:"100,200",discountRate:80},A1:{allowedTribes:"100,200,300"}}},{id:"bulk_wholesale",label:"Bulk Wholesale",description:"Multi-item catalog with bulk purchase discounts.",chips:["V1","V4","R1","S2","A0"],chipConfigs:{V4:{bulkThreshold:10,bulkRate:90}}}],B=[{id:"simple_swap",label:"Simple Swap",description:"Single swap pair at a fixed ratio.",chips:["W1","A0"]},{id:"multi_swap_station",label:"Multi-Swap Station",description:"Multiple swap pairs with independent ratios.",chips:["W2","A0"]},{id:"tribal_refinery",label:"Tribal Refinery",description:"Only specific tribes can swap items.",chips:["W1","A1"],chipConfigs:{A1:{allowedTribes:"100,200"}}}],R=[{id:"guild_vault",label:"Guild Vault",description:"Shared warehouse for tribe members only.",chips:["A1","I0"],chipConfigs:{A1:{allowedTribes:"100,200"}}},{id:"collection_box",label:"Collection Box",description:"Accept specific items only \u2014 no withdrawals (donation box).",chips:["A1","I1","I2"],chipConfigs:{A1:{allowedTribes:"100,200"},I1:{allowedItems:"1001,1002,1003"}}},{id:"embargo_locker",label:"Embargo Locker",description:"Open to all except blacklisted tribes.",chips:["A2","I0"],chipConfigs:{A2:{blockedTribes:"500,600"}}}],O=[{id:"one_time_airdrop",label:"One-Time Airdrop",description:"Each character can claim once \u2014 open to everyone.",chips:["D1","D2","A0"]},{id:"tribal_airdrop",label:"Tribal Airdrop",description:"Only specific tribes can claim, once per character.",chips:["D1","D2","A1"],chipConfigs:{A1:{allowedTribes:"100,200"}}},{id:"unlimited_supply",label:"Unlimited Supply",description:"No claim limit \u2014 suitable for renewable resources.",chips:["D1","D3","A0"]}];function q(){let e=R["0"];return{enabledChips:[...e.chips],chipConfigs:e.chipConfigs?structuredClone(e.chipConfigs):{}}}let U={id:"ssu_gated_locker",label:"Gated Locker",assemblyType:"storage_unit",description:"Shared warehouse with tribe and item-type access restrictions.",detail:"Deploy a gated storage locker. Only characters meeting tribe or item-type conditions can deposit or withdraw. Ideal for guild vaults, collection boxes, or embargo lockers.",chipConfig:{chips:N("gated_locker"),presets:R,categories:[{key:"access",label:"Access Control",icon:"\u{1F510}"},{key:"item",label:"Item Restrictions",icon:"\u{1F4E6}"}],defaultModuleName:"smart_storage_unit_extension"},files:e=>{let{moduleName:t,selection:i}=function(e){if(!e)return{moduleName:"smart_storage_unit_extension",selection:q()};let t="string"==typeof e.moduleName&&e.moduleName?e.moduleName:"smart_storage_unit_extension";return{moduleName:t,selection:{enabledChips:Array.isArray(e.enabledChips)?e.enabledChips:q().enabledChips,chipConfigs:e.chipConfigs&&"object"==typeof e.chipConfigs?e.chipConfigs:{}}}}(e);return $({templateTag:"gated_locker",moduleName:t,selection:i})}};function G(){let e=W["0"];return{enabledChips:[...e.chips],chipConfigs:e.chipConfigs?structuredClone(e.chipConfigs):{}}}let X={id:"ssu_vending_machine",label:"Vending Machine",assemblyType:"storage_unit",description:"Pay SUI to purchase items \u2014 classic coin-operated dispenser.",detail:"Deploy a vending machine. The SSU owner stocks items and sets prices; players pay SUI to receive items. Supports single or multi-item catalogs, tribe discounts, and bulk pricing.",chipConfig:{chips:N("vending_machine"),presets:W,categories:[{key:"pricing",label:"Pricing",icon:"\u{1F4B0}"},{key:"revenue",label:"Revenue",icon:"\u{1F48E}"},{key:"stock",label:"Stock Mode",icon:"\u{1F4CB}"},{key:"access",label:"Access Control",icon:"\u{1F510}"}],defaultModuleName:"smart_storage_unit_extension"},files:e=>{let{moduleName:t,selection:i}=function(e){if(!e)return{moduleName:"smart_storage_unit_extension",selection:G()};let t="string"==typeof e.moduleName&&e.moduleName?e.moduleName:"smart_storage_unit_extension";return{moduleName:t,selection:{enabledChips:Array.isArray(e.enabledChips)?e.enabledChips:G().enabledChips,chipConfigs:e.chipConfigs&&"object"==typeof e.chipConfigs?e.chipConfigs:{}}}}(e);return $({templateTag:"vending_machine",moduleName:t,selection:i})}};function z(){let e=B["0"];return{enabledChips:[...e.chips],chipConfigs:e.chipConfigs?structuredClone(e.chipConfigs):{}}}let H={id:"ssu_item_swap",label:"Item Swap",assemblyType:"storage_unit",description:"Trade items at a fixed ratio \u2014 resource refinery, recycling, upgrades.",detail:"Deploy an item swap station. Players submit items of one type and receive items of another type at a configured ratio. Supports single-pair or multi-pair swap rules.",chipConfig:{chips:N("item_swap"),presets:B,categories:[{key:"swap",label:"Swap Rules",icon:"\u{1F504}"},{key:"access",label:"Access Control",icon:"\u{1F510}"}],defaultModuleName:"smart_storage_unit_extension"},files:e=>{let{moduleName:t,selection:i}=function(e){if(!e)return{moduleName:"smart_storage_unit_extension",selection:z()};let t="string"==typeof e.moduleName&&e.moduleName?e.moduleName:"smart_storage_unit_extension";return{moduleName:t,selection:{enabledChips:Array.isArray(e.enabledChips)?e.enabledChips:z().enabledChips,chipConfigs:e.chipConfigs&&"object"==typeof e.chipConfigs?e.chipConfigs:{}}}}(e);return $({templateTag:"item_swap",moduleName:t,selection:i})}};function Q(){let e=O["0"];return{enabledChips:[...e.chips],chipConfigs:e.chipConfigs?structuredClone(e.chipConfigs):{}}}let L={id:"ssu_airdrop_hub",label:"Airdrop Hub",assemblyType:"storage_unit",description:"Claim airdrops \u2014 starter packs, event rewards, resource distribution.",detail:"Deploy an airdrop distribution center. The SSU owner stocks items and players claim a fixed quantity. Supports one-time claims, unlimited supply, and tribe restrictions.",chipConfig:{chips:N("airdrop_hub"),presets:O,categories:[{key:"airdrop",label:"Airdrop Config",icon:"\u{1F381}"},{key:"access",label:"Access Control",icon:"\u{1F510}"}],defaultModuleName:"smart_storage_unit_extension"},files:e=>{let{moduleName:t,selection:i}=function(e){if(!e)return{moduleName:"smart_storage_unit_extension",selection:Q()};let t="string"==typeof e.moduleName&&e.moduleName?e.moduleName:"smart_storage_unit_extension";return{moduleName:t,selection:{enabledChips:Array.isArray(e.enabledChips)?e.enabledChips:Q().enabledChips,chipConfigs:e.chipConfigs&&"object"==typeof e.chipConfigs?e.chipConfigs:{}}}}(e);return $({templateTag:"airdrop_hub",moduleName:t,selection:i})}},Z=[h,y,w,x,k],J=[X,H,U,L,{id:"ssu_open_storage",label:"Open Storage",assemblyType:"storage_unit",description:"Unrestricted shared warehouse \u2014 anyone can deposit and withdraw.",detail:"Deploy the simplest SSU extension. Items flow freely through the open inventory with no access restrictions. Useful as a placeholder, community warehouse, or testing scaffold.",configFields:[{key:"moduleName",label:"Package Name",type:"string",defaultValue:"smart_storage_unit_extension",placeholder:"my_storage_extension",validate:e=>/^[a-z_][a-z0-9_]*$/.test(String(e))?null:"Only lowercase letters, digits, and underscores",phase:"compile"}],files:e=>$({templateTag:"open_storage",moduleName:"string"==typeof(null==e?void 0:e.moduleName)&&e.moduleName?e.moduleName:"smart_storage_unit_extension",selection:{enabledChips:[],chipConfigs:{}}})}],Y=[{id:"turret_targeting",label:"Turret \u2014 Targeting Extension",assemblyType:"turret",description:"Customize turret targeting priorities with pluggable chips.",detail:"Deploy a turret extension that replaces the default targeting logic. Choose from 15 chips (exclude + weight) to compose your ideal targeting strategy, or pick a preset and tweak from there.",chipConfig:{chips:T,presets:I,categories:[{key:"exclude",label:"Exclude Chips",icon:"\u{1F6E1}"},{key:"weight",label:"Weight Chips",icon:"\u26A1"}],defaultModuleName:"smart_turret_extension"},files:e=>{var t,i,o;let r,n,a,s,{moduleName:u,selection:l}=function(e){if(!e)return{moduleName:"smart_turret_extension",selection:F()};let t="string"==typeof e.moduleName&&e.moduleName?e.moduleName:"smart_turret_extension";return{moduleName:t,selection:{enabledChips:Array.isArray(e.enabledChips)?e.enabledChips:F().enabledChips,chipConfigs:e.chipConfigs&&"object"==typeof e.chipConfigs?e.chipConfigs:{}}}}(e);return{"Move.toml":(r=(t={moduleName:u,selection:l}).moduleName||E,`[package]
name = "${r}"
edition = "2024"

[dependencies]
world = { git = "https://github.com/evefrontier/world-contracts.git", subdir = "contracts/world", rev = "v0.0.21" }

[environments]
testnet = "4c78adac"
testnet_internal = "4c78adac"
testnet_utopia = "4c78adac"
testnet_stillness = "4c78adac"
`),"sources/turret.move":(n=A("exclude",i=t.selection),a=A("weight",i),s=i.enabledChips.some(e=>S.includes(e))?`
// BehaviourChangeReason discriminants (via BCS tag byte)
const ENTERED: u8 = 1;
const STARTED_ATTACK: u8 = 2;
const STOPPED_ATTACK: u8 = 3;

fun behaviour_to_u8(reason: turret::BehaviourChangeReason): u8 {
    let bytes = bcs::to_bytes(&reason);
    bytes[0]
}
`:"",o=`/// Turret Targeting Extension \u{2014} generated by EasyAssemblies.
///
/// Chips: [${i.enabledChips.join(", ")}]
module smart_turret_extension::turret;

use sui::bcs;
use world::{
    character::{Self, Character},
    turret::{Self, Turret, OnlineReceipt},
};

#[error(code = 0)]
const EInvalidReceipt: vector<u8> = b"OnlineReceipt does not match turret";
${s}
public struct TurretAuth has drop {}

public fun get_target_priority_list(
    turret: &Turret,
    owner_character: &Character,
    target_candidate_list: vector<u8>,
    receipt: OnlineReceipt,
): vector<u8> {
    assert!(receipt.turret_id() == object::id(turret), EInvalidReceipt);

    let candidates = turret::unpack_candidate_list(target_candidate_list);
    let owner_character_id = character::key(owner_character).item_id() as u32;
    let owner_tribe = character::tribe(owner_character);

    let mut return_list = vector::empty<turret::ReturnTargetPriorityList>();

    let mut i = 0u64;
    let len = candidates.length();
    while (i < len) {
        let candidate = &candidates[i];
        let mut weight = turret::priority_weight(candidate);
        let mut excluded = false;

        // \u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550} Exclude chips \u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}${n||`
        // (none selected)`}

        if (!excluded) {
            // \u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550} Weight chips \u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}\u{2550}${a||`
            // (none selected)`}

            return_list.push_back(
                turret::new_return_target_priority_list(turret::item_id(candidate), weight),
            );
        };

        i = i + 1;
    };

    turret::destroy_online_receipt(receipt, TurretAuth {});
    bcs::to_bytes(&return_list)
}
`,r===E?o:o.replaceAll(E,r))}}}],ee=[...Z,...J,...Y,{id:"test_hello_world",label:"[Test] Hello World",assemblyType:"gate",description:"Simple Hello World \u2014 no dependencies, for pipeline testing only",detail:"Mint a HelloWorldObject. Used to verify the compile + deploy pipeline works.",files:()=>({"Move.toml":`[package]
name = "hello_world"
version = "0.0.1"
edition = "2024.beta"

[dependencies]

[addresses]
hello_world = "0x0"
`,"sources/hello_world.move":`module hello_world::hello_world;

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
`})}];function et(e){return ee.find(t=>t.id===e)}}}]);