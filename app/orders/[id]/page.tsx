"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Header from "@/components/Header";
import OrderProgress from "@/components/OrderProgress";
import { useWebSocket } from "@/hooks/useWebSocket";
import { getAccessToken } from "@/lib/auth";
import {
    canCustomerCancelOrder,
    getOrderStatusBadgeClass,
    getOrderStatusLabel,
    PAYMENT_METHOD_LABELS,
} from "@/lib/order-status";
import { getOrderById, cancelOrder, OrderResponse, formatVnd } from "@/lib/shop";
import Link from "next/link";

function formatDateTime(value?: string | null) {
    if (!value) return "Chưa cập nhật";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit"
    }).format(date);
}

export default function OrderDetailPage() {
    const params = useParams();
    const orderId = Number(params?.id);

    const [order, setOrder] = useState<OrderResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [isCancelling, setIsCancelling] = useState(false);
    const [accessToken, setAccessToken] = useState("");
    const [notificationUserId, setNotificationUserId] = useState("");

    const fetchOrder = useCallback(async (showLoading = true) => {
        if (!orderId || Number.isNaN(orderId)) {
            setError("Mã đơn hàng không hợp lệ.");
            setIsLoading(false);
            return;
        }

        if (showLoading) setIsLoading(true);
        try {
            const data = await getOrderById(orderId);
            setOrder(data);
            if (data.userId) setNotificationUserId(String(data.userId));
            setError("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Không thể tải chi tiết đơn hàng.");
        } finally {
            if (showLoading) setIsLoading(false);
        }
    }, [orderId]);

    useEffect(() => {
        void Promise.resolve().then(() => {
            setAccessToken(getAccessToken() ?? "");
            return fetchOrder();
        });
    }, [fetchOrder]);

    const notificationHandlers = useMemo(
        () => ({
            onNotification: (notification: { type: string; referenceId?: string | null }) => {
                if (
                    notification.type === "ORDER_STATUS_UPDATED" &&
                    notification.referenceId === String(orderId)
                ) {
                    void fetchOrder(false);
                }
            },
        }),
        [fetchOrder, orderId],
    );

    useWebSocket(accessToken, notificationUserId, notificationHandlers);

    const handleCancelOrder = async () => {
        if (!window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này không?")) return;

        setIsCancelling(true);
        try {
            const updatedOrder = await cancelOrder(orderId);
            setOrder(updatedOrder);
            alert("Hủy đơn hàng thành công.");
        } catch (err) {
            alert(err instanceof Error ? err.message : "Không thể hủy đơn hàng.");
        } finally {
            setIsCancelling(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#F4F6F8]">
                <Header />
                <div className="flex justify-center p-20 text-gray-500 font-medium">Đang tải chi tiết đơn hàng...</div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-screen bg-[#F4F6F8]">
                <Header />
                <div className="mx-auto max-w-4xl p-10 text-center">
                    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 font-semibold">{error || "Đơn hàng không tồn tại."}</div>
                    <Link href="/orders" className="text-[#EE4D2D] hover:underline font-bold">Quay lại danh sách đơn hàng</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F4F6F8] pb-20">
            <Header />

            <main className="mx-auto mt-6 max-w-5xl px-4 sm:px-6 lg:px-8">

                {/* Breadcrumb & Tiêu đề */}
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                        <Link href="/" className="hover:text-[#EE4D2D]">Trang chủ</Link>
                        <span>{'>'}</span>
                        <Link href="/orders" className="hover:text-[#EE4D2D]">Đơn mua</Link>
                        <span>{'>'}</span>
                        <span className="text-gray-800">Chi tiết đơn hàng</span>
                    </div>
                    <div className="text-right">
                        <span className="text-sm text-gray-500">MÃ ĐƠN HÀNG: </span>
                        <span className="font-bold text-gray-900">{order.orderCode}</span>
                    </div>
                </div>

                {/* Khối Trạng thái & Timeline */}
                <div className="mb-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Trạng thái hiện tại</p>
                            <span className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getOrderStatusBadgeClass(order.status)}`}>
                                {getOrderStatusLabel(order.status)}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500">
                            Cập nhật lần cuối: {formatDateTime(order.updatedAt ?? order.createdAt)}
                        </p>
                    </div>
                    <OrderProgress status={order.status} paymentMethod={order.paymentMethod} />
                </div>

                {/* Cột thông tin: Địa chỉ & Vận chuyển */}
                <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* Box Địa chỉ */}
                    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                        <h3 className="mb-4 text-sm font-bold uppercase text-gray-800 border-b border-gray-100 pb-3">Địa Chỉ Nhận Hàng</h3>
                        <div className="space-y-2 text-sm text-gray-700">
                            <p className="font-bold text-gray-900">{order.recipientName}</p>
                            <p>{order.phone}</p>
                            <p className="leading-relaxed text-gray-600">{order.shippingAddress}</p>
                            {order.note && <p className="text-amber-600 italic">Ghi chú: {order.note}</p>}
                        </div>
                    </div>

                    {/* Box Vận chuyển */}
                    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                        <h3 className="mb-4 text-sm font-bold uppercase text-gray-800 border-b border-gray-100 pb-3">Thông Tin Vận Chuyển</h3>
                        <div className="space-y-3 text-sm text-gray-700">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Đơn vị vận chuyển:</span>
                                <span className="font-semibold">{order.shippingMethodCode || "SOPE Express"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Mã vận đơn:</span>
                                <span className="font-bold text-blue-600">{order.trackingNumber || "Đang cập nhật"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Dự kiến giao hàng:</span>
                                <span className="font-semibold text-green-600">
                                    {formatDeliveryRange(order.estimatedDeliveryMinDate, order.estimatedDeliveryMaxDate)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Danh sách sản phẩm */}
                <div className="mb-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                    <h3 className="mb-4 text-sm font-bold uppercase text-gray-800">Sản phẩm đã đặt</h3>
                    <div className="divide-y divide-gray-100 border-t border-gray-100">
                        {order.items.map((item, idx) => (
                            <div key={idx} className="flex flex-col sm:flex-row justify-between py-4 gap-4">
                                <div className="flex gap-4 items-center">
                                    <div className="w-16 h-16 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-xs text-gray-400 shrink-0">
                                        IMG
                                    </div>
                                    <div>
                                        <Link href={`/products/${item.productId}`} className="text-sm font-bold text-gray-800 hover:text-[#EE4D2D] line-clamp-2">
                                            {item.productName}
                                        </Link>
                                        <p className="text-xs text-gray-500 mt-1">Số lượng: x{item.quantity}</p>
                                    </div>
                                </div>
                                <div className="text-right shrink-0 flex flex-col justify-center">
                                    <span className="text-sm font-bold text-gray-900">{formatVnd(item.lineTotal)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tổng kết tiền bạc & Hành động */}
                <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div className="w-full md:w-auto">
                        {/* Backend chỉ cho khách hủy khi đơn vẫn đang chờ duyệt. */}
                        {canCustomerCancelOrder(order.status) && (
                            <button
                                onClick={handleCancelOrder}
                                disabled={isCancelling}
                                className="px-6 py-2.5 bg-white border border-red-500 text-red-500 hover:bg-red-50 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                            >
                                {isCancelling ? "ĐANG HỦY..." : "HỦY ĐƠN HÀNG"}
                            </button>
                        )}
                    </div>

                    <div className="w-full md:w-80 space-y-3 text-sm text-gray-600">
                        <div className="flex justify-between">
                            <span>Tổng tiền hàng:</span>
                            <span>{formatVnd(order.subtotalAmount)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Phí vận chuyển:</span>
                            <span>{formatVnd(order.shippingFee)}</span>
                        </div>
                        {order.discountAmount > 0 && (
                            <div className="flex justify-between text-green-600">
                                <span>Giảm giá (Voucher):</span>
                                <span>- {formatVnd(order.discountAmount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                            <span className="font-bold text-gray-800">Thành tiền:</span>
                            <span className="text-2xl font-extrabold text-[#EE4D2D]">{formatVnd(order.totalAmount)}</span>
                        </div>
                        <div className="text-right text-xs text-gray-400 mt-1">
                            Thanh toán qua:{" "}
                            <span className="font-semibold">
                                {PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}
                            </span>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
}

function formatDeliveryRange(minDate?: string | null, maxDate?: string | null) {
    if (!minDate && !maxDate) return "Đang cập nhật";
    if (!minDate) return formatDateTime(maxDate);
    if (!maxDate || minDate === maxDate) return formatDateTime(minDate);
    return `${formatDateTime(minDate)} - ${formatDateTime(maxDate)}`;
}
