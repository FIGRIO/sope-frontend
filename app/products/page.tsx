import Link from 'next/link';
import Header from "@/components/Header"; 

// Import dữ liệu từ 3 file JSON
import phoneData from '../data/data_phone.json'; 
import tabletData from '../data/data_tablet.json'; 
import laptopData from '../data/data_laptop.json';

export default async function ProductsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    // 1. LẤY TỪ KHÓA TÌM KIẾM TỪ URL
    const resolvedParams = await searchParams;
    const queryName = typeof resolvedParams.name === 'string' ? resolvedParams.name : '';

    // 2. CHUYỂN ĐỔI DỮ LIỆU VỀ DẠNG MẢNG
    const phones = Array.isArray(phoneData) ? phoneData : [phoneData];
    const tablets = Array.isArray(tabletData) ? tabletData : [tabletData];
    const laptops = Array.isArray(laptopData) ? laptopData : [laptopData]; 

    // 3. GỘP 3 MẢNG LẠI VỚI NHAU
    const allProducts: any[] = [...phones, ...tablets, ...laptops]; 

    // 4. LỌC SẢN PHẨM THEO TỪ KHÓA (Không phân biệt hoa thường)
    const filteredProducts = queryName
        ? allProducts.filter((product: any) =>
            product.product_name?.toLowerCase().includes(queryName.toLowerCase())
          )
        : allProducts;

    return (
        <div className="min-h-screen bg-[#F4F6F8]">
            {/* Header dùng chung */}
            <Header />

            {/* Khung nội dung chính */}
            <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

                {/* Breadcrumb (Đường dẫn) */}
                <div className="mb-6 flex items-center text-sm font-medium text-gray-500">
                    <Link href="/" className="cursor-pointer transition-colors hover:text-[#EE4D2D]">Trang chủ</Link>
                    <span className="mx-2 text-gray-400">{'>'}</span>
                    <span className="text-[#EE4D2D]">Sản phẩm {queryName ? `- Tìm kiếm: ${queryName}` : ""}</span>
                </div>

                <div className="flex gap-6">

                    {/* === CỘT TRÁI: SIDEBAR (BỘ LỌC TÌM KIẾM) === */}
                    <aside className="hidden w-[260px] shrink-0 lg:block">
                        <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
                            <h2 className="mb-6 text-sm font-bold text-gray-800 uppercase tracking-wide">
                                Bộ lọc tìm kiếm
                            </h2>

                            {/* Lọc theo Thương hiệu */}
                            <div className="mb-8">
                                <h3 className="mb-4 text-xs font-bold text-gray-800">Thương hiệu</h3>
                                <div className="flex flex-col gap-3 text-sm font-medium text-gray-600">
                                    <label className="flex cursor-pointer items-center gap-3 group">
                                        <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300 bg-[#EE4D2D] text-[#EE4D2D] focus:ring-[#EE4D2D]" />
                                        <span className="text-[#EE4D2D] transition-colors">Apple (45)</span>
                                    </label>
                                    <label className="flex cursor-pointer items-center gap-3 group">
                                        <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-[#EE4D2D] focus:ring-[#EE4D2D]" />
                                        <span className="group-hover:text-[#EE4D2D] transition-colors">Samsung (20)</span>
                                    </label>
                                    <label className="flex cursor-pointer items-center gap-3 group">
                                        <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-[#EE4D2D] focus:ring-[#EE4D2D]" />
                                        <span className="group-hover:text-[#EE4D2D] transition-colors">Xiaomi (12)</span>
                                    </label>
                                </div>
                            </div>

                            {/* Lọc theo Mức giá (Slider) */}
                            <div className="mb-8">
                                <h3 className="mb-2 text-xs font-bold text-gray-800">Mức giá</h3>
                                <p className="mb-4 text-xs font-bold text-[#EE4D2D]">10.10M - 20M</p>
                                <div className="relative flex h-1 w-full items-center rounded-full bg-gray-200">
                                    <div className="absolute left-[20%] right-[30%] h-full bg-[#EE4D2D]"></div>
                                    <div className="absolute left-[20%] h-3.5 w-3.5 -ml-1.5 rounded-full border-[2.5px] border-[#EE4D2D] bg-white shadow-sm cursor-pointer hover:scale-110 transition-transform"></div>
                                    <div className="absolute right-[30%] h-3.5 w-3.5 -mr-1.5 rounded-full border-[2.5px] border-[#EE4D2D] bg-white shadow-sm cursor-pointer hover:scale-110 transition-transform"></div>
                                </div>
                            </div>

                            {/* Lọc theo Dung lượng RAM */}
                            <div>
                                <h3 className="mb-4 text-xs font-bold text-gray-800">Dung lượng RAM</h3>
                                <div className="flex flex-wrap gap-2">
                                    <button className="rounded border border-[#EE4D2D] bg-orange-50/50 px-3 py-1.5 text-xs font-bold text-[#EE4D2D]">
                                        8GB
                                    </button>
                                    <button className="rounded border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-gray-300 hover:bg-gray-50">
                                        128GB
                                    </button>
                                </div>
                            </div>

                        </div>
                    </aside>

                    {/* === CỘT PHẢI: MAIN CONTENT (Sản phẩm) === */}
                    <div className="flex-1">

                        {/* Thanh Sắp xếp */}
                        <div className="mb-6 flex items-center gap-4 bg-white p-3 px-4 rounded-xl shadow-sm border border-gray-100">
                            <span className="text-sm font-medium text-gray-600">Sắp xếp theo</span>
                            <div className="flex gap-2 flex-wrap">
                                <button className="rounded bg-[#EE4D2D] px-4 py-1.5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600">
                                    Phổ biến
                                </button>
                                <button className="rounded border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-[#EE4D2D] hover:border-[#EE4D2D]/30">
                                    Mới nhất
                                </button>
                                <button className="rounded border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-[#EE4D2D] hover:border-[#EE4D2D]/30">
                                    Bán chạy
                                </button>
                                <button className="rounded border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-[#EE4D2D] hover:border-[#EE4D2D]/30">
                                    Giá thấp - cao
                                </button>
                            </div>
                        </div>

                        {/* === LƯỚI SẢN PHẨM THỰC TẾ (TỪ JSON) === */}
                        {filteredProducts.length > 0 ? (
                            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:gap-5">
                                {filteredProducts.map((product: any, index) => {
                                    // 1. Trích xuất CPU 
                                    const cpu = product.detailed_specs?.["Chip xử lý (CPU)"] || 
                                                product.detailed_specs?.["Vi xử lý (CPU)"] || 
                                                product.detailed_specs?.["Công nghệ CPU"] || "Đang cập nhật CPU";
                                                
                                    // 2. Trích xuất Màn hình 
                                    const screenTech = product.detailed_specs?.["Công nghệ màn hình"] || "";
                                    const screenSize = product.detailed_specs?.["Màn hình rộng"] || 
                                                       product.detailed_specs?.["Màn hình"] || 
                                                       product.detailed_specs?.["Kích thước màn hình"] || "";
                                    
                                    const cleanScreenSize = screenSize.split("-")[0].trim();
                                    const screenInfo = [cleanScreenSize, screenTech].filter(Boolean).join(", ") || "Đang cập nhật màn hình";
                                    
                                    const ram = product.detailed_specs?.["RAM"] || "";
                                    const storageOptions = product.storage_variants?.map((v: any) => v.storage_name) || [];

                                    // --- XỬ LÝ GIÁ (Đã được đơn giản hóa nhờ data chuẩn) ---
                                    let displayCurrentPrice = product.current_price || "Giá liên hệ";
                                    let displayOriginalPrice = product.original_price || "";
                                    let discountPercent = 0;

                                    // Tính % giảm giá nếu có cả giá hiện tại và giá gốc
                                    if (displayCurrentPrice && displayOriginalPrice && displayCurrentPrice !== "Giá liên hệ" && displayCurrentPrice !== displayOriginalPrice) {
                                        const currentStr = displayCurrentPrice.replace(/[^\d]/g, '');
                                        const originalStr = displayOriginalPrice.replace(/[^\d]/g, '');
                                        const currentNum = parseInt(currentStr, 10);
                                        const originalNum = parseInt(originalStr, 10);

                                        if (!isNaN(currentNum) && !isNaN(originalNum) && originalNum > 0 && originalNum > currentNum) {
                                            discountPercent = Math.round(((originalNum - currentNum) / originalNum) * 100);
                                        }
                                    } else {
                                        // Nếu giá bằng nhau thì không hiện giá gạch ngang
                                        displayOriginalPrice = "";
                                    }

                                    // --- XỬ LÝ ĐÁNH GIÁ ---
                                    const reviewCount = product.customer_reviews ? product.customer_reviews.length : 0;
                                    const avgRating = reviewCount > 0 
                                        ? product.customer_reviews.reduce((acc: number, curr: any) => acc + (curr.rating_stars || 5), 0) / reviewCount 
                                        : 0;

                                    return (
                                        <Link 
                                            href={`/products/${product.sku}`} 
                                            key={product.sku || index} 
                                            className="group relative flex cursor-pointer flex-col overflow-hidden rounded-xl bg-white shadow-sm border border-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-[#EE4D2D]/30"
                                        >
                                            {/* Ảnh sản phẩm */}
                                            <div className="aspect-square w-full bg-white relative overflow-hidden flex items-center justify-center p-4">
                                                {product.infographic_images && product.infographic_images.length > 0 ? (
                                                    <img 
                                                        src={product.infographic_images[0]} 
                                                        alt={product.product_name} 
                                                        className="object-cover h-full w-full rounded-lg transition-transform duration-300 group-hover:scale-105"
                                                    />
                                                ) : (
                                                    <span className="text-gray-300 text-sm font-medium">Không có ảnh</span>
                                                )}
                                            </div>

                                            {/* Thông tin sản phẩm */}
                                            <div className="flex flex-1 flex-col p-4 bg-white z-10 relative">
                                                <h3 className="mb-2 line-clamp-2 text-[15px] font-medium text-gray-900 group-hover:text-[#EE4D2D] transition-colors leading-snug">
                                                    {product.product_name}
                                                </h3>

                                                {/* Cấu hình rút gọn */}
                                                <div className="mt-1 mb-3 text-xs text-gray-500 space-y-1">
                                                    <p className="truncate">Chip {cpu}</p>
                                                    <p className="truncate">{screenInfo}</p>
                                                </div>

                                                {/* RAM / ROM Tags */}
                                                <div className="mb-3 flex flex-wrap gap-1.5">
                                                    {ram && (
                                                        <span className="inline-flex items-center rounded border border-gray-200 px-2 py-0.5 text-[11px] font-medium text-gray-600 bg-gray-50">
                                                            {ram}
                                                        </span>
                                                    )}
                                                    {storageOptions.map((storage: string, idx: number) => (
                                                        <span key={idx} className="inline-flex items-center rounded border border-gray-200 px-2 py-0.5 text-[11px] font-medium text-gray-600 bg-gray-50">
                                                            {storage}
                                                        </span>
                                                    ))}
                                                </div>

                                                {/* Khu vực Giá & Đánh giá */}
                                                <div className="flex flex-col mt-auto pt-2 border-t border-gray-100">
                                                    <span className="text-lg font-bold text-[#D0021C]">
                                                        {displayCurrentPrice}
                                                    </span>
                                                    
                                                    {/* Khu vực Giá gốc & Phần trăm giảm */}
                                                    <div className="flex items-center gap-2 mt-0.5 min-h-[20px]">
                                                        {discountPercent > 0 && displayOriginalPrice && (
                                                            <>
                                                                <span className="text-sm text-gray-400 line-through">
                                                                    {displayOriginalPrice}
                                                                </span>
                                                                <span className="text-xs font-medium text-[#D0021C] bg-[#FFF0F1] px-1 rounded">
                                                                    -{discountPercent}%
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>

                                                    {/* Cụm đánh giá sao */}
                                                    <div className="flex items-center gap-1 mt-1.5 text-[12px] text-gray-400">
                                                        <div className="flex text-[#FB6E2E]">
                                                            {[1, 2, 3, 4, 5].map((star) => (
                                                                <span key={star} className={star <= Math.round(avgRating) || reviewCount === 0 ? "text-[#FFD400]" : "text-gray-300"}>★</span>
                                                            ))}
                                                        </div>
                                                        <span>({reviewCount})</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl bg-white shadow-sm border border-gray-100">
                                <svg className="mb-4 h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <h3 className="text-sm font-bold text-gray-800">Không tìm thấy sản phẩm</h3>
                                <p className="mt-1 text-sm text-gray-500">Xin lỗi, chúng tôi không tìm thấy sản phẩm nào phù hợp với từ khóa "{queryName}".</p>
                            </div>
                        )}

                        {/* === PHÂN TRANG (Pagination) === */}
                        {filteredProducts.length > 0 && (
                            <div className="mt-10 flex items-center justify-center gap-2 pb-6">
                                {/* Nút Prev */}
                                <button className="flex h-8 w-8 items-center justify-center rounded border border-gray-200 bg-white text-gray-400 transition hover:bg-gray-50 hover:text-[#EE4D2D]">
                                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>

                                {/* Trang 1 (Active đỏ) */}
                                <button className="flex h-8 w-8 items-center justify-center rounded bg-[#EE4D2D] text-sm font-bold text-white shadow-sm">
                                    1
                                </button>

                                {/* Trang 2, 3 */}
                                <button className="flex h-8 w-8 items-center justify-center rounded border border-gray-200 bg-white text-sm font-medium text-gray-600 transition hover:border-[#EE4D2D]/30 hover:text-[#EE4D2D]">
                                    2
                                </button>
                                <button className="flex h-8 w-8 items-center justify-center rounded border border-gray-200 bg-white text-sm font-medium text-gray-600 transition hover:border-[#EE4D2D]/30 hover:text-[#EE4D2D]">
                                    3
                                </button>

                                {/* Nút Next */}
                                <button className="flex h-8 w-8 items-center justify-center rounded border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50 hover:text-[#EE4D2D]">
                                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        )}

                    </div>
                </div>
            </main>
        </div>
    );
}