"use client";

import Header from "@/components/Header";
import { getStoredAuth } from "@/lib/auth";
import { formatVnd, getMyOrders, type OrderResponse } from "@/lib/shop";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

const statusClasses: Record<string, string> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  PAID: "border-green-200 bg-green-50 text-green-700",
  SHIPPING: "border-blue-200 bg-blue-50 text-blue-700",
  COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  CANCELLED: "border-red-200 bg-red-50 text-red-700",
};

const statusLabels: Record<string, string> = {
  PENDING: "Chờ xử lý",
  PAID: "Đã thanh toán",
  SHIPPING: "Đang giao",
  COMPLETED: "Hoàn tất",
  CANCELLED: "Đã hủy",
};

const paymentLabels: Record<string, string> = {
  COD: "Thanh toán khi nhận hàng",
  VNPAY: "VNPAY",
  MOMO: "MoMo",
};

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      setOrders(await getMyOrders());
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không thể tải lịch sử mua hàng.";
      setError(message);
      if (message.toLowerCase().includes("dang nhap")) {
        router.replace("/login");
      }
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!getStoredAuth()?.accessToken) {
        router.replace("/login");
        setIsLoading(false);
        return;
      }

      void loadOrders();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadOrders, router]);

  const totalSpent = useMemo(() => {
    return orders
      .filter((order) => order.status === "PAID" || order.status === "COMPLETED")
      .reduce((sum, order) => sum + order.totalAmount, 0);
  }, [orders]);

  return (
    <div className="min-h-screen bg-[#F4F6F8]">
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Lịch sử mua hàng</h1>
            <p className="mt-1 text-sm text-gray-500">
              {orders.length > 0 ? `${orders.length} đơn hàng đã được lưu trên hệ thống` : "Các đơn hàng của bạn sẽ hiển thị tại đây"}
            </p>
          </div>
          <div className="rounded-lg border border-gray-100 bg-white px-5 py-3 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Đã thanh toán</p>
            <p className="mt-1 text-xl font-extrabold text-[#EE4D2D]">{formatVnd(totalSpent)}</p>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="rounded-xl border border-gray-100 bg-white p-10 text-center text-sm font-semibold text-gray-500 shadow-sm">
            Đang tải lịch sử mua hàng...
          </div>
        ) : orders.length === 0 ? (
          <section className="rounded-xl border border-gray-100 bg-white p-10 text-center shadow-sm">
            <h2 className="text-lg font-bold text-gray-900">Bạn chưa có đơn hàng nào</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              Khi bạn đặt hàng thành công, thông tin đơn hàng và sản phẩm đã mua sẽ được lưu tại đây.
            </p>
            <Link
              href="/products"
              className="mt-6 inline-flex rounded-lg bg-[#EE4D2D] px-6 py-3 text-sm font-bold text-white transition hover:bg-orange-600"
            >
              Mua sắm ngay
            </Link>
          </section>
        ) : (
          <div className="space-y-5">
            {orders.map((order) => (
              <article key={order.id} className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-extrabold text-gray-900">{order.orderCode}</h2>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-bold ${
                          statusClasses[order.status] ?? "border-gray-200 bg-gray-50 text-gray-600"
                        }`}
                      >
                        {statusLabels[order.status] ?? order.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-medium text-gray-500">
                      {formatOrderDate(order.createdAt)} - {paymentLabels[order.paymentMethod] ?? order.paymentMethod}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Tổng thanh toán</p>
                    <p className="text-xl font-extrabold text-[#EE4D2D]">{formatVnd(order.totalAmount)}</p>
                  </div>
                </div>

                <div className="divide-y divide-gray-100">
                  {order.items.map((item) => (
                    <div key={`${order.id}-${item.productId}`} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <Link href={`/products/${item.productId}`} className="line-clamp-2 text-sm font-bold text-gray-800 hover:text-[#EE4D2D]">
                          {item.productName}
                        </Link>
                        <p className="mt-1 text-xs font-medium text-gray-500">
                          {formatVnd(item.unitPrice)} x {item.quantity}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-extrabold text-gray-900">{formatVnd(item.lineTotal)}</p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-100 bg-gray-50 px-5 py-4 text-sm text-gray-600">
                  <p className="font-semibold text-gray-800">Người nhận: {order.recipientName}</p>
                  <p className="mt-1">
                    {order.phone} - {order.shippingAddress}
                  </p>
                  {order.note && <p className="mt-1">Ghi chú: {order.note}</p>}
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function formatOrderDate(value?: string | null) {
  if (!value) return "Chưa có ngày tạo";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa có ngày tạo";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
