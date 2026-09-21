export type AdminDeliveryMode = "INMEDIATA" | "BAJO_PEDIDO" | "NO_DISPONIBLE";
export type AdminOrderFilterMode = "INMEDIATA" | "BAJO_PEDIDO" | "TODOS";
export type AdminStockStatus = "DISPONIBLE" | "STOCK_BAJO" | "AGOTADO" | "BAJO_PEDIDO";

export type AdminPageState = "loading" | "empty" | "error" | "not-found" | "success";

export type AdminNavItem = {
  href: string;
  label: string;
  exact?: boolean;
};

export type AdminBreadcrumbItem = {
  label: string;
  href?: string;
};

export type DashboardSummary = {
  ordersLast30Days: number;
  paidRevenueLast30Days: number;
  activeProducts: number;
  pendingPayments: number;
  lowStockCount: number;
  outOfStockCount: number;
  alerts: Array<{
    variantId: string;
    productName: string;
    productSlug: string;
    sizeName: string;
    versionName: string;
    sku: string;
    stock: number;
    lowStockAt: number | null;
    status: AdminStockStatus;
  }>;
};
