/** Configuration model for the Smart Gate extension template. */

export interface GateExtensionConfig {
  /** Move package name — used in module declarations and Move.toml.
   *  Must match Move identifier rules: [a-z_][a-z0-9_]* */
  moduleName: string;

  /** Starter tribe ID that is allowed to pass through the gate. */
  tribeId: number;

  /** Jump-permit expiry duration in milliseconds. */
  expiryDurationMs: number;

  /** Item type ID required for corpse bounty gate access.
   *  Set to 0 to disable the bounty module. */
  bountyTypeId: number;

  /** Bounty jump-permit expiry duration in milliseconds. */
  bountyExpiryMs: number;
}

export const DEFAULT_GATE_CONFIG: GateExtensionConfig = {
  moduleName: 'smart_gate_extension',
  tribeId: 100,
  expiryDurationMs: 3_600_000,
  bountyTypeId: 0,
  bountyExpiryMs: 3_600_000,
};

const MODULE_NAME_PATTERN = /^[a-z_][a-z0-9_]*$/;

export function validateGateConfig(
  config: GateExtensionConfig,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.moduleName || !MODULE_NAME_PATTERN.test(config.moduleName)) {
    errors.push(
      'Module name must start with a lowercase letter or underscore and contain only lowercase letters, digits, and underscores.',
    );
  }

  if (config.moduleName.length > 64) {
    errors.push('Module name must be at most 64 characters.');
  }

  if (!Number.isInteger(config.tribeId) || config.tribeId < 0) {
    errors.push('Tribe ID must be a non-negative integer.');
  }

  if (
    !Number.isInteger(config.expiryDurationMs) ||
    config.expiryDurationMs <= 0
  ) {
    errors.push('Expiry duration must be a positive integer (milliseconds).');
  }

  if (!Number.isInteger(config.bountyTypeId) || config.bountyTypeId < 0) {
    errors.push('Bounty type ID must be a non-negative integer.');
  }

  if (
    !Number.isInteger(config.bountyExpiryMs) ||
    config.bountyExpiryMs <= 0
  ) {
    errors.push(
      'Bounty expiry duration must be a positive integer (milliseconds).',
    );
  }

  return { valid: errors.length === 0, errors };
}
