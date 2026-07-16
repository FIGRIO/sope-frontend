/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  AdminOrderResponse,
  AdminOrderStatus,
  getAdminOrderById,
  getAdminOrders,
  updateAdminOrderStatus,
} from "@/lib/admin-orders";
import { formatVnd } from "@/lib/shop";

const ORDER_STATUSES = ["ALL", "PENDING", "PAID", "PROCESSING", "SHIPPING", "COMPLETED", "CANCELLED"] as const;

const STATUS_LABEL: Record<string, string> = {
  ALL: "Tất cả",
  PENDING: "Chờ xử lý",
  PAID: "Đã thanh toán",
  PROCESSING: "Đang xử lý",
  SHIPPING: "Đang giao",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

const PAYMENT_LABEL: Record<string, string> = {
  COD: "COD",
  VNPAY: "VNPAY",
  MOMO: "MoMo",
};

const STATUS_BADGE_CLASS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700 border-amber-200",
  PAID: "bg-sky-100 text-sky-700 border-sky-200",
  PROCESSING: "bg-violet-100 text-violet-700 border-violet-200",
  SHIPPING: "bg-indigo-100 text-indigo-700 border-indigo-200",
  COMPLETED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-rose-100 text-rose-700 border-rose-200",
};

const NEXT_STATUS_MAP: Record<string, AdminOrderStatus[]> = {
  PENDING: ["PAID", "CANCELLED"],
  PAID: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPING", "CANCELLED"],
  SHIPPING: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

function getOrderCode(order: AdminOrderResponse) {
  return order.orderCode ?? order.code ?? `#${order.id}`;
}

function getStatusLabel(status?: string) {
  if (!status) return "Không rõ";
  return STATUS_LABEL[status] ?? status;
}

function getPaymentLabel(method?: string) {
  if (!method) return "Chưa rõ";
  return PAYMENT_LABEL[method] ?? method;
}

function getStatusBadgeClass(status?: string) {
  return STATUS_BADGE_CLASS[status ?? ""] ?? "bg-slate-100 text-slate-700 border-slate-200";
}

function formatMoney(value?: number) {
  return formatVnd(Number(value ?? 0));
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";

  try {
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  try {
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function getNextStatuses(order: AdminOrderResponse) {
  const currentStatus = order.status ?? "";
  const nextStatuses = NEXT_STATUS_MAP[currentStatus];

  if (!nextStatuses) {
    return ORDER_STATUSES.filter((status) => status !== "ALL" && status !== currentStatus);
  }

  return nextStatuses.filter((status) => status !== currentStatus);
}

function getItemName(item: NonNullable<AdminOrderResponse["items"]>[number]) {
  return item.productName ?? item.product_name ?? item.productSku ?? item.sku ?? "Sản phẩm";
}

function getItemImage(item: NonNullable<AdminOrderResponse["items"]>[number]) {
  return item.thumbnail ?? item.productThumbnail ?? item.mainThumbnail ?? "";
}

function getItemPrice(item: NonNullable<AdminOrderResponse["items"]>[number]) {
  return item.unitPrice ?? item.price ?? 0;
}

function getItemTotal(item: NonNullable<AdminOrderResponse["items"]>[number]) {
  return item.lineTotal ?? item.totalPrice ?? getItemPrice(item) * Number(item.quantity ?? 0);
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrderResponse[]>([]);
  const [statsOrders, setStatsOrders] = useState<AdminOrderResponse[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderResponse | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getAdminOrders(statusFilter);
      setOrders(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không thể tải danh sách đơn hàng.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const loadStatsOrders = useCallback(async () => {
    try {
      const data = await getAdminOrders("ALL");
      setStatsOrders(data);
    } catch {
      // Không chặn bảng đơn hàng nếu phần thống kê tạm thời không tải được.
      // Khi người dùng bấm Làm mới dữ liệu, hàm này sẽ được gọi lại.
    }
  }, []);

  const refreshOrdersPage = useCallback(async () => {
    await Promise.all([loadOrders(), loadStatsOrders()]);
  }, [loadOrders, loadStatsOrders]);

  useEffect(() => {
    void Promise.resolve().then(refreshOrdersPage);
  }, [refreshOrdersPage]);

  const filteredOrders = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    if (!normalizedKeyword) return orders;

    return orders.filter((order) => {
      const haystack = [
        getOrderCode(order),
        order.recipientName,
        order.phone,
        order.email,
        order.shippingAddress,
        order.paymentMethod,
        order.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedKeyword);
    });
  }, [keyword, orders]);

  const stats = useMemo(() => {
    return {
      total: statsOrders.length,
      pending: statsOrders.filter((order) => order.status === "PENDING").length,
      paid: statsOrders.filter((order) => order.status === "PAID").length,
      processing: statsOrders.filter((order) => order.status === "PROCESSING").length,
      shipping: statsOrders.filter((order) => order.status === "SHIPPING").length,
      completed: statsOrders.filter((order) => order.status === "COMPLETED").length,
      revenue: statsOrders
        .filter((order) => ["PAID", "PROCESSING", "SHIPPING", "COMPLETED"].includes(order.status))
        .reduce((sum, order) => sum + Number(order.totalAmount ?? 0), 0),
    };
  }, [statsOrders]);

  const handleOpenDetail = async (order: AdminOrderResponse) => {
    try {
      setDetailLoading(true);
      setSelectedOrder(order);
      const detail = await getAdminOrderById(order.id);
      setSelectedOrder(detail);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không thể tải chi tiết đơn hàng.";
      toast.error(message);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleUpdateStatus = async (order: AdminOrderResponse, nextStatus: AdminOrderStatus) => {
    if (!nextStatus || nextStatus === order.status) return;

    const sensitiveStatuses = ["CANCELLED", "COMPLETED"];
    if (
      sensitiveStatuses.includes(nextStatus) &&
      !window.confirm(`Xác nhận chuyển đơn ${getOrderCode(order)} sang trạng thái "${getStatusLabel(nextStatus)}"?`)
    ) {
      return;
    }

    try {
      setUpdatingOrderId(order.id);
      const updatedOrder = await updateAdminOrderStatus(order.id, nextStatus);
      const mergedOrder: AdminOrderResponse = {
        ...order,
        ...updatedOrder,
        status: updatedOrder.status ?? nextStatus,
      };

      setOrders((currentOrders) => {
        const shouldStayVisible = statusFilter === "ALL" || mergedOrder.status === statusFilter;
        if (!shouldStayVisible) {
          return currentOrders.filter((item) => item.id !== order.id);
        }

        return currentOrders.map((item) => (item.id === order.id ? { ...item, ...mergedOrder } : item));
      });

      setStatsOrders((currentOrders) => {
        const exists = currentOrders.some((item) => item.id === order.id);
        if (!exists) return [mergedOrder, ...currentOrders];

        return currentOrders.map((item) => (item.id === order.id ? { ...item, ...mergedOrder } : item));
      });

      setSelectedOrder((currentOrder) =>
        currentOrder?.id === order.id ? { ...currentOrder, ...mergedOrder } : currentOrder
      );

      await refreshOrdersPage();

      toast.success("Đã cập nhật trạng thái đơn hàng.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không thể cập nhật trạng thái đơn hàng.";
      toast.error(message);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#EE4D2D]">
              Danh mục quản trị
            </p>
            <h1 className="mt-1 text-2xl font-extrabold text-gray-900">
              Quản lý đơn hàng
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Theo dõi đơn, lọc trạng thái, xem chi tiết và cập nhật tiến trình xử lý.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void refreshOrdersPage()}
            className="w-fit rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-700 shadow-sm transition hover:border-[#EE4D2D] hover:text-[#EE4D2D]"
          >
            Làm mới dữ liệu
          </button>
        </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
        <StatCard label="Tổng đơn" value={stats.total.toString()} />
        <StatCard label="Chờ xử lý" value={stats.pending.toString()} tone="warning" />
        <StatCard label="Đã thanh toán" value={stats.paid.toString()} tone="info" />
        <StatCard label="Đang xử lý" value={stats.processing.toString()} tone="processing" />
        <StatCard label="Đang giao" value={stats.shipping.toString()} tone="info" />
        <StatCard label="Hoàn thành" value={stats.completed.toString()} tone="success" />
        <StatCard label="Doanh thu đã tính" value={formatMoney(stats.revenue)} />
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
              Tìm kiếm
            </label>
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Tìm theo mã đơn, khách hàng, số điện thoại, địa chỉ..."
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
              Trạng thái
            </label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            >
              {ORDER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {getStatusLabel(status)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-14 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="font-semibold text-slate-900">Không tải được đơn hàng</p>
            <p className="mt-1 text-sm text-slate-500">{error}</p>
            <button
              type="button"
              onClick={() => void refreshOrdersPage()}
              className="mt-4 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
            >
              Thử lại
            </button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-semibold text-slate-900">Chưa có đơn hàng phù hợp</p>
            <p className="mt-1 text-sm text-slate-500">
              Hãy đổi bộ lọc hoặc kiểm tra lại dữ liệu đơn hàng trong backend.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1180px] w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Mã đơn</th>
                  <th className="px-5 py-3 font-semibold">Khách hàng</th>
                  <th className="px-5 py-3 font-semibold">Ngày đặt</th>
                  <th className="px-5 py-3 font-semibold">Thanh toán</th>
                  <th className="px-5 py-3 font-semibold">Tổng tiền</th>
                  <th className="px-5 py-3 font-semibold">Trạng thái</th>
                  <th className="px-5 py-3 font-semibold">Cập nhật</th>
                  <th className="px-5 py-3 text-right font-semibold">Thao tác</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {filteredOrders.map((order) => {
                  const nextStatuses = getNextStatuses(order);

                  return (
                    <tr key={order.id} className="align-top transition-colors hover:bg-gray-50/70">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">{getOrderCode(order)}</p>
                        <p className="mt-1 text-xs text-slate-500">ID: {order.id}</p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-900">{order.recipientName ?? "—"}</p>
                        <p className="mt-1 text-xs text-slate-500">{order.phone ?? "—"}</p>
                      </td>

                      <td className="px-5 py-4 text-slate-600">{formatDateTime(order.createdAt)}</td>

                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-800">{getPaymentLabel(order.paymentMethod)}</p>
                        {order.paymentStatus ? (
                          <p className="mt-1 text-xs text-slate-500">{order.paymentStatus}</p>
                        ) : null}
                      </td>

                      <td className="px-5 py-4 font-semibold text-slate-900">
                        {formatMoney(order.totalAmount)}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(
                            order.status
                          )}`}
                        >
                          {getStatusLabel(order.status)}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        {nextStatuses.length > 0 ? (
                          <select
                            value={order.status}
                            disabled={updatingOrderId === order.id}
                            onChange={(event) => void handleUpdateStatus(order, event.target.value as AdminOrderStatus)}
                            className="min-w-36 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                          >
                            <option value={order.status}>{getStatusLabel(order.status)}</option>
                            {nextStatuses.map((status) => (
                              <option key={status} value={status}>
                                → {getStatusLabel(status)}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-xs text-slate-400">Đã kết thúc</span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => void handleOpenDetail(order)}
                          className="rounded-lg border border-orange-200 px-3 py-2 text-xs font-semibold text-orange-600 transition hover:bg-orange-50"
                        >
                          Xem chi tiết
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

        {selectedOrder ? (
          <OrderDetailModal
            order={selectedOrder}
            loading={detailLoading}
            updating={updatingOrderId === selectedOrder.id}
            onClose={() => setSelectedOrder(null)}
            onUpdateStatus={handleUpdateStatus}
          />
        ) : null}
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "warning" | "info" | "processing" | "success";
}) {
  const toneClass =
    tone === "warning"
      ? "bg-amber-50 text-amber-700"
      : tone === "info"
        ? "bg-indigo-50 text-indigo-700"
        : tone === "processing"
          ? "bg-violet-50 text-violet-700"
        : tone === "success"
          ? "bg-emerald-50 text-emerald-700"
          : "bg-orange-50 text-orange-700";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className={`mb-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${toneClass}`}>
        {label}
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function OrderDetailModal({
  order,
  loading,
  updating,
  onClose,
  onUpdateStatus,
}: {
  order: AdminOrderResponse;
  loading: boolean;
  updating: boolean;
  onClose: () => void;
  onUpdateStatus: (order: AdminOrderResponse, status: AdminOrderStatus) => Promise<void>;
}) {
  const nextStatuses = getNextStatuses(order);
  const items = order.items ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">Chi tiết đơn hàng</p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">{getOrderCode(order)}</h2>
            <p className="mt-1 text-sm text-slate-500">Ngày đặt: {formatDateTime(order.createdAt)}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
          >
            Đóng
          </button>
        </div>

        <div className="overflow-y-auto p-5">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-20 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-5">
                <section className="rounded-2xl border border-slate-200 p-4">
                  <h3 className="font-semibold text-slate-900">Sản phẩm trong đơn</h3>

                  {items.length === 0 ? (
                    <p className="mt-3 text-sm text-slate-500">Backend chưa trả danh sách sản phẩm cho đơn này.</p>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {items.map((item, index) => (
                        <div
                          key={`${item.id ?? item.productId ?? index}-${index}`}
                          className="flex gap-3 rounded-xl border border-slate-100 p-3"
                        >
                          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                            {getItemImage(item) ? (
                              <img
                                src={getItemImage(item)}
                                alt={getItemName(item)}
                                className="h-full w-full object-cover"
                              />
                            ) : null}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-slate-900">{getItemName(item)}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              {[item.storageName, item.colorName].filter(Boolean).join(" · ") || "Không có phân loại"}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">Số lượng: {item.quantity ?? 0}</p>
                          </div>

                          <div className="text-right">
                            <p className="text-sm font-semibold text-slate-900">{formatMoney(getItemTotal(item))}</p>
                            <p className="mt-1 text-xs text-slate-500">{formatMoney(getItemPrice(item))}/sp</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="rounded-2xl border border-slate-200 p-4">
                  <h3 className="font-semibold text-slate-900">Ghi chú</h3>
                  <p className="mt-2 text-sm text-slate-600">{order.note || "Không có ghi chú."}</p>
                </section>
              </div>

              <div className="space-y-5">
                <section className="rounded-2xl border border-slate-200 p-4">
                  <h3 className="font-semibold text-slate-900">Trạng thái</h3>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(
                        order.status
                      )}`}
                    >
                      {getStatusLabel(order.status)}
                    </span>

                    {nextStatuses.length > 0 ? (
                      <select
                        value={order.status}
                        disabled={updating}
                        onChange={(event) => void onUpdateStatus(order, event.target.value as AdminOrderStatus)}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                      >
                        <option value={order.status}>{getStatusLabel(order.status)}</option>
                        {nextStatuses.map((status) => (
                          <option key={status} value={status}>
                            → {getStatusLabel(status)}
                          </option>
                        ))}
                      </select>
                    ) : null}
                  </div>
                </section>

                <section className="rounded-2xl border border-slate-200 p-4">
                  <h3 className="font-semibold text-slate-900">Khách hàng</h3>
                  <div className="mt-3 space-y-2 text-sm">
                    <InfoRow label="Người nhận" value={order.recipientName} />
                    <InfoRow label="Số điện thoại" value={order.phone} />
                    <InfoRow label="Email" value={order.email} />
                    <InfoRow label="Địa chỉ" value={order.shippingAddress} />
                  </div>
                </section>

                <section className="rounded-2xl border border-slate-200 p-4">
                  <h3 className="font-semibold text-slate-900">Thanh toán & giao hàng</h3>
                  <div className="mt-3 space-y-2 text-sm">
                    <InfoRow label="Phương thức" value={getPaymentLabel(order.paymentMethod)} />
                    <InfoRow label="Trạng thái thanh toán" value={order.paymentStatus} />
                    <InfoRow label="Mã giao hàng" value={order.shippingMethodCode} />
                    <InfoRow label="Dự kiến từ" value={formatDate(order.estimatedDeliveryMinDate)} />
                    <InfoRow label="Dự kiến đến" value={formatDate(order.estimatedDeliveryMaxDate)} />
                  </div>
                </section>

                <section className="rounded-2xl border border-slate-200 p-4">
                  <h3 className="font-semibold text-slate-900">Tổng tiền</h3>
                  <div className="mt-3 space-y-2 text-sm">
                    <InfoRow label="Tạm tính" value={formatMoney(order.subtotalAmount)} />
                    <InfoRow label="Giảm giá" value={`- ${formatMoney(order.discountAmount)}`} />
                    <InfoRow label="Mã giảm giá" value={order.couponCode || "—"} />
                    <InfoRow label="Phí giao hàng" value={formatMoney(order.shippingFee)} />
                    <div className="border-t border-slate-100 pt-3">
                      <InfoRow strong label="Thành tiền" value={formatMoney(order.totalAmount)} />
                    </div>
                  </div>
                </section>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, strong }: { label: string; value?: string | number | null; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className={`text-right ${strong ? "font-bold text-slate-900" : "font-medium text-slate-700"}`}>
        {value || "—"}
      </span>
    </div>
  );
}
