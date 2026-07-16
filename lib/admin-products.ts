import { API_BASE_URL, getAccessToken } from "@/lib/auth";

export type ProductStatus = "ACTIVE" | "INACTIVE" | "OUT_OF_STOCK";

export type ProductVariantResponse = {
  id: number;
  sku?: string | null;
  colorName?: string | null;
  colorHex?: string | null;
  storageName?: string | null;
  price?: number | null;
  oldPrice?: number | null;
  imageUrl?: string | null;
  stockQuantity?: number | null;
  reservedQuantity?: number | null;
  availableQuantity?: number | null;
  active: boolean;
  inStock: boolean;
};

export type ProductResponse = {
  id: number;
  sku?: string | null;
  mainThumbnail?: string | null;
  name: string;
  category?: string | null;
  brand?: string | null;
  shortDescription?: string | null;
  description?: string | null;
  price?: number | null;
  oldPrice?: number | null;
  url?: string | null;
  imgUrl?: string | null;
  images?: string[];
  specs?: Record<string, string>;
  storageVariants?: unknown[];
  colorVariants?: unknown[];
  reviews?: unknown[];
  status?: ProductStatus | null;
  availableQuantity?: number | null;
  inStock: boolean;
  lowStock: boolean;
  variants?: ProductVariantResponse[];
};

export type PagedResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
};

export type ProductSearchParams = {
  keyword?: string;
  category?: string;
  brand?: string;
  storage?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  size?: number;
  sortBy?: "id" | "sku" | "name" | "price" | "oldPrice" | "category" | "brand" | "ratingStars";
  sortDir?: "asc" | "desc";
};

export type ProductRequestPayload = {
  sku?: string;
  product_name: string;
  category?: string;
  mainThumbnail?: string;
  brand?: string[][];
  short_description?: string;
  detailed_article?: string;
  current_price?: string;
  original_price?: string;
  url?: string;
  infographic_images?: string[];
  detailed_specs?: Record<string, string>;
  storage_variants?: unknown[];
  color_variants?: unknown[];
  customer_reviews?: unknown[];
};

export type StockUpdateResult = {
  productId: number;
  variantId?: number | null;
  name: string;
  oldStock: number;
  newStock: number;
  delta: number;
  status: string;
};

export async function getAdminProducts(
  params: ProductSearchParams = {},
): Promise<PagedResponse<ProductResponse>> {
  const query = new URLSearchParams();

  if (params.keyword?.trim()) query.set("keyword", params.keyword.trim());
  if (params.category?.trim()) query.set("category", params.category.trim());
  if (params.brand?.trim()) query.set("brand", params.brand.trim());
  if (params.storage?.trim()) query.set("storage", params.storage.trim());
  if (params.minPrice != null) query.set("minPrice", String(params.minPrice));
  if (params.maxPrice != null) query.set("maxPrice", String(params.maxPrice));

  query.set("page", String(Math.max(params.page ?? 0, 0)));
  query.set("size", String(Math.min(Math.max(params.size ?? 10, 1), 100)));
  query.set("sortBy", params.sortBy ?? "id");
  query.set("sortDir", params.sortDir ?? "desc");

  return requestJson<PagedResponse<ProductResponse>>(`/api/products?${query.toString()}`, {}, false);
}

export async function createAdminProduct(payload: ProductRequestPayload) {
  return requestJson<ProductResponse>("/api/products", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAdminProduct(id: number, payload: ProductRequestPayload) {
  return requestJson<ProductResponse>(`/api/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteAdminProduct(id: number) {
  await requestVoid(`/api/products/${id}`, {
    method: "DELETE",
  });
}

export async function updateAdminProductStatus(id: number, status: ProductStatus) {
  return requestJson<StockUpdateResult>(`/api/admin/inventory/status/${id}`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}

export async function restockAdminProduct(id: number, quantity: number) {
  return requestJson<StockUpdateResult>(`/api/admin/inventory/restock/${id}`, {
    method: "POST",
    body: JSON.stringify({ quantity }),
  });
}

export async function setAdminProductStock(id: number, quantity: number) {
  return requestJson<StockUpdateResult>(`/api/admin/inventory/set-stock/${id}`, {
    method: "PUT",
    body: JSON.stringify({ quantity }),
  });
}

function buildHeaders(init?: RequestInit) {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
  }

  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  headers.set("Authorization", `Bearer ${token}`);
  return headers;
}

async function requestJson<T>(
  path: string,
  init: RequestInit = {},
  requireAdminToken = true,
): Promise<T> {
  const headers = requireAdminToken ? buildHeaders(init) : new Headers(init.headers);

  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.json() as Promise<T>;
}

async function requestVoid(path: string, init: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: buildHeaders(init),
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
}

async function readErrorMessage(response: Response) {
  const fallback = `Yêu cầu thất bại (${response.status})`;
  const text = await response.text();
  if (!text) return fallback;

  try {
    const payload = JSON.parse(text) as {
      message?: string;
      error?: string;
      detail?: string;
    };
    return payload.message || payload.error || payload.detail || fallback;
  } catch {
    return text;
  }
}
