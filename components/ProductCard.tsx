"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ProductAddToCartButton from '@/components/ProductAddToCartButton';

// --- TYPE DEFINITIONS ---
export type ProductCatalogItem = {
    id: number;
    name: string;
    category?: string;
    brand?: string;
    price?: number;
    oldPrice?: number;
    mainThumbnail?: string;
    specs?: Record<string, string>;
    reviews?: Array<Record<string, unknown>>;
};

type ProductCardProps = {
    product: ProductCatalogItem;
};

function ProductCard({ product }: ProductCardProps) {
    const cpu = product.specs?.["Chip xử lý (CPU)"] || product.specs?.["Vi xử lý (CPU)"] || "Đang cập nhật";
    const screen = product.specs?.["Màn hình rộng"] || product.specs?.["Màn hình"] || "Đang cập nhật";
    const ram = product.specs?.["RAM"] || "";

    let discountPercent = 0;
    if (product.price && product.oldPrice && product.oldPrice > product.price) {
        discountPercent = Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100);
    }

    const reviewCount = product.reviews ? product.reviews.length : 0;

    return (
        <div
            className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#EE4D2D]/30 hover:shadow-md"
        >
            <Link href={`/products/${product.id}`} className="flex flex-1 flex-col">
            <div className="aspect-square w-full bg-white relative overflow-hidden flex items-center justify-center p-4">
                {product.mainThumbnail ? (
                    <Image
                        src={product.mainThumbnail}
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-contain rounded-lg transition-transform duration-300 group-hover:scale-105"
                    />
                ) : (
                    <span className="text-gray-300 text-sm">Hình sản phẩm</span>
                )}
            </div>

            <div className="flex flex-1 flex-col p-4 bg-white z-10 relative">
                <h3 className="mb-2 min-h-[42px] line-clamp-2 text-[15px] font-medium leading-snug text-gray-900 transition-colors group-hover:text-[#EE4D2D]">
                    {product.name}
                </h3>

                <div className="mb-3 mt-1 min-h-[36px] space-y-1 text-xs text-gray-500">
                    <p className="truncate">Chip: {cpu}</p>
                    <p className="truncate">Màn hình: {screen}</p>
                </div>

                <div className="mb-3 flex min-h-[24px] flex-wrap items-start gap-1.5">
                    {ram && (
                        <span className="inline-flex items-center rounded border border-gray-200 px-2 py-0.5 text-[11px] font-medium text-gray-600 bg-gray-50">
                            RAM {ram}
                        </span>
                    )}
                </div>

                <div className="flex flex-col mt-auto pt-2 border-t border-gray-100">
                    <span className="text-lg font-bold text-[#D0021C]">
                        {formatPrice(product.price)}
                    </span>
                    
                    <div className="flex items-center gap-2 mt-0.5 min-h-[20px]">
                        {discountPercent > 0 && product.oldPrice && (
                            <>
                                <span className="text-sm text-gray-400 line-through">
                                    {formatPrice(product.oldPrice)}
                                </span>
                                <span className="text-xs font-medium text-[#D0021C] bg-[#FFF0F1] px-1 rounded">
                                    -{discountPercent}%
                                </span>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-1 mt-1.5 text-[12px] text-gray-400">
                        <div className="flex text-[#FFD400]">★★★★★</div>
                        <span>({reviewCount})</span>
                    </div>
                </div>
            </div>
            </Link>
            <div className="bg-white px-4 pb-4">
                <ProductAddToCartButton productId={product.id} />
            </div>
        </div>
    );
}

function formatPrice(price?: number | string) {
    if (!price) return "Giá liên hệ";
    const value = typeof price === "string" ? Number(price.replace(/[^\d]/g, "")) : price;
    if (!Number.isFinite(value)) return "Giá liên hệ";
    return `${value.toLocaleString("vi-VN")}₫`;
}

export default React.memo(ProductCard);
