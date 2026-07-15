import { API_BASE_URL, getAccessToken } from "./auth";

export const CART_UPDATED_EVENT = "sope:cart-updated";

export type CartItem = {
  id: number;
  productId: number;
  name: string;
  imgUrl?: string | null;
  price?: number | null;
  quantity: number;
  lineTotal?: number | null;
  variantId?: number | null;
  colorName?: string | null;
  storageName?: string | null;
  availableQuantity?: number | null;
  inStock?: boolean | null;
};

export type CartResponse = {
  id?: number;
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
};

export type CouponPreviewResponse = {
  couponCode: string;
  subtotalAmount: number;
  discountAmount: number;
  totalBeforeShipping: number;
  items: Array<{
    productId: number;
    productName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    discountAmount: number;
  }>;
};

export type PaymentMethod = "COD" | "VNPAY" | "MOMO";
export type PaymentProvider = "VNPAY" | "MOMO";

export type OrderResponse = {
  id: number;
  orderCode: string;
  status: string;
  paymentMethod: PaymentMethod;
  subtotalAmount: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  recipientName: string;
  phone: string;
  shippingAddress: string;
  note?: string | null;
  shippingMethodCode?: string | null;
  estimatedDeliveryDate?: string | null;
  trackingNumber?: string | null;
  items: Array<{
    productId: number;
    productName: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }>;
  createdAt?: string | null;
};

export type PaymentResponse = {
  id: number;
  orderId: string;
  amount: number;
  provider: PaymentProvider;
  status: string;
  transactionId?: string | null;
  orderInfo?: string | null;
  paymentUrl?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export function formatVnd(value?: number | null) {
  if (value == null) return "Giá liên hệ";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
}

export function notifyCartUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CART_UPDATED_EVENT));
  }
}

export async function getCart() {
  return requestJson<CartResponse>("/api/cart");
}

export async function addToCart(productId: number, quantity = 1, variantId?: number) {
  const cart = await requestJson<CartResponse>("/api/cart/items", {
    method: "POST",
    body: JSON.stringify({ productId, quantity, variantId }),
  });
  notifyCartUpdated();
  return cart;
}

export async function updateCartItem(itemId: number, quantity: number) {
  const cart = await requestJson<CartResponse>(`/api/cart/items/${itemId}`, {
    method: "PUT",
    body: JSON.stringify({ quantity }),
  });
  notifyCartUpdated();
  return cart;
}

export async function removeCartItem(itemId: number) {
  const cart = await requestJson<CartResponse>(`/api/cart/items/${itemId}`, {
    method: "DELETE",
  });
  notifyCartUpdated();
  return cart;
}

export async function applyCouponPreview(couponCode: string) {
  return requestJson<CouponPreviewResponse>("/api/coupons/apply-preview", {
    method: "POST",
    body: JSON.stringify({ couponCode }),
  });
}

export async function createOrder(payload: {
  recipientName: string;
  phone: string;
  shippingAddress: string;
  province?: string;
  shippingMethodCode?: string;
  couponCode?: string;
  note?: string;
  paymentMethod: PaymentMethod;
}) {
  const order = await requestJson<OrderResponse>("/api/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  notifyCartUpdated();
  return order;
}

export async function getMyOrders() {
  return requestJson<OrderResponse[]>("/api/orders");
}

export async function getOrderById(id: number) {
  return requestJson<OrderResponse>(`/api/orders/${id}`);
}

export async function cancelOrder(id: number) {
  return requestJson<OrderResponse>(`/api/orders/${id}/cancel`, {
    method: "PUT",
  });
}

export async function createPayment(payload: {
  orderId: string;
  amount: number;
  provider: PaymentProvider;
  orderInfo: string;
}) {
  return requestJson<PaymentResponse>("/api/payment/create", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function simulateBankTransfer(paymentId: number) {
  return requestJson<PaymentResponse>(`/api/payment/${paymentId}/simulate-bank-transfer`, {
    method: "POST",
  });
}

async function requestJson<T>(path: string, init: RequestInit = {}) {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Bạn cần đăng nhập để thực hiện thao tác này.");
  }

  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.json() as Promise<T>;
}

async function readErrorMessage(response: Response) {
  const fallback = `Request failed with status ${response.status}`;
  const text = await response.text();
  if (!text) return fallback;

  try {
    const payload = JSON.parse(text) as { message?: string; error?: string };
    return payload.message || payload.error || fallback;
  } catch {
    return text;
  }
}

export function calculateDeliveryDate(baseDate: Date = new Date()): string {
  const deliveryDate = new Date(baseDate);
  deliveryDate.setDate(deliveryDate.getDate() + 3);
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(deliveryDate);
}

// ==========================================
// --- BỔ SUNG CHO TASK H05 (ADMIN COUPON) ---
// ==========================================

export type CouponRequest = {
  code: string;
  description?: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  scope: "ALL_ORDER" | "SPECIFIC_PRODUCTS" | "SPECIFIC_CATEGORIES";
  applicableProductIds?: number[];
  applicableCategories?: string[];
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usageLimitPerUser?: number;
  startAt?: string;
  endAt?: string;
};

export type CouponResponse = CouponRequest & {
  id: number;
  usedCount: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export async function getAdminCoupons(active?: boolean) {
  const query = active !== undefined ? `?active=${active}` : "";
  return requestJson<CouponResponse[]>(`/api/admin/coupons${query}`);
}

export async function getAdminCouponById(id: number) {
  return requestJson<CouponResponse>(`/api/admin/coupons/${id}`);
}

export async function createAdminCoupon(data: CouponRequest) {
  return requestJson<CouponResponse>("/api/admin/coupons", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateAdminCoupon(id: number, data: CouponRequest) {
  return requestJson<CouponResponse>(`/api/admin/coupons/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function toggleAdminCouponStatus(id: number, activate: boolean) {
  return requestJson<CouponResponse>(`/api/admin/coupons/${id}/${activate ? "activate" : "deactivate"}`, {
    method: "PUT",
  });
}