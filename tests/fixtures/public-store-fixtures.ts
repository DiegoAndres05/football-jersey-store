export const publicStoreFixtures = {
  inStock: { variantId: "v-stock", stock: 3, allowsBackorder: false, baseUnitPriceCop: 180000 },
  backorder: { variantId: "v-order", stock: 0, allowsBackorder: true, baseUnitPriceCop: 210000 },
  soldOut: { variantId: "v-sold", stock: 0, allowsBackorder: false, baseUnitPriceCop: 150000 },
  customized: { variantId: "v-custom", stock: 2, allowsBackorder: false, baseUnitPriceCop: 195000, personalizationSurchargeCop: 25000 },
  missingImage: { image: null, fallback: "Imagen no disponible" },
  coupon: { code: "FLASH10", discount: 10000 },
} as const;
