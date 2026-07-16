import { API_BASE_URL, getAccessToken } from "@/lib/auth";
import type { ProductStatus, StockUpdateResult } from "@/lib/admin-products";

export type InventoryOverview = {
  totalProducts: number;
  activeProducts: number;
  inStockProducts: number;
  outOfStockProducts: number;
  lowStockProducts: number;
  inactiveProducts: number;
};

export type BulkRestockItem = {
  productId: number;
  variantId?: number;
  quantity: number;
};

export async function getInventoryOverview() {
  return requestJson<InventoryOverview>("/api/admin/inventory/overview");
}

export async function restockProduct(productId: number, quantity: number) {
  return requestJson<StockUpdateResult>(`/api/admin/inventory/restock/${productId}`, {
    method: "POST",
    body: JSON.stringify({ quantity }),
  });
}

export async function restockVariant(variantId: number, quantity: number) {
  return requestJson<StockUpdateResult>(`/api/admin/inventory/restock/variant/${variantId}`, {
    method: "POST",
    body: JSON.stringify({ quantity }),
  });
}

export async function bulkRestock(items: BulkRestockItem[]) {
  return requestJson<StockUpdateResult[]>("/api/admin/inventory/bulk-restock", {
    method: "POST",
    body: JSON.stringify(items),
  });
}

export async function setProductStock(productId: number, quantity: number) {
  return requestJson<StockUpdateResult>(`/api/admin/inventory/set-stock/${productId}`, {
    method: "PUT",
    body: JSON.stringify({ quantity }),
  });
}

export async function updateProductStatus(productId: number, status: ProductStatus) {
  return requestJson<StockUpdateResult>(`/api/admin/inventory/status/${productId}`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}

export async function updateMinStockLevel(productId: number, minStockLevel: number) {
  return requestJson<StockUpdateResult>(`/api/admin/inventory/min-stock/${productId}`, {
    method: "PUT",
    body: JSON.stringify({ minStockLevel }),
  });
}

async function requestJson<T>(path: string, init: RequestInit = {}) {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
  }

  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  headers.set("Authorization", `Bearer ${token}`);
  if (init.body) headers.set("Content-Type", "application/json");

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    const fallback = `Yêu cầu thất bại (${response.status})`;
    const text = await response.text();
    if (!text) throw new Error(fallback);
    try {
      const payload = JSON.parse(text) as { message?: string; error?: string; detail?: string };
      throw new Error(payload.message || payload.error || payload.detail || fallback);
    } catch (error) {
      if (error instanceof SyntaxError) throw new Error(text);
      throw error;
    }
  }

  return response.json() as Promise<T>;
}
