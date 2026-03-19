export type WorldPackageReference = {
  publishedAt: string;
  originalId: string;
};

export const WORLD_PACKAGE_REFERENCES_BY_NETWORK: Partial<
  Record<'devnet' | 'testnet' | 'mainnet', WorldPackageReference>
> = {
  // Synced from world-contracts/contracts/world/Published.toml.
  testnet: {
    publishedAt:
      '0x33226d2eedda428eb7e1a56faf525bd5300f9394a5d61ffbbbcb3993d45a7145',
    originalId:
      '0x920e577e1bf078bad19385aaa82e7332ef92b4973dcf8534797b129f9814d631',
  },
};
