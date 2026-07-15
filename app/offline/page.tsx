"use client";

import React, { useEffect, useState } from "react";
import Header from "@/components/Header";
import Link from "next/link";

interface ViewedProduct {
    id: string | number;
    name: string;
    price: number;
    image: string;
}

export default function OfflinePage() {
    const [viewedProducts, setViewedProducts] = useState<ViewedProduct[]>([]);

    useEffect(() => {
        // Đọc danh sách đã lưu từ LocalStorage
        try {
            const stored = localStorage.getItem("sope_recently_viewed");
            if (stored) {
                setViewedProducts(JSON.parse(stored));
            }
        } catch (e) {
            console.error("Không thể đọc lịch sử xem", e);
        }
    }, []);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
    };

    return (
        <div className="min-h-screen bg-[#F4F6F8] pb-20">
            <Header />
            <main className="mx-auto mt-12 max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
                <svg
                    className="mx-auto h-24 w-24 text-gray-400 mb-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3l18 18" />
                </svg>

                <h1 className="text-3xl font-bold text-gray-900 mb-4">Bạn đang ngoại tuyến!</h1>
                <p className="text-gray-600 mb-10 max-w-lg mx-auto">
                    Vui lòng kiểm tra lại kết nối mạng (Wi-Fi hoặc 3G/4G) của bạn. Trong lúc chờ đợi, bạn có thể xem lại thông tin các sản phẩm vừa truy cập.
                </p>

                {viewedProducts.length > 0 && (
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-left">
                        <h2 className="text-lg font-bold mb-5 text-gray-800 flex items-center gap-2">
                            <svg className="w-5 h-5 text-[#EE4D2D]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            Sản phẩm bạn vừa xem
                        </h2>
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                            {viewedProducts.map(p => (
                                <Link href={`/products/${p.id}`} key={p.id} className="group border border-gray-100 rounded-lg p-3 hover:border-[#EE4D2D] hover:shadow-md transition-all block">
                                    <div className="aspect-square bg-gray-50 rounded-md mb-3 flex items-center justify-center overflow-hidden">
                                        {p.image ? (
                                            <img src={p.image} className="object-contain h-full w-full p-2 group-hover:scale-105 transition-transform" alt={p.name} />
                                        ) : (
                                            <span className="text-xs text-gray-300">IMG</span>
                                        )}
                                    </div>
                                    <h3 className="text-[13px] font-medium text-gray-700 line-clamp-2 mb-1.5 group-hover:text-[#EE4D2D] leading-snug">{p.name}</h3>
                                    <p className="text-sm font-bold text-[#EE4D2D]">{formatPrice(p.price)}</p>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                <button
                    onClick={() => window.location.reload()}
                    className="mt-10 rounded-lg bg-[#EE4D2D] px-8 py-3.5 font-bold text-white shadow-md hover:bg-orange-600 transition-colors"
                >
                    TẢI LẠI TRANG THỬ XEM
                </button>
            </main>
        </div>
    );
}