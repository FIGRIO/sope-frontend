import Link from 'next/link';
import Header from "@/components/Header"; 
import ProductCard from "@/components/ProductCard";
import type { ProductCatalogItem } from "@/components/ProductCard";
import ProductFilterSidebar from "@/components/ProductFilterSidebar";
import ProductSortBar from "@/components/ProductSortBar";
import { API_BASE_URL } from "@/lib/auth";

type ProductSummary = {
    id: number;
    name: string;
    category?: string;
    brand?: string;
    price?: number;
};

// ProductCatalogItem is imported from @/components/ProductCard

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
    const backendUrl = new URL('/api/products', API_BASE_URL);
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
    let catalogError = "";
    
    try {
        const res = await fetch(backendUrl.toString(), { cache: 'no-store' });
        if (res.ok) {
            const pagedResponse = (await res.json()) as ProductsApiResponse;
            filteredProducts = pagedResponse.content || [];
            totalPages = pagedResponse.totalPages || 1;
        } else {
            const errorDetail = await res.text(); 
            console.log("❌ CHI TIẾT LỖI TỪ BACKEND TRẢ VỀ:", errorDetail);
            catalogError = "Không thể tải danh sách sản phẩm. Vui lòng thử lại sau.";
        }
    } catch (error) {
        console.error("Lỗi kết nối tới Backend Spring Boot:", error);
        catalogError = "Không thể kết nối dịch vụ sản phẩm. Vui lòng kiểm tra Backend.";
    }

    // 4. Tải dữ liệu thật để dựng bộ lọc sidebar
    try {
        const sourceCategories = queryCategory ? [queryCategory] : ["phone", "laptop", "tablet"];
        const filterResponses = await Promise.all(
            sourceCategories.map(async (category) => {
                const filterSourceUrl = new URL('/api/products', API_BASE_URL);
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
                    <div className="min-w-0 flex-1">
                        {/* Thanh Sắp xếp */}
                        <ProductSortBar currentSort={querySort} queryString={currentUiParams.toString()} />

                        {/* LƯỚI SẢN PHẨM */}
                        {catalogError ? (
                            <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-8 text-center text-sm font-medium text-red-700">
                                {catalogError}
                            </div>
                        ) : filteredProducts.length > 0 ? (
                            <div className="grid auto-rows-fr grid-cols-2 items-stretch gap-4 lg:grid-cols-3 xl:gap-5">
                                {filteredProducts.map((product) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                    />
                                ))}
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
        phone: "Điện thoại",
        tablet: "Máy tính bảng",
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
