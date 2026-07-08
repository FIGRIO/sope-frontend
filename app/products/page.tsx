import Link from 'next/link';
import Header from "@/components/Header"; 
import ProductAddToCartButton from "@/components/ProductAddToCartButton";
import ProductFilterSidebar from "@/components/ProductFilterSidebar";
import ProductSortBar from "@/components/ProductSortBar";

type ProductSummary = {
    id: number;
    name: string;
    category?: string;
    brand?: string;
    price?: number;
};

type ProductCatalogItem = ProductSummary & {
    oldPrice?: number;
    mainThumbnail?: string;
    specs?: Record<string, string>;
    reviews?: Array<Record<string, unknown>>;
};

type ProductsApiResponse = {
    content?: ProductCatalogItem[];
    totalPages?: number;
};

type FilterOption = {
    label: string;
    value: string;
};

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
    const queryMinPrice = typeof resolvedParams.minPrice === 'string' ? parseInt(resolvedParams.minPrice, 10) || 0 : 0;
    const queryMaxPrice = typeof resolvedParams.maxPrice === 'string' ? parseInt(resolvedParams.maxPrice, 10) || 0 : 0;
    const rawSort = typeof resolvedParams.sort === 'string' ? resolvedParams.sort : 'popular';
    const querySort = rawSort === 'price-asc' || rawSort === 'price-desc' || rawSort === 'popular' ? rawSort : 'popular';
    const querySortBy = querySort === 'popular' ? 'ratingStars' : 'price';
    const querySortDir = querySort === 'price-desc' || querySort === 'popular' ? 'desc' : 'asc';
    
    const currentPage = typeof resolvedParams.page === 'string' ? Math.max(parseInt(resolvedParams.page, 10) - 1, 0) : 0;

    // 2. XÂY DỰNG URL GỌI BACKEND
    const backendUrl = new URL('http://localhost:8080/api/products');
    if (queryName) backendUrl.searchParams.set('keyword', queryName);
    if (queryCategory) backendUrl.searchParams.set('category', queryCategory);
    if (queryBrand) backendUrl.searchParams.set('brand', queryBrand);
    if (queryMinPrice) backendUrl.searchParams.set('minPrice', String(queryMinPrice));
    if (queryMaxPrice) backendUrl.searchParams.set('maxPrice', String(queryMaxPrice));
    
    backendUrl.searchParams.set('page', String(currentPage));
    backendUrl.searchParams.set('size', '9'); 
    backendUrl.searchParams.set('sortBy', querySortBy);
    backendUrl.searchParams.set('sortDir', querySortDir);

    // 3. GỌI API
    let filteredProducts: ProductCatalogItem[] = [];
    let totalPages = 1;
    let filterSourceProducts: ProductSummary[] = [];
    
    try {
        const res = await fetch(backendUrl.toString(), { cache: 'no-store' });
        if (res.ok) {
            const pagedResponse = (await res.json()) as ProductsApiResponse;
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
    try {
        const sourceCategories = queryCategory ? [queryCategory] : ["phone", "laptop", "tablet"];
        const filterResponses = await Promise.all(
            sourceCategories.map(async (category) => {
                const filterSourceUrl = new URL('http://localhost:8080/api/products');
                if (queryName) filterSourceUrl.searchParams.set('keyword', queryName);
                filterSourceUrl.searchParams.set('category', category);
                filterSourceUrl.searchParams.set('size', '100');
                filterSourceUrl.searchParams.set('sortBy', 'id');
                filterSourceUrl.searchParams.set('sortDir', 'asc');

                const res = await fetch(filterSourceUrl.toString(), { cache: 'no-store' });
                if (!res.ok) return [];
                const data = (await res.json()) as ProductsApiResponse;
                return data.content || [];
            })
        );
        filterSourceProducts = filterResponses.flat();
    } catch (error) {
        console.error("Không thể tải dữ liệu bộ lọc sản phẩm:", error);
    }

    const dynamicCategories = buildCategoryOptions(filterSourceProducts);
    const dynamicBrands = buildBrandOptions(filterSourceProducts);
    const prices = filterSourceProducts
        .map((product) => product.price ?? 0)
        .filter((price) => price > 0);
    const priceMin = prices.length ? Math.floor(Math.min(...prices) / 500000) * 500000 : 0;
    const priceMax = prices.length ? Math.ceil(Math.max(...prices) / 500000) * 500000 : 50000000;
    const currentUiParams = new URLSearchParams();
    if (queryName) currentUiParams.set('name', queryName);
    if (queryCategory) currentUiParams.set('category', queryCategory);
    if (queryBrand) currentUiParams.set('brand', queryBrand);
    if (queryMinPrice) currentUiParams.set('minPrice', String(queryMinPrice));
    if (queryMaxPrice) currentUiParams.set('maxPrice', String(queryMaxPrice));
    if (querySort) currentUiParams.set('sort', querySort);
    if (querySortBy) currentUiParams.set('sortBy', querySortBy);
    if (querySortDir) currentUiParams.set('sortDir', querySortDir);

    // 5. HÀM TẠO URL (Đã xử lý truyền đúng slug vào parameter)
    const createFilterUrl = (type: 'category' | 'brand' | 'page', value: string) => {
        const params = new URLSearchParams();
        if (queryName) params.set('name', queryName);
        if (queryCategory) params.set('category', queryCategory);
        if (queryBrand) params.set('brand', queryBrand);
        if (queryMinPrice) params.set('minPrice', String(queryMinPrice));
        if (queryMaxPrice) params.set('maxPrice', String(queryMaxPrice));
        if (querySort) params.set('sort', querySort);
        if (querySortBy) params.set('sortBy', querySortBy);
        if (querySortDir) params.set('sortDir', querySortDir);
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

    const formatPrice = (price?: number | string) => {
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
                        <ProductFilterSidebar
                            categories={dynamicCategories}
                            brands={dynamicBrands}
                            selectedCategory={queryCategory}
                            selectedBrand={queryBrand}
                            selectedMinPrice={queryMinPrice}
                            selectedMaxPrice={queryMaxPrice}
                            priceMin={priceMin}
                            priceMax={priceMax}
                            queryName={queryName}
                        />
                    </aside>

                    {/* === CỘT PHẢI: DANH SÁCH SẢN PHẨM === */}
                    <div className="flex-1">
                        {/* Thanh Sắp xếp */}
                        <ProductSortBar currentSort={querySort} queryString={currentUiParams.toString()} />

                        {/* LƯỚI SẢN PHẨM */}
                        {filteredProducts.length > 0 ? (
                            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:gap-5">
                                {filteredProducts.map((product, index) => {
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
                                            key={product.id || index}
                                            className="group relative flex cursor-pointer flex-col overflow-hidden rounded-xl bg-white shadow-sm border border-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-[#EE4D2D]/30"
                                        >
                                            <Link href={`/products/${product.id}`} className="flex flex-1 flex-col">
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
                                            <div className="bg-white px-4 pb-4">
                                                <ProductAddToCartButton productId={product.id} />
                                            </div>
                                        </div>
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

function buildCategoryOptions(products: ProductSummary[]): FilterOption[] {
    const labels: Record<string, string> = {
        phone: "Dien thoai",
        tablet: "May tinh bang",
        laptop: "Laptop",
    };

    return uniqueOptions(
        products
            .map((product) => product.category?.trim())
            .filter((value): value is string => Boolean(value))
            .map((value) => ({
                value,
                label: labels[value] ?? value,
            }))
    );
}

function buildBrandOptions(products: ProductSummary[]): FilterOption[] {
    return uniqueOptions(
        products
            .map((product) => normalizeBrand(product.brand) || inferBrandFromName(product.name))
            .filter((value): value is string => Boolean(value))
            .map((value) => ({
                value,
                label: value,
            }))
    ).slice(0, 12);
}

function uniqueOptions(options: FilterOption[]) {
    const map = new Map<string, FilterOption>();
    options.forEach((option) => {
        const key = option.value.toLowerCase();
        if (!map.has(key)) map.set(key, option);
    });
    return Array.from(map.values());
}

function normalizeBrand(brand?: string) {
    const trimmed = brand?.trim();
    return trimmed || "";
}

function inferBrandFromName(name: string) {
    const lowerName = name.toLowerCase();
    if (lowerName.includes("iphone")) return "iPhone (Apple)";
    if (lowerName.includes("ipad")) return "iPad (Apple)";
    if (lowerName.includes("macbook")) return "MacBook (Apple)";

    const knownBrand = [
        "Samsung",
        "OPPO",
        "Vivo",
        "Xiaomi",
        "realme",
        "HONOR",
        "Motorola",
        "Lenovo",
        "ASUS",
        "Acer",
        "MSI",
        "Dell",
        "HP",
    ].find((brand) => lowerName.includes(brand.toLowerCase()));
    if (knownBrand) return knownBrand;
    const normalized = name
        .replace(/^Điện thoại\s+/i, "")
        .replace(/^Máy tính bảng\s+/i, "")
        .replace(/^Laptop\s+/i, "")
        .trim();
    const first = normalized.split(/\s+/)[0] ?? "";

    if (!first || /^\d/.test(first)) return "";
    if (first.toLowerCase() === "ipad" || first.toLowerCase() === "iphone") return "Apple";
    return first.replace(/[(),]/g, "");
}
