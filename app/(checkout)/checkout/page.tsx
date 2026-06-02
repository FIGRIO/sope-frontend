"use client";

import React, { useState } from "react";
import CartHeader from "@/components/CartHeader";

export default function CheckoutPage() {
    // Quản lý trạng thái các lựa chọn của người dùng
    const [deliveryMethod, setDeliveryMethod] = useState("home"); // 'home' | 'store'
    const [paymentMethod, setPaymentMethod] = useState("cod"); // 'cod' | 'vnpay' | 'momo'

    // Dữ liệu mock (giả lập) dựa trên bản thiết kế
    const orderItems = [
        {
            id: 1,
            name: "iPhone 15 Pro Max 256GB - Chính hãng VN/A",
            qty: 1,
            price: 29990000,
        },
        {
            id: 2,
            name: "Tai nghe AirPods Pro 2 (Bản USB-C)",
            qty: 1,
            price: 5890000,
        },
    ];

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(price);
    };

    return (
        <div className="min-h-screen bg-[#F4F6F8] pb-20">
            {/* Kéo CartHeader dùng chung vào, đổi title và bước 2 */}
            <CartHeader title="Thanh toán đơn hàng" currentStep={2} />

            <main className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-6 lg:flex-row">

                    {/* ==========================================
              CỘT TRÁI: FORM ĐIỀN THÔNG TIN (lg:w-2/3)
              ========================================== */}
                    <div className="flex-1 space-y-6">

                        {/* --- 1. Thông tin người nhận --- */}
                        <section className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
                            <h2 className="mb-5 text-base font-bold text-gray-800">1. Thông tin người nhận</h2>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <input
                                    type="text"
                                    placeholder="Họ và tên"
                                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#EE4D2D] focus:ring-1 focus:ring-[#EE4D2D] placeholder:text-gray-400"
                                />
                                <input
                                    type="text"
                                    placeholder="Số điện thoại"
                                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#EE4D2D] focus:ring-1 focus:ring-[#EE4D2D] placeholder:text-gray-400"
                                />
                            </div>
                        </section>

                        {/* --- 2. Hình thức nhận hàng --- */}
                        <section className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
                            <h2 className="mb-5 text-base font-bold text-gray-800">2. Hình thức nhận hàng</h2>

                            {/* Tab chọn hình thức */}
                            <div className="mb-6 flex gap-4">
                                <label
                                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-3 transition-colors ${deliveryMethod === "home" ? "border-[#EE4D2D] bg-orange-50/30" : "border-gray-200 hover:bg-gray-50"
                                        }`}
                                    onClick={() => setDeliveryMethod("home")}
                                >
                                    <div className={`flex h-4 w-4 items-center justify-center rounded-full border border-gray-300 ${deliveryMethod === "home" ? "border-[#EE4D2D]" : ""}`}>
                                        {deliveryMethod === "home" && <div className="h-2 w-2 rounded-full bg-[#EE4D2D]"></div>}
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">Giao hàng tận nơi</span>
                                </label>

                                <label
                                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-3 transition-colors ${deliveryMethod === "store" ? "border-[#EE4D2D] bg-orange-50/30" : "border-gray-200 hover:bg-gray-50"
                                        }`}
                                    onClick={() => setDeliveryMethod("store")}
                                >
                                    <div className={`flex h-4 w-4 items-center justify-center rounded-full border border-gray-300 ${deliveryMethod === "store" ? "border-[#EE4D2D]" : ""}`}>
                                        {deliveryMethod === "store" && <div className="h-2 w-2 rounded-full bg-[#EE4D2D]"></div>}
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">Nhận tại cửa hàng</span>
                                </label>
                            </div>

                            {/* Form địa chỉ (Chỉ hiện khi chọn giao tận nơi) */}
                            {deliveryMethod === "home" && (
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <select className="w-full cursor-pointer rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-[#EE4D2D] focus:ring-1 focus:ring-[#EE4D2D] appearance-none bg-white">
                                        <option>Hồ Chí Minh</option>
                                        <option>Hà Nội</option>
                                    </select>
                                    <select className="w-full cursor-pointer rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-400 outline-none transition focus:border-[#EE4D2D] focus:ring-1 focus:ring-[#EE4D2D] appearance-none bg-white">
                                        <option>Chọn Quận / Huyện</option>
                                    </select>
                                    <select className="w-full cursor-pointer rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-400 outline-none transition focus:border-[#EE4D2D] focus:ring-1 focus:ring-[#EE4D2D] appearance-none bg-white">
                                        <option>Chọn Phường / Xã</option>
                                    </select>
                                    <input
                                        type="text"
                                        placeholder="Số nhà, Tên đường"
                                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#EE4D2D] focus:ring-1 focus:ring-[#EE4D2D] placeholder:text-gray-400"
                                    />
                                    <div className="col-span-1 sm:col-span-2">
                                        <input
                                            type="text"
                                            placeholder="Ghi chú (Ví dụ: Giao giờ hành chính)"
                                            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#EE4D2D] focus:ring-1 focus:ring-[#EE4D2D] placeholder:text-gray-400"
                                        />
                                    </div>
                                </div>
                            )}
                        </section>

                        {/* --- 3. Phương thức thanh toán --- */}
                        <section className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
                            <h2 className="mb-5 text-base font-bold text-gray-800">3. Phương thức thanh toán</h2>

                            <div className="space-y-3">
                                {/* Option: COD */}
                                <label
                                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-all ${paymentMethod === "cod" ? "border-[#EE4D2D] bg-orange-50/10 shadow-sm" : "border-gray-200 hover:bg-gray-50"
                                        }`}
                                    onClick={() => setPaymentMethod("cod")}
                                >
                                    <div className={`flex h-5 w-5 items-center justify-center rounded-full border ${paymentMethod === "cod" ? "border-[#EE4D2D]" : "border-gray-300"}`}>
                                        {paymentMethod === "cod" && <div className="h-2.5 w-2.5 rounded-full bg-[#EE4D2D]"></div>}
                                    </div>
                                    <div className="h-6 w-6 shrink-0 rounded bg-gray-200"></div> {/* Icon Placeholder */}
                                    <span className="text-sm font-bold text-gray-700">Thanh toán khi nhận hàng (COD)</span>
                                </label>

                                {/* Option: VNPAY */}
                                <label
                                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-all ${paymentMethod === "vnpay" ? "border-[#EE4D2D] bg-orange-50/10 shadow-sm" : "border-gray-200 hover:bg-gray-50"
                                        }`}
                                    onClick={() => setPaymentMethod("vnpay")}
                                >
                                    <div className={`flex h-5 w-5 items-center justify-center rounded-full border ${paymentMethod === "vnpay" ? "border-[#EE4D2D]" : "border-gray-300"}`}>
                                        {paymentMethod === "vnpay" && <div className="h-2.5 w-2.5 rounded-full bg-[#EE4D2D]"></div>}
                                    </div>
                                    <div className="h-6 w-6 shrink-0 rounded bg-blue-100 flex items-center justify-center text-[8px] font-bold text-blue-600">VN</div> {/* Icon Placeholder */}
                                    <span className="text-sm font-bold text-gray-700">Thanh toán qua VNPAY</span>
                                </label>

                                {/* Option: MoMo */}
                                <label
                                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-all ${paymentMethod === "momo" ? "border-[#EE4D2D] bg-orange-50/10 shadow-sm" : "border-gray-200 hover:bg-gray-50"
                                        }`}
                                    onClick={() => setPaymentMethod("momo")}
                                >
                                    <div className={`flex h-5 w-5 items-center justify-center rounded-full border ${paymentMethod === "momo" ? "border-[#EE4D2D]" : "border-gray-300"}`}>
                                        {paymentMethod === "momo" && <div className="h-2.5 w-2.5 rounded-full bg-[#EE4D2D]"></div>}
                                    </div>
                                    <div className="h-6 w-6 shrink-0 rounded bg-pink-100 flex items-center justify-center text-[8px] font-bold text-pink-600">M</div> {/* Icon Placeholder */}
                                    <span className="text-sm font-bold text-gray-700">Thanh toán qua Ví MoMo</span>
                                </label>
                            </div>
                        </section>

                    </div>

                    {/* ==========================================
              CỘT PHẢI: TỔNG QUAN ĐƠN HÀNG (lg:w-1/3)
              ========================================== */}
                    <aside className="w-full shrink-0 lg:w-[340px] xl:w-[380px]">
                        <div className="sticky top-[100px] rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">

                            <div className="p-5">
                                <h2 className="mb-4 text-base font-bold text-gray-800">Đơn hàng của bạn ({orderItems.length} sản phẩm)</h2>

                                {/* Danh sách sản phẩm mua */}
                                <div className="mb-5 space-y-4">
                                    {orderItems.map((item) => (
                                        <div key={item.id} className="flex gap-3">
                                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded border border-gray-100 bg-gray-50 text-[10px] text-gray-400">
                                                IMG
                                            </div>
                                            <div className="flex flex-1 flex-col justify-between">
                                                <h3 className="line-clamp-1 text-xs font-bold text-gray-700">{item.name}</h3>
                                                <div className="flex items-end justify-between">
                                                    <span className="text-xs text-gray-500">Số lượng: {item.qty}</span>
                                                    <span className="text-xs font-bold text-gray-800">{formatPrice(item.price)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mb-4 border-t border-gray-100"></div>

                                {/* Tính toán tiền */}
                                <div className="space-y-3 text-sm text-gray-600">
                                    <div className="flex justify-between">
                                        <span>Tạm tính:</span>
                                        <span className="font-bold text-gray-800">35.880.000 ₫</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Phí vận chuyển:</span>
                                        <span className="font-bold text-gray-800">30.000 ₫</span>
                                    </div>
                                </div>

                                <div className="my-4 border-t border-gray-200"></div>

                                <div className="flex items-end justify-between mb-6">
                                    <span className="text-sm font-bold text-gray-800">Tổng cộng:</span>
                                    <span className="text-2xl font-extrabold text-[#EE4D2D] leading-none">
                                        35.910.000 ₫
                                    </span>
                                </div>

                                {/* Nút Đặt hàng */}
                                <button className="w-full rounded-lg bg-gradient-to-r from-[#EE4D2D] to-[#FFD400] py-3.5 text-sm font-bold tracking-wide text-white shadow-md transition hover:opacity-90 active:scale-[0.98]">
                                    XÁC NHẬN ĐẶT HÀNG
                                </button>

                                <p className="mt-4 text-center text-[11px] text-gray-500">
                                    Bằng việc đặt hàng, bạn đồng ý với <br />
                                    <span className="font-bold text-[#EE4D2D] cursor-pointer hover:underline">Điều khoản sử dụng</span> của chúng tôi.
                                </p>
                            </div>

                        </div>
                    </aside>

                </div>
            </main>
        </div>
    );
}