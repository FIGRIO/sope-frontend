"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import { getOrderById, cancelOrder, OrderResponse, formatVnd } from "@/lib/shop";
import Link from "next/link";

// Helper chuyển đổi trạng thái sang Tiếng Việt
const statusLabels: Record<string, string> = {
    PENDING: "Chờ xác nhận",
    PAID: "Đã thanh toán",
    SHIPPING: "Đang giao hàng",
    COMPLETED: "Hoàn tất",
    CANCELLED: "Đã hủy",
};

// Cấu trúc các bước trong Timeline
const timelineSteps = ["PENDING", "PAID", "SHIPPING", "COMPLETED"];

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
    const router = useRouter();
    const orderId = Number(params?.id);

    const [order, setOrder] = useState<OrderResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [isCancelling, setIsCancelling] = useState(false);

    const fetchOrder = useCallback(async () => {
        if (!orderId || Number.isNaN(orderId)) {
            setError("Mã đơn hàng không hợp lệ.");
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const data = await getOrderById(orderId);
            setOrder(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Không thể tải chi tiết đơn hàng.");
        } finally {
            setIsLoading(false);
        }
    }, [orderId]);

    useEffect(() => {
        void fetchOrder();
    }, [fetchOrder]);

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

    // Xác định vị trí hiện tại của Timeline
    const currentStepIndex = timelineSteps.indexOf(order.status);
    const isCancelled = order.status === "CANCELLED";

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
                    {isCancelled ? (
                        <div className="flex items-center justify-center gap-3 py-6 text-red-600">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            <h2 className="text-2xl font-bold uppercase tracking-wide">Đơn hàng đã hủy</h2>
                        </div>
                    ) : (
                        <div className="py-6">
                            <div className="flex items-center justify-between relative">
                                {/* Thanh chạy nền */}
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 rounded-full z-0"></div>
                                {/* Thanh chạy progress */}
                                <div
                                    className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-green-500 rounded-full z-0 transition-all duration-500"
                                    style={{ width: `${currentStepIndex >= 0 ? (currentStepIndex / (timelineSteps.length - 1)) * 100 : 0}%` }}
                                ></div>

                                {timelineSteps.map((step, index) => {
                                    const isActive = currentStepIndex >= index;
                                    return (
                                        <div key={step} className="relative z-10 flex flex-col items-center bg-white px-2">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 font-bold text-xs ${isActive ? 'bg-green-500 border-green-500 text-white shadow-md' : 'bg-white border-gray-300 text-gray-300'}`}>
                                                {isActive ? "✓" : index + 1}
                                            </div>
                                            <span className={`mt-2 text-xs font-semibold uppercase tracking-wider ${isActive ? 'text-green-600' : 'text-gray-400'}`}>
                                                {statusLabels[step]}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
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
                                <span className="font-semibold text-green-600">{formatDateTime(order.estimatedDeliveryDate)}</span>
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
                        {/* Chỉ hiện nút Hủy nếu đơn hàng mới được tạo (PENDING hoặc PAID) */}
                        {(order.status === "PENDING" || order.status === "PAID") && (
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
                            Thanh toán qua: <span className="uppercase font-semibold">{order.paymentMethod}</span>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
}