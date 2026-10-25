export function cartUnitCount(items: readonly { quantity: number }[]): number {
  return items.reduce((sum, item) => {
    const quantity = item.quantity;
    return sum + (Number.isFinite(quantity) && quantity > 0 ? quantity : 0);
  }, 0);
}

export function cartUnitLabel(count: number): string {
  return `${count} ${count === 1 ? "artículo" : "artículos"}`;
}
