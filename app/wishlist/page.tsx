"use client";

import React, { useEffect, useState } from "react";
import Header from "@/components/Header";
import Link from "next/link";
import { getWishlist, toggleWishlist, WishlistItem, WISHLIST_UPDATED_EVENT } from "@/lib/wishlist";

export default function WishlistPage() {
    const [items, setItems] = useState<WishlistItem[]>([]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setItems(getWishlist());
        setMounted(true);

        const handleUpdate = () => {
            setItems(getWishlist());
        };
        window.addEventListener(WISHLIST_UPDATED_EVENT, handleUpdate);
        return () => window.removeEventListener(WISHLIST_UPDATED_EVENT, handleUpdate);
    }, []);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
    };

    const handleRemove = (item: WishlistItem, e: React.MouseEvent) => {
        e.preventDefault(); // Ngăn Link kích hoạt khi bấm nút Xóa
        toggleWishlist(item);
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-[#F4F6F8] pb-20">
            <Header />
            <main className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">

                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <svg className="w-6 h-6 text-red-500 fill-current" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            Sản phẩm yêu thích
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">Danh sách các món đồ bạn đã lưu để xem lại sau.</p>
                    </div>
                    <div className="text-sm font-bold text-gray-500 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
                        {items.length} sản phẩm
                    </div>
                </div>

                {items.length === 0 ? (
                    <div className="bg-white rounded-xl p-16 text-center shadow-sm border border-gray-100">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                        </div>
                        <h2 className="text-lg font-bold text-gray-800">Danh sách đang trống</h2>
                        <p className="text-gray-500 mt-2 mb-6">Bạn chưa lưu sản phẩm nào vào mục yêu thích.</p>
                        <Link href="/products" className="inline-block bg-[#EE4D2D] text-white font-bold px-6 py-3 rounded-lg hover:bg-orange-600 transition">
                            Khám phá sản phẩm
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                        {items.map((p) => (
                            <Link href={`/products/${p.id}`} key={p.id} className="group bg-white border border-gray-100 rounded-xl p-4 hover:border-red-300 hover:shadow-md transition-all block relative">

                                {/* Nút Xóa Khỏi Wishlist */}
                                <button
                                    onClick={(e) => handleRemove(p, e)}
                                    className="absolute top-2 right-2 z-10 w-8 h-8 bg-white/80 backdrop-blur border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors shadow-sm opacity-0 group-hover:opacity-100"
                                    title="Bỏ thích"
                                >
                                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                </button>

                                <div className="aspect-square bg-gray-50 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                                    {p.image ? (
                                        <img src={p.image} className="object-contain h-full w-full p-2 group-hover:scale-105 transition-transform" alt={p.name} />
                                    ) : (
                                        <span className="text-xs text-gray-300">IMG</span>
                                    )}
                                </div>
                                <h3 className="text-sm font-medium text-gray-700 line-clamp-2 mb-2 group-hover:text-[#EE4D2D] leading-snug">{p.name}</h3>
                                <p className="text-base font-bold text-[#EE4D2D]">{formatPrice(p.price)}</p>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}   