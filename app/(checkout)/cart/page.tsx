"use client";

import React, { useState } from "react";
import CartHeader from "@/components/CartHeader";

export default function CartPage() {
    // Mock data giả lập sản phẩm trong giỏ hàng
    const [cartItems, setCartItems] = useState([
        {
            id: 1,
            name: "iPhone 15 Pro Max 256GB - Chính hãng VN/A",
            variation: "Màu: Titan Tự nhiên",
            price: 29990000,
            quantity: 1,
            image: "IMG",
            selected: true,
        },
        {
            id: 2,
            name: "Ốp lưng Magsafe iPhone 15 Pro Max Trong suốt",
            variation: "Phân loại: Trong suốt",
            price: 490000,
            quantity: 2,
            image: "IMG",
            selected: true,
        },
    ]);

    // Hàm xử lý định dạng tiền tệ VNĐ
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(price);
    };

    // Tính tổng tiền
    const totalAmount = cartItems
        .filter((item) => item.selected)
        .reduce((sum, item) => sum + item.price * item.quantity, 0);

    return (
        <div className="min-h-screen bg-[#F4F6F8] pb-20">
            {/* 1. Kéo CartHeader dùng chung vào đây, truyền currentStep = 1 */}
            <CartHeader title="Giỏ hàng" currentStep={1} />

            <main className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-6 lg:flex-row">

                    <div className="flex-1 space-y-4">

                        {/* Thanh tiêu đề các cột */}
                        <div className="hidden grid-cols-12 items-center rounded-xl bg-white p-4 text-sm font-medium text-gray-500 shadow-sm md:grid">
                            <div className="col-span-5 flex items-center gap-4">
                                <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-gray-300 text-[#EE4D2D] focus:ring-[#EE4D2D] cursor-pointer"
                                    defaultChecked
                                />
                                <span>Sản phẩm</span>
                            </div>
                            <div className="col-span-2 text-center">Đơn giá</div>
                            <div className="col-span-2 text-center">Số lượng</div>
                            <div className="col-span-2 text-center">Số tiền</div>
                            <div className="col-span-1 text-center">Thao tác</div>
                        </div>

                        {/* Danh sách Item */}
                        <div className="flex flex-col gap-4">
                            {cartItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="grid grid-cols-1 items-center gap-4 rounded-xl bg-white p-4 shadow-sm md:grid-cols-12"
                                >
                                    {/* Cột Sản phẩm */}
                                    <div className="col-span-5 flex items-start gap-4 md:items-center">
                                        <input
                                            type="checkbox"
                                            className="mt-4 h-4 w-4 shrink-0 rounded border-gray-300 text-[#EE4D2D] focus:ring-[#EE4D2D] cursor-pointer md:mt-0"
                                            checked={item.selected}
                                            readOnly
                                        />
                                        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-xs text-gray-400">
                                            {item.image}
                                        </div>
                                        <div className="flex flex-col justify-center">
                                            <h3 className="line-clamp-2 text-sm font-medium text-gray-800 leading-snug hover:text-[#EE4D2D] cursor-pointer">
                                                {item.name}
                                            </h3>
                                            <span className="mt-1 text-xs text-gray-500">{item.variation}</span>
                                        </div>
                                    </div>

                                    {/* Cột Đơn giá (ẩn trên mobile) */}
                                    <div className="hidden col-span-2 text-center text-sm font-medium text-gray-600 md:block">
                                        {formatPrice(item.price)}
                                    </div>

                                    {/* Cột Số lượng */}
                                    <div className="col-span-2 flex items-center justify-center">
                                        <div className="flex h-8 items-center rounded border border-gray-300">
                                            <button className="flex h-full w-8 items-center justify-center text-gray-500 hover:bg-gray-100 transition">
                                                -
                                            </button>
                                            <input
                                                type="text"
                                                className="h-full w-10 border-x border-gray-300 bg-transparent text-center text-sm font-medium outline-none"
                                                value={item.quantity}
                                                readOnly
                                            />
                                            <button className="flex h-full w-8 items-center justify-center text-gray-500 hover:bg-gray-100 transition">
                                                +
                                            </button>
                                        </div>
                                    </div>

                                    {/* Cột Số tiền */}
                                    <div className="col-span-2 text-center text-sm font-bold text-[#EE4D2D]">
                                        {formatPrice(item.price * item.quantity)}
                                    </div>

                                    {/* Cột Thao tác (Xóa) */}
                                    <div className="col-span-1 flex justify-center">
                                        <button className="text-gray-400 hover:text-red-500 transition-colors">
                                            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <aside className="w-full shrink-0 lg:w-[340px] xl:w-[380px]">
                        <div className="sticky top-[100px] flex flex-col gap-4">

                            {/* Box 1: Voucher */}
                            <div className="flex items-center justify-between rounded-xl bg-white p-5 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <svg width="24" height="24" fill="none" stroke="#EE4D2D" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                                    </svg>
                                    <span className="text-sm font-medium text-gray-800">Sope Voucher</span>
                                </div>
                                <button className="text-sm font-medium text-blue-600 hover:text-blue-700 transition">
                                    Chọn hoặc nhập mã
                                </button>
                            </div>

                            {/* Box 2: Tính tiền & Nút Mua Hàng */}
                            <div className="rounded-xl bg-white shadow-sm overflow-hidden">
                                <div className="p-5">
                                    <h2 className="mb-4 text-base font-bold text-gray-800">Tổng quan đơn hàng</h2>

                                    <div className="space-y-3 text-sm text-gray-600">
                                        <div className="flex justify-between">
                                            <span>Tạm tính ({cartItems.length} sản phẩm)</span>
                                            <span className="font-medium text-gray-800">{formatPrice(totalAmount)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Phí giao hàng</span>
                                            <span className="font-medium text-gray-800">Chưa tính</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Khuyến mãi</span>
                                            <span className="font-medium text-green-600">- 0 ₫</span>
                                        </div>
                                    </div>

                                    <div className="my-4 border-t border-gray-200"></div>

                                    <div className="flex items-end justify-between">
                                        <span className="text-sm font-medium text-gray-800">Tổng tiền</span>
                                        <div className="flex flex-col items-end">
                                            <span className="text-2xl font-extrabold text-[#EE4D2D] leading-none">
                                                {formatPrice(totalAmount)}
                                            </span>
                                            <span className="mt-1 text-[11px] text-gray-400">(Đã bao gồm VAT nếu có)</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5 pt-0">
                                    <button className="w-full rounded-lg bg-gradient-to-r from-[#EE4D2D] to-[#FFD400] py-3.5 text-base font-bold text-white shadow-md transition hover:opacity-90 active:scale-[0.98]">
                                        MUA HÀNG
                                    </button>
                                </div>
                            </div>

                        </div>
                    </aside>

                </div>
            </main>
        </div>
    );
}