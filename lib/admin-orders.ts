import { API_BASE_URL, getAccessToken } from "@/lib/auth";
import { parseJsonResponse } from "@/lib/api-response";

export type AdminOrderStatus =
  | "PENDING"
  | "PAID"
  | "PROCESSING"
  | "SHIPPING"
  | "COMPLETED"
  | "CANCELLED"
  | string;

export type AdminPaymentMethod = "COD" | "VNPAY" | "MOMO" | string;

export type AdminOrderItemResponse = {
  id?: number;
  productId?: number;
  productName?: string;
  product_name?: string;
  productSku?: string;
  sku?: string;
  thumbnail?: string;
  productThumbnail?: string;
  mainThumbnail?: string;
  variantId?: number | null;
  colorName?: string | null;
  storageName?: string | null;
  quantity?: number;
  unitPrice?: number;
  price?: number;
  lineTotal?: number;
  totalPrice?: number;
};

export type AdminOrderResponse = {
  id: number;
  userId?: number;
  orderCode?: string;
  code?: string;
  status: AdminOrderStatus;
  paymentMethod?: AdminPaymentMethod;
  paymentStatus?: string;
  deliveryStatus?: string;
  totalAmount?: number;
  subtotalAmount?: number;
  discountAmount?: number;
  couponCode?: string | null;
  recipientName?: string;
  phone?: string;
  email?: string;
  shippingAddress?: string;
  shippingMethodCode?: string;
  shippingFee?: number;
  estimatedDeliveryMinDate?: string | null;
  estimatedDeliveryMaxDate?: string | null;
  note?: string | null;
  items?: AdminOrderItemResponse[];
  createdAt?: string;
  updatedAt?: string;
};

type ApiEnvelope<T> =
  | T
  | {
      data?: T | { content?: T };
      result?: T | { content?: T };
      content?: T;
      message?: string;
      error?: string;
    };

function buildAdminHeaders(): HeadersInit {
  const token = getAccessToken();

  if (!token) {
    throw new Error("Bạn cần đăng nhập bằng tài khoản Admin để thực hiện thao tác này.");
  }

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...buildAdminHeaders(),
      ...(init.headers ?? {}),
    },
    credentials: "include",
  });

  const contentType = response.headers.get("content-type") ?? "";
  const payload: unknown = contentType.includes("application/json")
    ? await parseJsonResponse<unknown>(response)
    : await response.text().catch(() => "");

  if (!response.ok) {
    const errorPayload =
      typeof payload === "object" && payload !== null
        ? (payload as { message?: string; error?: string })
        : null;
    const message =
      typeof payload === "string"
        ? payload
        : errorPayload?.message ??
          errorPayload?.error ??
          "Không thể xử lý yêu cầu quản lý đơn hàng.";
    throw new Error(message);
  }

  return payload as T;
}

function unwrapArray<T>(payload: ApiEnvelope<T[]>): T[] {
  if (Array.isArray(payload)) return payload;

  const value = payload as {
    data?: T[] | { content?: T[] };
    result?: T[] | { content?: T[] };
    content?: T[];
  };

  if (Array.isArray(value.content)) return value.content;
  if (Array.isArray(value.data)) return value.data;
  if (value.data && "content" in value.data && Array.isArray(value.data.content)) return value.data.content;
  if (Array.isArray(value.result)) return value.result;
  if (value.result && "content" in value.result && Array.isArray(value.result.content)) return value.result.content;

  return [];
}

function unwrapObject<T>(payload: ApiEnvelope<T>): T {
  const value = payload as {
    data?: T;
    result?: T;
  };

  return value.data ?? value.result ?? (payload as T);
}

export async function getAdminOrders(status?: string): Promise<AdminOrderResponse[]> {
  const params = new URLSearchParams();

  if (status && status !== "ALL") {
    params.set("status", status);
  }

  const query = params.toString();
  const payload = await requestJson<ApiEnvelope<AdminOrderResponse[]>>(
    `/api/admin/orders${query ? `?${query}` : ""}`,
    { method: "GET" }
  );

  return unwrapArray(payload);
}

export async function getAdminOrderById(id: number): Promise<AdminOrderResponse> {
  const payload = await requestJson<ApiEnvelope<AdminOrderResponse>>(`/api/admin/orders/${id}`, {
    method: "GET",
  });

  return unwrapObject(payload);
}

export async function updateAdminOrderStatus(
  id: number,
  status: AdminOrderStatus
): Promise<AdminOrderResponse> {
  const payload = await requestJson<ApiEnvelope<AdminOrderResponse>>(`/api/admin/orders/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });

  return unwrapObject(payload);
}
