/** Units still available to allocate to new orders (never negative). */
export function availableStock(quantity: number, sold: number): number {
  return Math.max(0, quantity - sold);
}

/** Mirrors persisted `isSoldOut` when adjusting seller `quantity`. */
export function computeIsSoldOut(quantity: number, sold: number): boolean {
  if (quantity <= 0) return true;
  return sold >= quantity;
}
