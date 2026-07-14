"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Header from "@/components/Header";
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/auth';
import { addToCart } from '@/lib/shop';

// --- ĐỊNH NGHĨA CÁC INTERFACE ---
interface Review {
    reviewerName?: string;
    ratingStars?: number;
    rating?: number;
    publishDate?: string;
    reviewContent?: string;
}

interface StorageVariant {
    storageName?: string;
    name?: string;
    value?: string;
}

interface ColorVariant {
    colorName?: string;
    name?: string;
    value?: string;
}

// Bổ sung interface cho ProductVariant từ Backend
interface ProductVariant {
    id: number;
    sku: string;
    colorName: string;
    storageName: string;
    price: number;
    oldPrice?: number;
    imageUrl?: string;
    stockQuantity: number;
    reservedQuantity: number;
    availableQuantity: number;
    active: boolean;
    inStock: boolean;
}

interface Product {
    id: string | number;
    name: string;
    category?: string;
    brand?: string;
    sku?: string;
    price: number;
    oldPrice?: number;
    mainThumbnail?: string;
    images?: string[];
    shortDescription?: string;
    description?: string;
    specs?: Record<string, string>;
    reviews?: Review[];
    storageVariants?: StorageVariant[];
    colorVariants?: ColorVariant[];
    variants?: ProductVariant[]; // Bổ sung mảng variants
}

// Hàm hỗ trợ format tiền tệ thông minh
const formatPrice = (priceStr: string | number) => {
    if (!priceStr || priceStr === "Giá liên hệ") return "Giá liên hệ";
    let str = String(priceStr);
    if (str.endsWith('.0')) str = str.slice(0, -2);
    if (str.endsWith('.00')) str = str.slice(0, -3);
    const numericString = str.replace(/[^\d]/g, '');
    if (!numericString) return str;
    const num = parseInt(numericString, 10);
    return num.toLocaleString('vi-VN') + '₫';
};

