type ImageInput = {
  altText: string | null;
};

type ProductInput = {
  name: string;
  team?: { name: string } | null;
};

export function productImageAlt(image: ImageInput, product: ProductInput): string {
  if (image.altText) return image.altText;
  if (product.team) return `${product.name} ${product.team.name}`;
  return product.name;
}

export function leagueLogoAlt(leagueName: string): string {
  return `Camisetas de ${leagueName}`;
}
