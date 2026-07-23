export const ORDER_STATUS_VALUES = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPING",
  "COMPLETED",
  "CANCELLED",
] as const;

export type KnownOrderStatus = (typeof ORDER_STATUS_VALUES)[number];
export type OrderStatus = KnownOrderStatus | string;
export type OrderPaymentMethod = "COD" | "VNPAY" | "MOMO" | string;

const STATUS_LABELS: Record<KnownOrderStatus, string> = {
  PENDING: "Chờ duyệt",
  PAID: "Đã thanh toán",
  PROCESSING: "Đã duyệt · Đang xử lý",
  SHIPPING: "Đang giao",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

const STATUS_BADGE_CLASSES: Record<KnownOrderStatus, string> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  PAID: "border-sky-200 bg-sky-50 text-sky-700",
  PROCESSING: "border-violet-200 bg-violet-50 text-violet-700",
  SHIPPING: "border-indigo-200 bg-indigo-50 text-indigo-700",
  COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  CANCELLED: "border-rose-200 bg-rose-50 text-rose-700",
};

export function getOrderStatusLabel(status?: string | null) {
  if (!status) return "Không rõ";
  return STATUS_LABELS[status as KnownOrderStatus] ?? status;
}

export function getOrderStatusBadgeClass(status?: string | null) {
  if (!status) return "border-slate-200 bg-slate-50 text-slate-700";
  return (
    STATUS_BADGE_CLASSES[status as KnownOrderStatus] ??
    "border-slate-200 bg-slate-50 text-slate-700"
  );
}

export function getNextOrderStatuses(
  status: OrderStatus,
  paymentMethod?: OrderPaymentMethod,
): KnownOrderStatus[] {
  switch (status) {
    case "PENDING":
      return paymentMethod === "COD"
        ? ["PROCESSING", "CANCELLED"]
        : ["PAID", "CANCELLED"];
    case "PAID":
      return ["PROCESSING", "CANCELLED"];
    case "PROCESSING":
      return ["SHIPPING", "CANCELLED"];
    case "SHIPPING":
      return ["COMPLETED"];
    default:
      return [];
  }
}

export function getOrderProgressSteps(
  status: OrderStatus,
  paymentMethod?: OrderPaymentMethod,
): KnownOrderStatus[] {
  const needsPaidStep = paymentMethod !== "COD" || status === "PAID";
  return needsPaidStep
    ? ["PENDING", "PAID", "PROCESSING", "SHIPPING", "COMPLETED"]
    : ["PENDING", "PROCESSING", "SHIPPING", "COMPLETED"];
}

export function canCustomerCancelOrder(status: OrderStatus) {
  return status === "PENDING";
}

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  COD: "Thanh toán khi nhận hàng",
  VNPAY: "VNPAY",
  MOMO: "MoMo",
};
