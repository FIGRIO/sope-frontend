import Link from 'next/link';
import Header from "@/components/Header"; 

export default async function ProductsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    // 1. LẤY CÁC THAM SỐ LỌC TỪ URL
    const resolvedParams = await searchParams;
    const queryName = typeof resolvedParams.name === 'string' ? resolvedParams.name.trim() : '';
    const queryCategory = typeof resolvedParams.category === 'string' ? resolvedParams.category.trim() : '';
    const queryBrand = typeof resolvedParams.brand === 'string' ? resolvedParams.brand.trim() : '';
    
    const currentPage = typeof resolvedParams.page === 'string' ? Math.max(parseInt(resolvedParams.page, 10) - 1, 0) : 0;

    // 2. XÂY DỰNG URL GỌI BACKEND
    const backendUrl = new URL('http://localhost:8080/api/products');
    if (queryName) backendUrl.searchParams.set('keyword', queryName);
    if (queryCategory) backendUrl.searchParams.set('category', queryCategory);
    if (queryBrand) backendUrl.searchParams.set('brand', queryBrand);
    
    backendUrl.searchParams.set('page', String(currentPage));
    backendUrl.searchParams.set('size', '9'); 
    backendUrl.searchParams.set('sortBy', 'id');
    backendUrl.searchParams.set('sortDir', 'asc');

    // 3. GỌI API
    let filteredProducts: any[] = [];
    let totalPages = 1;
    
    try {
        const res = await fetch(backendUrl.toString(), { cache: 'no-store' });
        if (res.ok) {
            const pagedResponse = await res.json();
            filteredProducts = pagedResponse.content || [];
            totalPages = pagedResponse.totalPages || 1;
        } else {
            const errorDetail = await res.text(); 
            console.log("❌ CHI TIẾT LỖI TỪ BACKEND TRẢ VỀ:", errorDetail);
        }
    } catch (error) {
        console.error("Lỗi kết nối tới Backend Spring Boot:", error);
    }

    // 4. MOCK BỘ LỌC SIDEBAR (ĐÃ ĐƯỢC CHUẨN HOÁ SLUG)
    const dynamicCategories = [
        ["Điện thoại", "phone"],
        ["Máy tính bảng", "tablet"], // Sửa lại thành tablet
        ["Laptop", "laptop"]         // Sửa lại thành laptop
    ];

    // Kiểm tra queryCategory dựa trên slug ("laptop") thay vì tên tiếng Việt
    const dynamicBrands = queryCategory === "laptop" 
        ? [["Asus", "ASUS"], ["Macbook", "Apple"], ["Dell", "DELL"], ["HP", "HP"]]
        : [["iPhone", "Apple"], ["Samsung", "Samsung"], ["Xiaomi", "Xiaomi"], ["Oppo", "Oppo"]];

    const dynamicStorages = ["128GB", "256GB", "512GB", "1TB"];

    // 5. HÀM TẠO URL (Đã xử lý truyền đúng slug vào parameter)
    const createFilterUrl = (type: 'category' | 'brand' | 'storage' | 'page', value: string) => {
        const params = new URLSearchParams();
        if (queryName) params.set('name', queryName);
        if (queryCategory) params.set('category', queryCategory);
        if (queryBrand) params.set('brand', queryBrand);
        if (typeof resolvedParams.page === 'string') params.set('page', resolvedParams.page);

        if (type === 'category') {
            if (queryCategory === value) {
                // Nếu đang ở danh mục này mà bấm lại -> Huỷ lọc (Toggle off)
                params.delete('category'); 
            } else {
                params.set('category', value);
            }
            params.delete('brand'); 
            params.delete('page');  
        }
        if (type === 'brand') {
            if (queryBrand === value) {
                params.delete('brand');
            } else {
                params.set('brand', value);
            }
            params.delete('page');
        }
        if (type === 'page') {
            params.set('page', value);
        }

        return `?${params.toString()}`;
    };

    const formatPrice = (price: number | string) => {
        if (!price) return "Giá liên hệ";
        const num = typeof price === 'string' ? parseInt(price.replace(/[^\d]/g, ''), 10) : price;
        if (isNaN(num)) return "Giá liên hệ";
        return num.toLocaleString('vi-VN') + '₫';
    };

    return (
        <div className="min-h-screen bg-[#F4F6F8]">
            <Header />

            <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                {/* Breadcrumb */}
                <div className="mb-6 flex items-center text-sm font-medium text-gray-500">
                    <Link href="/" className="cursor-pointer transition-colors hover:text-[#EE4D2D]">Trang chủ</Link>
                    <span className="mx-2 text-gray-400">{'>'}</span>
                    <span className="text-[#EE4D2D]">Sản phẩm {queryName ? `- Tìm kiếm: ${queryName}` : ""}</span>
                </div>

                <div className="flex gap-6">
                    {/* === CỘT TRÁI: SIDEBAR === */}
                    <aside className="hidden w-[260px] shrink-0 lg:block">
                        <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
                            <h2 className="mb-6 text-sm font-bold text-gray-800 uppercase tracking-wide flex items-center justify-between">
                                Bộ lọc tìm kiếm
                                {(queryCategory || queryBrand) && (
                                    <Link href={queryName ? `?name=${queryName}` : "/products"} className="text-xs font-medium text-blue-500 hover:underline normal-case">
                                        Xóa lọc
                                    </Link>
                                )}
                            </h2>

                            {/* Lọc theo Danh mục */}
                            <div className="mb-8">
                                <h3 className="mb-4 text-xs font-bold text-gray-800">Danh mục</h3>
                                <div className="flex flex-col gap-3 text-sm font-medium">
                                    {dynamicCategories.map(([catName, value]) => {
                                        // ĐÃ SỬA: So sánh queryCategory với slug (value) thay vì catName
                                        const isChecked = queryCategory === value; 
                                        return (
                                            // ĐÃ SỬA: Truyền 'value' vào hàm tạo URL
                                            <Link key={value} href={createFilterUrl('category', value)} scroll={false} className="block group">
                                                <label className="flex cursor-pointer items-center gap-3">
                                                    <div className={`h-4 w-4 rounded flex items-center justify-center border transition-colors ${isChecked ? 'bg-[#EE4D2D] border-[#EE4D2D]' : 'bg-white border-gray-300 group-hover:border-[#EE4D2D]'}`}>
                                                        {isChecked && (
                                                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                                        )}
                                                    </div>
                                                    <span className={`${isChecked ? 'text-[#EE4D2D]' : 'text-gray-600 group-hover:text-[#EE4D2D]'} transition-colors`}>
                                                        {catName}
                                                    </span>
                                                </label>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Lọc theo Thương hiệu */}
                            <div className="mb-8">
                                <h3 className="mb-4 text-xs font-bold text-gray-800">Thương hiệu</h3>
                                <div className="flex flex-col gap-3 text-sm font-medium">
                                    {dynamicBrands.map(([brandName, value]) => {
                                        // ĐÃ SỬA: So sánh và truyền 'value' (slug) cho Thương hiệu
                                        const isChecked = queryBrand === value;
                                        return (
                                            <Link key={value} href={createFilterUrl('brand', value)} scroll={false} className="block group">
                                                <label className="flex cursor-pointer items-center gap-3">
                                                    <div className={`h-4 w-4 rounded flex items-center justify-center border transition-colors ${isChecked ? 'bg-[#EE4D2D] border-[#EE4D2D]' : 'bg-white border-gray-300 group-hover:border-[#EE4D2D]'}`}>
                                                        {isChecked && (
                                                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                                        )}
                                                    </div>
                                                    <span className={`${isChecked ? 'text-[#EE4D2D]' : 'text-gray-600 group-hover:text-[#EE4D2D]'} transition-colors`}>
                                                        {brandName}
                                                    </span>
                                                </label>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Bộ lọc dung lượng bộ nhớ */}
                            <div>
                                <h3 className="mb-4 text-xs font-bold text-gray-800">Phiên bản bộ nhớ</h3>
                                <div className="flex flex-wrap gap-2">
                                    {dynamicStorages.map((storageName) => (
                                        <button key={storageName} className="rounded border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-medium text-gray-600 hover:border-[#EE4D2D]/50 hover:text-[#EE4D2D] hover:bg-orange-50/30 transition-colors">
                                            {storageName}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* === CỘT PHẢI: DANH SÁCH SẢN PHẨM === */}
                    <div className="flex-1">
                        {/* Thanh Sắp xếp */}
                        <div className="mb-6 flex items-center gap-4 bg-white p-3 px-4 rounded-xl shadow-sm border border-gray-100">
                            <span className="text-sm font-medium text-gray-600">Sắp xếp theo</span>
                            <div className="flex gap-2 flex-wrap">
                                <button className="rounded bg-[#EE4D2D] px-4 py-1.5 text-sm font-bold text-white shadow-sm">Phổ biến</button>
                                <button className="rounded border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 hover:text-[#EE4D2D]">Mới nhất</button>
                                <button className="rounded border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 hover:text-[#EE4D2D]">Bán chạy</button>
                            </div>
                        </div>

                        {/* LƯỚI SẢN PHẨM */}
                        {filteredProducts.length > 0 ? (
                            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:gap-5">
                                {filteredProducts.map((product: any, index) => {
                                    const cpu = product.specs?.["Chip xử lý (CPU)"] || product.specs?.["Vi xử lý (CPU)"] || "Đang cập nhật";
                                    const screen = product.specs?.["Màn hình rộng"] || product.specs?.["Màn hình"] || "Đang cập nhật";
                                    const ram = product.specs?.["RAM"] || "";
                                    
                                    let discountPercent = 0;
                                    if (product.price && product.oldPrice && product.oldPrice > product.price) {
                                        discountPercent = Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100);
                                    }

                                    const reviewCount = product.reviews ? product.reviews.length : 0;

                                    return (
                                        <Link 
                                            href={`/products/${product.id}`}
                                            key={product.id || index}
                                            className="group relative flex cursor-pointer flex-col overflow-hidden rounded-xl bg-white shadow-sm border border-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-[#EE4D2D]/30"
                                        >
                                            <div className="aspect-square w-full bg-white relative overflow-hidden flex items-center justify-center p-4">
                                                {product.mainThumbnail ? (
                                                    <img src={product.mainThumbnail} alt={product.name} className="object-contain h-full w-full rounded-lg transition-transform duration-300 group-hover:scale-105" />
                                                ) : (
                                                    <span className="text-gray-300 text-sm">Hình sản phẩm</span>
                                                )}
                                            </div>

                                            <div className="flex flex-1 flex-col p-4 bg-white z-10 relative">
                                                <h3 className="mb-2 line-clamp-2 text-[15px] font-medium text-gray-900 group-hover:text-[#EE4D2D] transition-colors leading-snug">
                                                    {product.name}
                                                </h3>

                                                <div className="mt-1 mb-3 text-xs text-gray-500 space-y-1">
                                                    <p className="truncate">Chip: {cpu}</p>
                                                    <p className="truncate">Màn hình: {screen}</p>
                                                </div>

                                                <div className="mb-3 flex flex-wrap gap-1.5">
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
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl bg-white shadow-sm border border-gray-100">
                                <svg className="mb-4 h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <h3 className="text-sm font-bold text-gray-800">Không tìm thấy sản phẩm</h3>
                                <p className="mt-1 text-sm text-gray-500">Xin lỗi, chúng tôi không tìm thấy sản phẩm nào phù hợp bộ lọc của bạn.</p>
                            </div>
                        )}

                        {/* === THANH PHÂN TRANG ĐỘNG === */}
                        {totalPages > 1 && (
                            <div className="mt-10 flex items-center justify-center gap-2 pb-6">
                                {Array.from({ length: totalPages }).map((_, pageIdx) => {
                                    const pageNum = pageIdx + 1;
                                    const isActive = currentPage === pageIdx;
                                    return (
                                        <Link key={pageNum} href={createFilterUrl('page', String(pageNum))} scroll={true}>
                                            <button className={`flex h-8 w-8 items-center justify-center rounded text-sm font-bold transition-all ${
                                                isActive 
                                                ? 'bg-[#EE4D2D] text-white shadow-sm' 
                                                : 'border border-gray-200 bg-white text-gray-600 hover:border-[#EE4D2D]/30 hover:text-[#EE4D2D]'
                                            }`}>
                                                {pageNum}
                                            </button>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}