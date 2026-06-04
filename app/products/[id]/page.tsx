"use client";

import React, { useState, useEffect } from 'react';
import Header from "@/components/Header";
import { useParams } from 'next/navigation'; // Hook lấy id từ URL

// 1. IMPORT CẢ 3 FILE DỮ LIỆU
import phoneData from '../../data/data_phone.json'; 
import tabletData from '../../data/data_tablet.json'; 
import laptopData from '../../data/data_laptop.json';

// Hàm hỗ trợ format tiền tệ thông minh (Đã sửa lỗi 10,59)
const formatPrice = (priceStr: string | number) => {
    if (!priceStr || priceStr === "Giá liên hệ") return "Giá liên hệ";
    
    let str = String(priceStr);

    // 1. Xóa đuôi thập phân ".0" hoặc ".00" nếu có (thường bị dư ở data laptop)
    if (str.endsWith('.0')) str = str.slice(0, -2);
    if (str.endsWith('.00')) str = str.slice(0, -3);

    // 2. Tẩy sạch TẤT CẢ dấu chấm, dấu phẩy, và chữ "₫" 
    const numericString = str.replace(/[^\d]/g, '');
    
    if (!numericString) return str;

    // 3. Đọc số nguyên (parseInt) và format lại chuẩn Việt Nam
    const num = parseInt(numericString, 10);
    return num.toLocaleString('vi-VN') + '₫';
};

