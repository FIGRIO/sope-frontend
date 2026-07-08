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
};

export type CartResponse = {
  id?: number;
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
};

export type PaymentMethod = "COD" | "VNPAY" | "MOMO";
export type PaymentProvider = "VNPAY" | "MOMO";

export type OrderResponse = {
  id: number;
  orderCode: string;
  status: string;
  paymentMethod: PaymentMethod;
  totalAmount: number;
  recipientName: string;
  phone: string;
  shippingAddress: string;
  note?: string | null;
  items: Array<{
    productId: number;
    productName: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }>;
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
};

export function formatVnd(value?: number | null) {
  if (value == null) return "Gia lien he";
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

export async function addToCart(productId: number, quantity = 1) {
  const cart = await requestJson<CartResponse>("/api/cart/items", {
    method: "POST",
    body: JSON.stringify({ productId, quantity }),
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

export async function createOrder(payload: {
  recipientName: string;
  phone: string;
  shippingAddress: string;
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

async function requestJson<T>(path: string, init: RequestInit = {}) {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Ban can dang nhap de thuc hien thao tac nay.");
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
