/** File path mapped to file content */
export type FileMap = Record<string, string>;

/** EVE Frontier Smart Assembly Template Definition */
export interface AssemblyTemplate {
  id: string;                      // Unique identifier (e.g., "gate_tribe_permit")
  label: string;                   // Display name (e.g., "Smart Gate — Tribe Permit")
  assemblyType: 'gate' | 'storage_unit' | 'turret';  // Component type
  description: string;             // Short description
  detail: string;                  // Detailed explanation
  files: () => FileMap | Promise<FileMap>; // Function generating the file map (async supported for remote fetching)
}
