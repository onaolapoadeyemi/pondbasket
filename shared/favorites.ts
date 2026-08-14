export function canSaveFavorite(
  productId: number,
  activeProductIds: readonly number[],
  demoProductIds: readonly number[]
) {
  return (
    activeProductIds.includes(productId) || demoProductIds.includes(productId)
  );
}

export function favoriteToggleOutcome(existingFavoriteId?: number) {
  return existingFavoriteId
    ? { saved: false as const, removeId: existingFavoriteId }
    : { saved: true as const };
}