export default function ProductDetailPage() {
    // Lấy tham số từ URL
    const params = useParams();
    const productId = params?.id; 
    // State quản lý trạng thái đóng/mở bảng cấu hình chi tiết đầy đủ
    const [isModalOpen, setIsModalOpen] = useState(false);
    // 2. GỘP DỮ LIỆU VÀ TÌM KIẾM SẢN PHẨM
    const phones = Array.isArray(phoneData) ? phoneData : [phoneData];
    const tablets = Array.isArray(tabletData) ? tabletData : [tabletData];
    const laptops = Array.isArray(laptopData) ? laptopData : [laptopData]; 
    const allProducts: any[] = [...phones, ...tablets, ...laptops];

    // TÌM SẢN PHẨM ĐỘNG
    const product = allProducts.find((p: any) => p.sku === productId);

    // State quản lý ảnh đang hiển thị
    const [mainImage, setMainImage] = useState("");

    // State quản lý trạng thái mở rộng bài viết
    const [isArticleExpanded, setIsArticleExpanded] = useState(false);

    // Set ảnh mặc định khi load xong product
    useEffect(() => {
        if (product && product.infographic_images && product.infographic_images.length > 0) {
            setMainImage(product.infographic_images[0]);
        }
    }, [product]);

    // XỬ LÝ NẾU KHÔNG TÌM THẤY SẢN PHẨM HOẶC SAI URL
    if (!product) {
        return (
            <div className="bg-[#F4F6F8] min-h-screen">
                <Header />
                <div className="max-w-7xl mx-auto px-4 py-20 flex flex-col items-center">
                    <h1 className="text-2xl font-bold text-gray-800">Không tìm thấy sản phẩm</h1>
                    <p className="text-gray-500 mt-2">Sản phẩm với mã SKU "{productId}" không tồn tại.</p>
                </div>
            </div>
        );
    }

    // Tính toán số lượng và điểm trung bình đánh giá
    const reviewCount = product.customer_reviews?.length || 0;
    const avgRating = reviewCount > 0 
        ? product.customer_reviews.reduce((acc: number, curr: any) => acc + (curr.rating_stars || 5), 0) / reviewCount 
        : 0;

    // Trích xuất thông tin Cấu hình (Chip / Màn hình)
    const cpu = product.detailed_specs?.["Chip xử lý (CPU)"] || product.detailed_specs?.["Vi xử lý (CPU)"] || product.detailed_specs?.["Công nghệ CPU"] || "Đang cập nhật CPU";
    const screenTech = product.detailed_specs?.["Công nghệ màn hình"] || "";
    const screenSize = product.detailed_specs?.["Màn hình rộng"] || product.detailed_specs?.["Màn hình"] || product.detailed_specs?.["Kích thước màn hình"] || "";
    const cleanScreenSize = screenSize.split("-")[0].trim();
    const screenInfo = [cleanScreenSize, screenTech].filter(Boolean).join(", ") || "Đang cập nhật màn hình";

    // --- TÍNH TOÁN VÀ FORMAT GIÁ TIỀN TỰ ĐỘNG ---
    let rawCurrentPrice = product.current_price || product.main_price;
    let rawOriginalPrice = product.original_price || "";

    // Xử lý nếu là Laptop (dùng trường price)
    if (!rawCurrentPrice && product.price) {
        rawCurrentPrice = product.price;
        rawOriginalPrice = product.price;
    }

    // Xử lý nếu là Điện thoại (dùng mảng service_packages)
    if (product.service_packages && product.service_packages.length > 0) {
        const activePackage = product.service_packages.find((p: any) => p.is_active) || product.service_packages[0];
        if (activePackage) {
            rawCurrentPrice = activePackage.current_price || rawCurrentPrice;
            rawOriginalPrice = activePackage.original_price || rawOriginalPrice;
        }
    }

    // Format thành chuỗi hiển thị
    const displayCurrentPrice = formatPrice(rawCurrentPrice);
    let displayOriginalPrice = formatPrice(rawOriginalPrice);
    
    // Tính phần trăm giảm giá (nếu có)
    let discountPercent = 0;
    if (displayCurrentPrice && displayOriginalPrice && displayCurrentPrice !== "Giá liên hệ" && displayCurrentPrice !== displayOriginalPrice) {
        // Lọc bỏ ký tự chữ, chỉ giữ lại số để tính toán
        const currentNum = parseInt(displayCurrentPrice.replace(/[^\d]/g, ''), 10);
        const originalNum = parseInt(displayOriginalPrice.replace(/[^\d]/g, ''), 10);
        
        if (!isNaN(currentNum) && !isNaN(originalNum) && originalNum > currentNum) {
            discountPercent = Math.round(((originalNum - currentNum) / originalNum) * 100);
        }
    } else {
        // Nếu giá giống nhau thì ẩn giá gốc (gạch ngang) đi
        displayOriginalPrice = "";
    }

    return (
        <div className="bg-[#F4F6F8] min-h-screen pb-10">
            <Header />

            <main className="max-w-7xl mx-auto px-4 py-6">

                {/* 1. BREADCRUMB */}
                <nav className="text-sm font-medium text-gray-500 mb-6 flex items-center gap-2">
                    <span className="cursor-pointer hover:text-[#EE4D2D] transition-colors">Trang chủ</span> 
                    <span>{'>'}</span> 
                    <span className="cursor-pointer hover:text-[#EE4D2D] transition-colors capitalize">{product.category || "Sản phẩm"}</span> 
                    <span>{'>'}</span> 
                    <span className="cursor-pointer hover:text-[#EE4D2D] transition-colors">{product.brand?.[0]?.[0]}</span>
                    <span>{'>'}</span> 
                    <span className="text-[#EE4D2D] font-semibold">{product.product_name}</span>
                </nav>

                {/* 2. SECTION CHÍNH: ẢNH & THÔNG TIN SẢN PHẨM */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-10 mb-6">

                    {/* Cột trái: Ảnh sản phẩm (Gallery) */}
                    <div className="w-full md:w-5/12 flex flex-col items-center">
                        {/* ẢNH CHÍNH (Đã nâng cấp để tự động khớp mọi loại ảnh: Vuông, Ngang, Dọc) */}
                        <div className="w-full bg-white border border-gray-100 rounded-xl mb-4 flex items-center justify-center overflow-hidden transition-all duration-300">
                            {mainImage ? (
                                <img 
                                    src={mainImage} 
                                    alt={product.product_name} 
                                    // Thay 'h-full object-contain' bằng 'h-auto rounded-xl object-contain'
                                    className="w-full h-auto rounded-xl object-contain transition-transform duration-500 hover:scale-105" 
                                />
                            ) : (
                                // Nếu không có ảnh, hiện khung vuông màu xám để giữ bố cục
                                <div className="aspect-square w-full flex items-center justify-center bg-gray-50 rounded-xl">
                                    <span className="text-gray-300 text-sm font-medium">Không có ảnh</span>
                                </div>
                            )}
                        </div>
                        {/* Thumbnails */}
                        <div className="flex gap-3 overflow-x-auto w-full pb-2 scrollbar-hide">
                            {product.infographic_images?.map((imgUrl: string, idx: number) => (
                                <div 
                                    key={idx} 
                                    onClick={() => setMainImage(imgUrl)}
                                    className={`w-16 h-16 shrink-0 rounded-lg border-2 cursor-pointer overflow-hidden bg-white
                                        ${mainImage === imgUrl ? 'border-[#EE4D2D]' : 'border-gray-200 hover:border-gray-300'}`}
                                >
                                    {/* Ảnh thumbnail nhỏ bên trong không cần xóa p-1 vì nó là trang trí */}
                                    <img src={imgUrl} alt={`Thumb ${idx}`} className="w-full h-full object-contain p-1" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Cột phải: Thông tin & Mua hàng */}
                    <div className="w-full md:w-7/12 flex flex-col">
                        <h1 className="text-2xl font-bold text-gray-800 mb-2 leading-snug">
                            {product.product_name}
                        </h1>

                        <div className="flex items-center gap-4 mb-4 text-sm text-gray-500 border-b border-gray-100 pb-4">
                            <span className="text-gray-600">Thương hiệu: <span className="font-semibold text-[#EE4D2D]">{product.brand?.[0]?.[0]}</span></span>
                            <span className="text-gray-300">|</span>
                            <span>SKU: {product.sku}</span>
                            <span className="text-gray-300">|</span>
                            {/* Star Rating */}
                            <div className="flex items-center gap-1">
                                <span className="text-[#FFD400] text-sm">★</span>
                                <span className="font-semibold text-gray-700">{avgRating.toFixed(1)}</span>
                                <span>({reviewCount} đánh giá)</span>
                            </div>
                        </div>

                        {/* Giá */}
                        <div className="bg-gray-50 rounded-lg p-4 mb-6">
                            <div className="flex items-end gap-3">
                                <span className="text-3xl font-extrabold text-[#D0021C]">
                                    {displayCurrentPrice}
                                </span>
                                {discountPercent > 0 && displayOriginalPrice && (
                                    <>
                                        <span className="text-base text-gray-400 line-through mb-1 hover:text-gray-600 cursor-help" title={`Giá gốc: ${displayOriginalPrice}`}>
                                            {displayOriginalPrice}
                                        </span>
                                        <span className="text-xs font-bold text-white bg-[#D0021C] px-1.5 py-0.5 rounded mb-1.5">
                                            -{discountPercent}%
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Cấu hình cơ bản (Chip / Màn hình) */}
                        <div className="flex flex-wrap gap-2 mb-5">
                            <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">Chip: {cpu}</span>
                            <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">Màn hình: {screenInfo}</span>
                        </div>

                        {/* Phiên bản bộ nhớ (Storage Variants) */}
                        {product.storage_variants && product.storage_variants.length > 0 && (
                            <div className="mb-5">
                                <h3 className="text-sm font-bold text-gray-800 mb-3">Phiên bản bộ nhớ:</h3>
                                <div className="flex flex-wrap gap-3">
                                    {product.storage_variants.map((v: any, idx: number) => (
                                        <button 
                                            key={idx}
                                            className={`px-4 py-2 text-sm rounded-lg border font-medium transition-all
                                                ${v.is_active ? 'border-[#EE4D2D] text-[#EE4D2D] bg-orange-50' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}
                                        >
                                            {v.storage_name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Màu sắc (Color Variants) */}
                        {product.color_variants && product.color_variants.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-sm font-bold text-gray-800 mb-3">Chọn màu sắc:</h3>
                                <div className="flex flex-wrap gap-3">
                                    {product.color_variants.map((c: any, idx: number) => (
                                        <button 
                                            key={idx}
                                            className={`px-4 py-2 text-sm rounded-lg border font-medium transition-all
                                                ${c.is_active ? 'border-[#EE4D2D] text-[#EE4D2D] bg-orange-50' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}
                                        >
                                            {c.color_name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Mô tả ngắn (Dịch chuyển lên trên Nút mua hàng) */}
                        {product.short_description && (
                            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 mb-6 mt-auto">
                                <h3 className="text-sm font-bold text-blue-800 mb-2">Thông tin khuyến mãi:</h3>
                                <p className="text-sm text-gray-700 leading-relaxed">
                                    {product.short_description}
                                </p>
                            </div>
                        )}

                        {/* Nút hành động */}
                        <div className="flex gap-4">
                            <button className="flex-1 bg-[#EE4D2D] hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition-colors shadow-sm text-lg">
                                CHỌN MUA
                            </button>
                            <button className="w-14 h-14 flex items-center justify-center border-2 border-gray-200 rounded-xl hover:border-[#EE4D2D] hover:text-[#EE4D2D] text-gray-500 transition-colors">
                                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-6 mb-6">
                    {/* 3. SECTION CẤU HÌNH SẢN PHẨM (Cột trái) */}
                    <div className="w-full lg:w-4/12 bg-white rounded-xl p-6 shadow-sm border border-gray-100 h-fit">
                        <h2 className="text-lg font-bold mb-5 text-gray-800 uppercase tracking-wide">Cấu hình nổi bật</h2>
                        <ul className="flex flex-col text-sm text-gray-700">
                            {/* Chỉ lấy 8 thông số đầu tiên hiển thị rút gọn ngoài màn hình */}
                            {product.detailed_specs && Object.entries(product.detailed_specs).slice(0, 8).map(([key, value], idx) => (
                                <li key={idx} className={`flex justify-between py-3 ${idx !== 0 ? 'border-t border-gray-100' : ''}`}>
                                    <span className="w-1/2 text-gray-500 pr-4">{key}</span>
                                    <span className="w-1/2 font-medium">{String(value)}</span>
                                </li>
                            ))}
                        </ul>
                        {/* Cập nhật onClick để mở bảng chi tiết đầy đủ */}
                        <button 
                            onClick={() => setIsModalOpen(true)} // [!code ++]
                            className="w-full mt-5 py-2.5 text-sm font-medium text-blue-600 border border-blue-600 rounded-full hover:bg-blue-50 transition-colors"
                        >
                            Xem cấu hình chi tiết
                        </button>
                    </div>

                    {/* 4. SECTION BÀI VIẾT ĐÁNH GIÁ (Cột phải) */}
                    <div className="w-full lg:w-8/12 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <h2 className="text-lg font-bold mb-5 text-gray-800 uppercase tracking-wide">Đặc điểm nổi bật</h2>
                        
                        <div className="text-sm text-gray-700 leading-loose">
                            {isArticleExpanded ? (
                                // --- TRẠNG THÁI MỞ RỘNG (HIỂN THỊ XEN KẼ CHỮ VÀ ẢNH) ---
                                <div className="space-y-4 text-justify">
                                    {(() => {
                                        if (!product.detailed_article) return <p>Đang cập nhật thông tin bài viết.</p>;

                                        // 1. TÁCH DÒNG: Phân rã bài viết thành các dòng văn bản đơn lẻ, lọc sạch khoảng trắng thừa
                                        const lines = product.detailed_article.split('\n').map((l: string) => l.trim()).filter(Boolean);
                                        const images = product.infographic_images || [];
                                        
                                        // 2. TÍNH TOÁN BỐ CỤC: Phân bổ ảnh nằm đều xen kẽ vào giữa các khối text
                                        const step = Math.max(1, Math.floor(lines.length / (images.length || 1)));
                                        let imgIndex = 0;

                                        return (
                                            <>
                                                {lines.map((line: string, idx: number) => {
                                                    // Nhận diện tiêu đề phụ (chuỗi ngắn, chứa dấu ?)
                                                    const isSubHeading = (line.length < 120 && line.includes('?')) || line.startsWith('Đặc điểm');

                                                    return (
                                                        <React.Fragment key={idx}>
                                                            {isSubHeading ? (
                                                                <h3 className="text-base font-bold text-gray-900 mt-6 mb-3 pt-2 block">{line}</h3>
                                                            ) : (
                                                                <p className="text-sm text-gray-600 leading-relaxed mb-3">{line}</p>
                                                            )}

                                                            {/* Chèn ảnh xen kẽ đều đặn sau các khối text (Đã xóa padding p-2) */}
                                                            {idx > 0 && idx % step === 0 && imgIndex < images.length && (
                                                                <div className="my-6 flex justify-center bg-gray-50/50 rounded-xl border border-gray-100 overflow-hidden">
                                                                    <img 
                                                                        src={images[imgIndex++]} 
                                                                        alt={`${product.product_name} - Hình minh họa ${imgIndex}`} 
                                                                        className="w-full max-w-2xl h-auto rounded-lg object-contain shadow-sm"
                                                                        loading="lazy"
                                                                    />
                                                                </div>
                                                            )}
                                                        </React.Fragment>
                                                    );
                                                })}

                                                {/* Xả nốt những ảnh bổ sung nếu còn sót xuống cuối bài */}
                                                {imgIndex < images.length && (
                                                    <div className="flex flex-col gap-4 mt-6">
                                                        {images.slice(imgIndex).map((imgUrl: string, idx: number) => (
                                                            <div key={idx} className="flex justify-center bg-gray-50/50 rounded-xl border border-gray-100 overflow-hidden">
                                                                <img 
                                                                    src={imgUrl} 
                                                                    alt={`${product.product_name} - Hình bổ sung ${idx + 1}`} 
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
                                // --- TRẠNG THÁI THU GỌN (CHỈ HIỂN THỊ SHORT DESCRIPTION) ---
                                <div className="relative">
                                    <p className="text-justify text-sm text-gray-600 leading-relaxed">
                                        {product.short_description || "Đang cập nhật thông tin."}
                                    </p>
                                    {/* Lớp mờ (Gradient) tạo cảm giác bài viết còn dài */}
                                    <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
                                </div>
                            )}
                        </div>

                        {/* Nút Đọc thêm / Thu gọn bài viết */}
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

                {/* 5. SECTION ĐÁNH GIÁ TỪ KHÁCH HÀNG */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
                    <h2 className="text-lg font-bold mb-6 text-gray-800 uppercase tracking-wide flex items-center gap-2">
                        Đánh giá khách hàng <span className="text-sm font-normal text-gray-500 normal-case">({reviewCount} đánh giá)</span>
                    </h2>
                    
                    {product.customer_reviews && product.customer_reviews.length > 0 ? (
                        <div className="flex flex-col gap-6">
                            {product.customer_reviews.map((review: any, idx: number) => (
                                <div key={idx} className={`pb-6 ${idx !== product.customer_reviews.length - 1 ? 'border-b border-gray-100' : ''}`}>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-500 uppercase">
                                            {review.reviewer_name?.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm text-gray-800">{review.reviewer_name}</p>
                                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                                <div className="flex text-[#FFD400]">
                                                    {[1,2,3,4,5].map(star => (
                                                        <span key={star} className={star <= review.rating_stars ? "" : "text-gray-300"}>★</span>
                                                    ))}
                                                </div>
                                                <span>•</span>
                                                <span>{review.publish_date?.split(':')[0]}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-xl">
                                        {review.review_content || "Người dùng không để lại bình luận."}
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

            </main>
            {/* === MODAL POPUP: BẢNG THÔNG SỐ KỸ THUẬT CHI TIẾT ĐẦY ĐỦ === */}
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                        {/* Click ra ngoài vùng Modal để tự động đóng */}
                        <div className="absolute inset-0" onClick={() => setIsModalOpen(false)}></div>
                        
                        {/* Nội dung chính của Modal */}
                        <div className="bg-white rounded-2xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl relative z-10 animate-in zoom-in-95 duration-200">
                            
                            {/* Tiêu đề Modal */}
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

                            {/* Danh sách thông số chi tiết (Có Scrollbar dọc khi vượt quá khung) */}
                            <div className="overflow-y-auto p-6 space-y-1 custom-scrollbar">
                                {product.detailed_specs ? (
                                    Object.entries(product.detailed_specs).map(([key, value], idx) => (
                                        <div 
                                            key={idx} 
                                            className={`flex py-3.5 px-3 text-sm items-start rounded-lg
                                                ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
                                        >
                                            <span className="w-5/12 text-gray-500 font-medium pr-4 shrink-0">{key}</span>
                                            {/* Thêm whitespace-pre-line để tự động xuống dòng đẹp mắt cho các chuỗi chứa \n */}
                                            <span className="w-7/12 text-gray-800 font-semibold whitespace-pre-line text-left">
                                                {String(value)}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-gray-500 py-10">Không tìm thấy thông số kỹ thuật.</p>
                                )}
                            </div>

                            {/* Nút đóng chân trang */}
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