// --- COMPONENT GỢI Ý SẢN PHẨM TƯƠNG TỰ (CONTENT-BASED) ---
const SimilarProducts = ({ productId }: { productId: string | number }) => {
    const [similar, setSimilar] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!productId) return;
        let isMounted = true;

        const fetchRecommendations = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/recommendations/content-similar/${productId}`);
                if (!res.ok) {
                    if (isMounted) {
                        setSimilar([]);
                        setIsLoading(false);
                    }
                    return;
                }
                const data = await res.json();
                if (isMounted) {
                    if (Array.isArray(data)) {
                        setSimilar(data);
                    }
                    setIsLoading(false);
                }
            } catch (err) {
                if (isMounted) {
                    console.error("Lỗi tải sản phẩm tương tự (CBF):", err);
                    setIsLoading(false);
                }
            }
        };

        fetchRecommendations();
        return () => { isMounted = false; };
    }, [productId]);

    if (isLoading) {
        return (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6 mt-6">
                <div className="h-6 w-1/3 bg-gray-200 animate-pulse rounded-md mb-6"></div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {[1, 2, 3, 4, 5].map((item) => (
                        <div key={item} className="h-48 w-full bg-gray-100 animate-pulse rounded-lg"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (similar.length === 0) return null;

    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6 mt-6">
            <h2 className="text-lg font-bold mb-6 text-gray-800 uppercase tracking-wide flex items-center gap-2">
                <span className="text-[#EE4D2D]">✨</span> Sản phẩm có cấu hình tương tự
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {similar.map((prod) => (
                    <Link
                        href={`/products/${prod.id}`}
                        key={prod.id}
                        className="group relative flex cursor-pointer flex-col overflow-hidden rounded-lg border border-gray-100 hover:border-[#EE4D2D]/50 hover:shadow-md bg-white transition-all duration-300 hover:-translate-y-1"
                    >
                        <div className="aspect-square w-full bg-gray-50 relative overflow-hidden flex items-center justify-center p-4">
                            {prod.mainThumbnail ? (
                                <img src={prod.mainThumbnail} alt={prod.name} className="object-contain h-full w-full rounded-lg transition-transform duration-300 group-hover:scale-105" />
                            ) : prod.images && prod.images.length > 0 ? (
                                <img src={prod.images[0]} alt={prod.name} className="object-contain h-full w-full rounded-lg transition-transform duration-300 group-hover:scale-105" />
                            ) : (
                                <span className="text-gray-300 text-sm">Hình sản phẩm</span>
                            )}
                        </div>
                        <div className="flex flex-1 flex-col justify-between p-4">
                            <h3 className="mb-2 line-clamp-2 text-[13px] font-medium text-gray-700 transition-colors group-hover:text-[#EE4D2D] leading-relaxed">
                                {prod.name}
                            </h3>
                            <div className="mt-auto">
                                <span className="text-sm font-bold text-[#D0021C]">
                                    {formatPrice(prod.price)}
                                </span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default function ProductDetailPage() {
    const params = useParams();
    const router = useRouter();
    const productId = params?.id;

    // --- 1. STATE QUẢN LÝ DỮ LIỆU ---
    const [product, setProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [mainImage, setMainImage] = useState("");
    const [isArticleExpanded, setIsArticleExpanded] = useState(false);
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [cartMessage, setCartMessage] = useState("");

    // --- STATE QUẢN LÝ TASK B04 (VARIANT) ---
    const [selectedStorage, setSelectedStorage] = useState<string | null>(null);
    const [selectedColor, setSelectedColor] = useState<string | null>(null);

    // --- 2. GỌI API ---
    useEffect(() => {
        if (!productId) return;

        fetch(`${API_BASE_URL}/api/products/${productId}`)
            .then(res => {
                if (!res.ok) throw new Error("Không tìm thấy sản phẩm");
                return res.json();
            })
            .then((data: Product) => {
                setProduct(data);

                if (data.mainThumbnail) {
                    setMainImage(data.mainThumbnail);
                } else if (data.images && data.images.length > 0) {
                    setMainImage(data.images[0]);
                }

                // Chọn mặc định option đầu tiên nếu có
                if (data.storageVariants && data.storageVariants.length > 0) {
                    setSelectedStorage(data.storageVariants[0].storageName || data.storageVariants[0].name || data.storageVariants[0].value || null);
                }
                if (data.colorVariants && data.colorVariants.length > 0) {
                    setSelectedColor(data.colorVariants[0].colorName || data.colorVariants[0].name || data.colorVariants[0].value || null);
                }

                setIsLoading(false);
            })
            .catch(err => {
                console.error("Lỗi khi tải dữ liệu:", err);
                setIsLoading(false);
            });
    }, [productId]);

    // --- 3. TÌM VARIANT TƯƠNG ỨNG ---
    const activeVariant = useMemo(() => {
        if (!product || !product.variants) return null;

        // Tìm variant khớp với storage và color đang chọn
        return product.variants.find(v => {
            const matchStorage = selectedStorage ? v.storageName === selectedStorage : true;
            const matchColor = selectedColor ? v.colorName === selectedColor : true;
            return matchStorage && matchColor;
        });
    }, [product, selectedStorage, selectedColor]);

    // Khi activeVariant thay đổi ảnh thì cập nhật mainImage
    useEffect(() => {
        if (activeVariant?.imageUrl) {
            setMainImage(activeVariant.imageUrl);
        }
    }, [activeVariant]);

    if (isLoading) {
        return (
            <div className="bg-[#F4F6F8] min-h-screen">
                <Header />
                <div className="max-w-7xl mx-auto px-4 py-20 flex flex-col items-center justify-center">
                    <div className="w-10 h-10 border-4 border-[#EE4D2D] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500 mt-4 font-medium">Đang tải thông tin sản phẩm...</p>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="bg-[#F4F6F8] min-h-screen">
                <Header />
                <div className="max-w-7xl mx-auto px-4 py-20 flex flex-col items-center">
                    <h1 className="text-2xl font-bold text-gray-800">Không tìm thấy sản phẩm</h1>
                    <p className="text-gray-500 mt-2">Sản phẩm này không tồn tại hoặc đã bị xóa.</p>
                </div>
            </div>
        );
    }

    // --- 4. XỬ LÝ THÊM VÀO GIỎ HÀNG VỚI VARIANT ---
    const handleAddToCart = async (goToCart = false) => {
        const id = Number(product.id);
        if (!Number.isFinite(id)) return;

        // Lấy variantId (nếu có)
        const variantIdToAdd = activeVariant ? activeVariant.id : undefined;

        // Nếu sản phẩm có biến thể mà chưa chọn hoặc chọn nhầm cái hết hàng
        if (product.variants && product.variants.length > 0) {
            if (!activeVariant) {
                setCartMessage("Vui lòng chọn đầy đủ phân loại.");
                return;
            }
            if (!activeVariant.inStock || activeVariant.availableQuantity <= 0) {
                setCartMessage("Phiên bản này hiện đang hết hàng.");
                return;
            }
        }

        setIsAddingToCart(true);
        setCartMessage("");
        try {
            await addToCart(id, 1, variantIdToAdd); // Chú ý: Cần update hàm addToCart trong lib/shop.ts để nhận tham số thứ 3
            setCartMessage("Đã thêm sản phẩm vào giỏ hàng.");
            if (goToCart) {
                router.push("/cart");
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : "Không thể thêm vào giỏ hàng.";
            setCartMessage(message);
            if (message.toLowerCase().includes("dang nhap")) {
                router.push("/login");
            }
        } finally {
            setIsAddingToCart(false);
        }
    };

    const reviewCount = product.reviews?.length || 0;
    const avgRating = reviewCount > 0 && product.reviews
        ? product.reviews.reduce((acc: number, curr: Review) => acc + (curr.ratingStars || curr.rating || 5), 0) / reviewCount
        : 0;

    const cpu = product.specs?.["Chip xử lý (CPU)"] || product.specs?.["Vi xử lý (CPU)"] || product.specs?.["Công nghệ CPU"] || "Đang cập nhật CPU";
    const screenTech = product.specs?.["Công nghệ màn hình"] || "";
    const screenSize = product.specs?.["Màn hình rộng"] || product.specs?.["Màn hình"] || product.specs?.["Kích thước màn hình"] || "";
    const cleanScreenSize = screenSize.split("-")[0].trim();
    const screenInfo = [cleanScreenSize, screenTech].filter(Boolean).join(", ") || "Đang cập nhật màn hình";

    // --- HIỂN THỊ GIÁ DỰA TRÊN VARIANT ĐANG CHỌN ---
    const currentDisplayPrice = activeVariant?.price || product.price;
    const currentOldPrice = activeVariant?.oldPrice || product.oldPrice;

    const displayCurrentPrice = formatPrice(currentDisplayPrice);
    let displayOriginalPrice = formatPrice(currentOldPrice || 0);

    let discountPercent = 0;
    if (currentDisplayPrice && currentOldPrice && currentOldPrice > currentDisplayPrice) {
        discountPercent = Math.round(((currentOldPrice - currentDisplayPrice) / currentOldPrice) * 100);
    } else {
        displayOriginalPrice = "";
    }

    const categoryHref = product.category
        ? `/products?category=${encodeURIComponent(product.category)}`
        : "/products";
    const brandParams = new URLSearchParams();
    if (product.category) brandParams.set("category", product.category);
    if (product.brand) brandParams.set("brand", product.brand);
    const brandHref = brandParams.toString() ? `/products?${brandParams.toString()}` : categoryHref;

    // Gộp ảnh chính, ảnh variant, và ảnh phụ
    const galleryImages = Array.from(
        new Set([
            product.mainThumbnail,
            activeVariant?.imageUrl,
            ...(product.images ?? [])
        ].filter((image): image is string => Boolean(image)))
    );

    // Tính trạng thái kho hàng
    const isOutOfStock = product.variants && product.variants.length > 0
        ? (!activeVariant?.inStock || activeVariant.availableQuantity <= 0)
        : false;

    return (
        <div className="bg-[#F4F6F8] min-h-screen pb-10">
            <Header />

            <main className="max-w-7xl mx-auto px-4 py-6">

                {/* 1. BREADCRUMB */}
                <nav className="text-sm font-medium text-gray-500 mb-6 flex items-center gap-2">
                    <Link href="/" className="hover:text-[#EE4D2D] transition-colors">Trang chủ</Link>
                    <span>{'>'}</span>
                    <Link href={categoryHref} className="hover:text-[#EE4D2D] transition-colors capitalize">
                        {product.category || "Sản phẩm"}
                    </Link>
                    {product.brand && (
                        <>
                            <span>{'>'}</span>
                            <Link href={brandHref} className="hover:text-[#EE4D2D] transition-colors">{product.brand}</Link>
                        </>
                    )}
                    <span>{'>'}</span>
                    <span className="text-[#EE4D2D] font-semibold">{product.name}</span>
                </nav>

                {/* 2. SECTION CHÍNH: ẢNH & THÔNG TIN SẢN PHẨM */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-10 mb-6">
                    <div className="w-full md:w-5/12 flex flex-col items-center">
                        <div className="w-full bg-white border border-gray-100 rounded-xl mb-4 flex items-center justify-center overflow-hidden transition-all duration-300">
                            {mainImage ? (
                                <img
                                    src={mainImage}
                                    alt={product.name}
                                    className="w-full h-auto rounded-xl object-contain transition-transform duration-500 hover:scale-105"
                                    onError={(event) => {
                                        event.currentTarget.onerror = null;
                                        if (product.mainThumbnail && event.currentTarget.src !== product.mainThumbnail) {
                                            setMainImage(product.mainThumbnail);
                                        } else {
                                            setMainImage("");
                                        }
                                    }}
                                />
                            ) : (
                                <div className="aspect-square w-full flex items-center justify-center bg-gray-50 rounded-xl">
                                    <span className="text-gray-300 text-sm font-medium">Không có ảnh</span>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3 overflow-x-auto w-full pb-2 scrollbar-hide">
                            {galleryImages.map((imgUrl: string, idx: number) => (
                                <div
                                    key={idx}
                                    onClick={() => setMainImage(imgUrl)}
                                    className={`w-16 h-16 shrink-0 rounded-lg border-2 cursor-pointer overflow-hidden bg-white
                                        ${mainImage === imgUrl ? 'border-[#EE4D2D]' : 'border-gray-200 hover:border-gray-300'}`}
                                >
                                    <img src={imgUrl} alt={`Thumb ${idx}`} className="w-full h-full object-contain p-1" />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="w-full md:w-7/12 flex flex-col">
                        <h1 className="text-2xl font-bold text-gray-800 mb-2 leading-snug">
                            {product.name}
                        </h1>

                        <div className="flex items-center gap-4 mb-4 text-sm text-gray-500 border-b border-gray-100 pb-4">
                            <span className="text-gray-600">Thương hiệu: <span className="font-semibold text-[#EE4D2D]">{product.brand}</span></span>
                            <span className="text-gray-300">|</span>
                            <span>SKU: {activeVariant?.sku || product.sku}</span>
                            <span className="text-gray-300">|</span>
                            <div className="flex items-center gap-1">
                                <span className="text-[#FFD400] text-sm">★</span>
                                <span className="font-semibold text-gray-700">{avgRating.toFixed(1)}</span>
                                <span>({reviewCount} đánh giá)</span>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4 mb-6">
                            <div className="flex items-end gap-3">
                                <span className="text-3xl font-extrabold text-[#D0021C]">
                                    {displayCurrentPrice}
                                </span>
                                {discountPercent > 0 && displayOriginalPrice && (
                                    <>
                                        <span className="text-base text-gray-400 line-through mb-1 hover:text-gray-600">
                                            {displayOriginalPrice}
                                        </span>
                                        <span className="text-xs font-bold text-white bg-[#D0021C] px-1.5 py-0.5 rounded mb-1.5">
                                            -{discountPercent}%
                                        </span>
                                    </>
                                )}
                            </div>

                            {/* Hiển thị Tồn kho nếu có activeVariant */}
                            {activeVariant && (
                                <p className={`text-sm mt-2 font-medium ${isOutOfStock ? 'text-red-500' : 'text-green-600'}`}>
                                    {isOutOfStock ? "Đã hết hàng" : `Còn ${activeVariant.availableQuantity} sản phẩm`}
                                </p>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-2 mb-5">
                            <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">Chip: {cpu}</span>
                            <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">Màn hình: {screenInfo}</span>
                        </div>

                        {/* CHỌN DUNG LƯỢNG */}
                        {product.storageVariants && product.storageVariants.length > 0 && (
                            <div className="mb-5">
                                <h3 className="text-sm font-bold text-gray-800 mb-3">Phiên bản bộ nhớ:</h3>
                                <div className="flex flex-wrap gap-3">
                                    {product.storageVariants.map((v: StorageVariant, idx: number) => {
                                        const val = v.storageName || v.name || v.value;
                                        const isSelected = selectedStorage === val;
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => setSelectedStorage(val || null)}
                                                className={`px-4 py-2 text-sm rounded-lg border font-medium transition-all 
                                                    ${isSelected
                                                        ? 'border-[#EE4D2D] text-[#EE4D2D] bg-orange-50'
                                                        : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}
                                            >
                                                {val}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* CHỌN MÀU SẮC */}
                        {product.colorVariants && product.colorVariants.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-sm font-bold text-gray-800 mb-3">Chọn màu sắc:</h3>
                                <div className="flex flex-wrap gap-3">
                                    {product.colorVariants.map((c: ColorVariant, idx: number) => {
                                        const val = c.colorName || c.name || c.value;
                                        const isSelected = selectedColor === val;
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => setSelectedColor(val || null)}
                                                className={`px-4 py-2 text-sm rounded-lg border font-medium transition-all 
                                                    ${isSelected
                                                        ? 'border-[#EE4D2D] text-[#EE4D2D] bg-orange-50'
                                                        : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}
                                            >
                                                {val}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {product.shortDescription && (
                            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 mb-6 mt-auto">
                                <h3 className="text-sm font-bold text-blue-800 mb-2">Thông tin khuyến mãi:</h3>
                                <p className="text-sm text-gray-700 leading-relaxed">
                                    {product.shortDescription}
                                </p>
                            </div>
                        )}

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <button
                                onClick={() => handleAddToCart(true)}
                                disabled={isAddingToCart || isOutOfStock}
                                className={`flex-1 font-bold py-3.5 rounded-xl transition-colors shadow-sm text-lg text-white
                                    ${isOutOfStock ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#EE4D2D] hover:bg-orange-600 disabled:opacity-70'}`}
                            >
                                CHỌN MUA
                            </button>
                            <button
                                onClick={() => handleAddToCart(false)}
                                disabled={isAddingToCart || isOutOfStock}
                                className={`flex flex-1 items-center justify-center gap-2 border-2 font-bold py-3.5 rounded-xl transition-colors text-base
                                    ${isOutOfStock ? 'border-gray-300 text-gray-400 cursor-not-allowed' : 'border-[#EE4D2D] text-[#EE4D2D] hover:bg-orange-50 disabled:opacity-70'}`}
                                aria-label="Thêm vào giỏ hàng"
                            >
                                <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                {isAddingToCart ? "Đang thêm..." : "Thêm vào giỏ"}
                            </button>
                        </div>
                        {cartMessage && (
                            <p className={`mt-3 text-sm font-medium ${cartMessage.includes('hết hàng') || cartMessage.includes('Vui lòng') ? 'text-red-500' : 'text-green-600'}`}>
                                {cartMessage}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-6 mb-6">
                    <div className="w-full lg:w-4/12 bg-white rounded-xl p-6 shadow-sm border border-gray-100 h-fit">
                        <h2 className="text-lg font-bold mb-5 text-gray-800 uppercase tracking-wide">Cấu hình nổi bật</h2>
                        <ul className="flex flex-col text-sm text-gray-700">
                            {product.specs && Object.entries(product.specs).slice(0, 8).map(([key, value], idx) => (
                                <li key={idx} className={`flex justify-between py-3 ${idx !== 0 ? 'border-t border-gray-100' : ''}`}>
                                    <span className="w-1/2 text-gray-500 pr-4">{key}</span>
                                    <span className="w-1/2 font-medium">{String(value)}</span>
                                </li>
                            ))}
                        </ul>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="w-full mt-5 py-2.5 text-sm font-medium text-blue-600 border border-blue-600 rounded-full hover:bg-blue-50 transition-colors"
                        >
                            Xem cấu hình chi tiết
                        </button>
                    </div>

                    <div className="w-full lg:w-8/12 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <h2 className="text-lg font-bold mb-5 text-gray-800 uppercase tracking-wide">Đặc điểm nổi bật</h2>

                        <div className="text-sm text-gray-700 leading-loose">
                            {isArticleExpanded ? (
                                <div className="space-y-4 text-justify">
                                    {(() => {
                                        if (!product.description) return <p>Đang cập nhật thông tin bài viết.</p>;

                                        const lines = product.description.split('\n').map((l: string) => l.trim()).filter(Boolean);
                                        const images = product.images || [];

                                        const step = Math.max(1, Math.floor(lines.length / (images.length || 1)));
                                        let imgIndex = 0;

                                        return (
                                            <>
                                                {lines.map((line: string, idx: number) => {
                                                    const isSubHeading = (line.length < 120 && line.includes('?')) || line.startsWith('Đặc điểm');

                                                    return (
                                                        <React.Fragment key={idx}>
                                                            {isSubHeading ? (
                                                                <h3 className="text-base font-bold text-gray-900 mt-6 mb-3 pt-2 block">{line}</h3>
                                                            ) : (
                                                                <p className="text-sm text-gray-600 leading-relaxed mb-3">{line}</p>
                                                            )}

                                                            {idx > 0 && idx % step === 0 && imgIndex < images.length && (
                                                                <div className="my-6 flex justify-center bg-gray-50/50 rounded-xl border border-gray-100 overflow-hidden">
                                                                    <img
                                                                        src={images[imgIndex++]}
                                                                        alt={`${product.name} - Hình minh họa ${imgIndex}`}
                                                                        className="w-full max-w-2xl h-auto rounded-lg object-contain shadow-sm"
                                                                        loading="lazy"
                                                                    />
                                                                </div>
                                                            )}
                                                        </React.Fragment>
                                                    );
                                                })}

                                                {imgIndex < images.length && (
                                                    <div className="flex flex-col gap-4 mt-6">
                                                        {images.slice(imgIndex).map((imgUrl: string, idx: number) => (
                                                            <div key={idx} className="flex justify-center bg-gray-50/50 rounded-xl border border-gray-100 overflow-hidden">
                                                                <img
                                                                    src={imgUrl}
                                                                    alt={`${product.name} - Hình bổ sung ${idx + 1}`}
                                                                    className="w-full max-w-2xl h-auto rounded-lg object-contain shadow-sm"
                                                                    loading="lazy"
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>
                            ) : (
                                <div className="relative">
                                    <p className="text-justify text-sm text-gray-600 leading-relaxed">
                                        {product.shortDescription || "Đang cập nhật thông tin."}
                                    </p>
                                    <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex justify-center border-t border-gray-100 pt-4">
                            <button
                                onClick={() => setIsArticleExpanded(!isArticleExpanded)}
                                className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 transition-colors px-4 py-2 rounded-full hover:bg-blue-50"
                            >
                                {isArticleExpanded ? "Thu gọn bài viết" : "Đọc thêm bài viết"}
                                <svg
                                    width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                    className={`transform transition-transform duration-300 ${isArticleExpanded ? 'rotate-180' : ''}`}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
                    <h2 className="text-lg font-bold mb-6 text-gray-800 uppercase tracking-wide flex items-center gap-2">
                        Đánh giá khách hàng <span className="text-sm font-normal text-gray-500 normal-case">({reviewCount} đánh giá)</span>
                    </h2>
                    {product.reviews && product.reviews.length > 0 ? (
                        <div className="flex flex-col gap-6">
                            {product.reviews.map((review: Review, idx: number) => (
                                <div key={idx} className={`pb-6 ${idx !== reviewCount - 1 ? 'border-b border-gray-100' : ''}`}>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-500 uppercase">
                                            {review.reviewerName?.charAt(0) || "U"}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm text-gray-800">{review.reviewerName || "Giấu tên"}</p>
                                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                                <div className="flex text-[#FFD400]">
                                                    {[1, 2, 3, 4, 5].map(star => (
                                                        <span key={star} className={star <= (review.ratingStars || 5) ? "" : "text-gray-300"}>★</span>
                                                    ))}
                                                </div>
                                                <span>•</span>
                                                <span>{review.publishDate?.split(':')[0] || "Gần đây"}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-xl">
                                        {review.reviewContent || "Người dùng không để lại bình luận."}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-gray-500 text-sm">
                            Chưa có đánh giá nào cho sản phẩm này.
                        </div>
                    )}
                </div>
                <SimilarProducts productId={productId as string} />
            </main>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="absolute inset-0" onClick={() => setIsModalOpen(false)}></div>
                    <div className="bg-white rounded-2xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl relative z-10 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-5 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-gray-900">Thông số kỹ thuật chi tiết</h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                            >
                                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="overflow-y-auto p-6 space-y-1 custom-scrollbar">
                            {product.specs ? (
                                Object.entries(product.specs).map(([key, value], idx) => (
                                    <div
                                        key={idx}
                                        className={`flex py-3.5 px-3 text-sm items-start rounded-lg
                                            ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
                                    >
                                        <span className="w-5/12 text-gray-500 font-medium pr-4 shrink-0">{key}</span>
                                        <span className="w-7/12 text-gray-800 font-semibold whitespace-pre-line text-left">
                                            {String(value)}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-gray-500 py-10">Không tìm thấy thông số kỹ thuật.</p>
                            )}
                        </div>
                        <div className="p-4 border-t border-gray-100 flex justify-end bg-gray-50 rounded-b-2xl">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="bg-gray-900 hover:bg-gray-800 text-white font-bold px-6 py-2 rounded-xl text-sm transition-colors shadow-sm"
                            >
                                Đóng lại
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}