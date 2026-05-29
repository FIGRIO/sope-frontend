import Header from "@/components/Header";

export default function ProductsPage() {
    // Mảng dữ liệu giả để vẽ nhanh 9 thẻ sản phẩm (lưới 3 cột x 3 hàng)
    const mockProducts = Array.from({ length: 9 }, (_, i) => i + 1);

    return (
        <div className="min-h-screen bg-[#F4F6F8]">
            {/* Header dùng chung */}
            <Header />

            {/* Khung nội dung chính */}
            <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

                {/* Breadcrumb (Đường dẫn) */}
                <div className="mb-6 flex items-center text-sm font-medium text-gray-500">
                    <span className="cursor-pointer transition-colors hover:text-[#EE4D2D]">Trang chủ</span>
                    <span className="mx-2 text-gray-400">{'>'}</span>
                    <span className="text-[#EE4D2D]">Điện thoại thông minh</span>
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
                                        {/* Checkbox màu đỏ cho trạng thái đã chọn */}
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
                                {/* Thanh Slider giả lập */}
                                <div className="relative flex h-1 w-full items-center rounded-full bg-gray-200">
                                    <div className="absolute left-[20%] right-[30%] h-full bg-[#EE4D2D]"></div>
                                    {/* Nút kéo trái */}
                                    <div className="absolute left-[20%] h-3.5 w-3.5 -ml-1.5 rounded-full border-[2.5px] border-[#EE4D2D] bg-white shadow-sm cursor-pointer hover:scale-110 transition-transform"></div>
                                    {/* Nút kéo phải */}
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
                            <div className="flex gap-2">
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

                        {/* Lưới sản phẩm (Grid 3 cột chuẩn Figma) */}
                        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:gap-5">
                            {mockProducts.map((item) => (
                                <div key={item} className="group relative flex cursor-pointer flex-col overflow-hidden rounded-xl bg-white shadow-sm border border-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-[#EE4D2D]/30">

                                    {/* Ảnh sản phẩm */}
                                    <div className="aspect-square w-full bg-gray-50 relative overflow-hidden flex items-center justify-center p-4">
                                        {/* Badge Giảm giá màu cam đỏ giống Figma */}
                                        <div className="absolute top-2 left-2 bg-[#EE4D2D] text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm z-10">
                                            -15%
                                        </div>
                                        <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/[0.02]"></div>
                                        <span className="text-gray-300 text-sm font-medium">Hình {item}</span>
                                    </div>

                                    {/* Thông tin sản phẩm */}
                                    <div className="flex flex-1 flex-col justify-between p-4">
                                        <h3 className="mb-2 line-clamp-2 text-sm font-bold text-gray-800 group-hover:text-[#EE4D2D] transition-colors leading-relaxed">
                                            iPhone 15 Pro 128GB - Bản cao cấp chính hãng
                                        </h3>
                                        <div className="flex flex-col gap-1 mt-auto">
                                            <span className="text-base font-extrabold text-[#EE4D2D]">25.990.000 đ</span>
                                            {/* Cụm đánh giá sao */}
                                            <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-medium">
                                                <div className="flex text-[#FFD400] text-xs">
                                                    <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                                                </div>
                                                <span>(45)</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* === PHÂN TRANG (Pagination) === */}
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

                    </div>
                </div>
            </main>
        </div>
    );
}