import React from 'react';
import Header from "@/components/Header";

export default function ProductDetailPage({ params }: { params: { id: string } }) {
    // Thực tế ở đây bạn sẽ gọi API fetch data dựa vào params.id
    // const product = await getProductById(params.id);

    return (
        <>
            {/* COMPONENT HEADER ĐƯỢC THÊM VÀO ĐÂY */}
            <Header />

            <main className="max-w-7xl mx-auto px-4 py-6 bg-gray-50">

                {/* 1. BREADCRUMB */}
                <nav className="text-sm text-gray-500 mb-6">
                    <span>Trang chủ</span> &gt; <span>Điện thoại</span> &gt; <span>Apple</span> &gt; <span className="font-semibold">iPhone 15 Pro Max</span>
                </nav>

                {/* 2. SECTION CHÍNH: ẢNH & THÔNG TIN SẢN PHẨM */}
                <div className="bg-white rounded-lg p-6 shadow-sm flex flex-col md:flex-row gap-8 mb-6">

                    {/* Cột trái: Ảnh sản phẩm (Gallery) */}
                    <div className="w-full md:w-5/12 flex flex-col items-center">
                        <div className="aspect-square w-full bg-gray-200 rounded-md mb-4 flex items-center justify-center text-gray-400">
                            Hình ảnh chính (1:1)
                        </div>
                        {/* List ảnh nhỏ */}
                        <div className="flex gap-2 w-full overflow-x-auto">
                            <div className="w-16 h-16 border-2 border-orange-500 rounded flex-shrink-0 cursor-pointer"></div>
                            <div className="w-16 h-16 bg-gray-200 rounded flex-shrink-0 cursor-pointer"></div>
                            <div className="w-16 h-16 bg-gray-200 rounded flex-shrink-0 cursor-pointer"></div>
                            <div className="w-16 h-16 bg-gray-200 rounded flex-shrink-0 cursor-pointer"></div>
                        </div>
                    </div>

                    {/* Cột phải: Thông tin, Giá, Chọn Mẫu, Action */}
                    <div className="w-full md:w-7/12">
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">Điện thoại iPhone 15 Pro Max</h1>
                        <div className="flex items-center gap-4 mb-4">
                            <span className="text-yellow-400 font-bold">4.9 ★★★★★</span>
                            <span className="text-gray-500 text-sm">Đã bán 1.2k</span>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-md mb-6">
                            <span className="text-3xl font-bold text-orange-600">29.990.000 ₫</span>
                            <span className="line-through text-gray-400 ml-3">34.990.000 ₫</span>
                            <span className="bg-orange-100 text-orange-600 text-xs px-2 py-1 ml-3 rounded">-14%</span>
                        </div>

                        {/* Các nút chọn biến thể (Màu sắc, Dung lượng) */}
                        <div className="mb-6">
                            {/* Thêm layout chọn màu, chọn bộ nhớ ở đây */}
                            <p className="font-semibold mb-2">Màu sắc:</p>
                            <div className="flex gap-3">
                                <button className="border-2 border-orange-500 text-orange-500 px-4 py-2 rounded-md">Titan Tự nhiên</button>
                                <button className="border border-gray-300 px-4 py-2 rounded-md">Titan Xanh</button>
                            </div>
                        </div>

                        {/* Khuyến mãi & Nút Action */}
                        <div className="flex gap-4 mt-8">
                            <button className="flex-1 bg-orange-100 text-orange-600 border border-orange-500 font-bold py-3 rounded-md hover:bg-orange-200 transition">
                                THÊM VÀO GIỎ HÀNG
                            </button>
                            <button className="flex-1 bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-bold py-3 rounded-md hover:opacity-90 transition">
                                MUA NGAY
                            </button>
                        </div>
                    </div>
                </div>

                {/* 3. SECTION MÔ TẢ & THÔNG SỐ (Chia 2 cột) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    <div className="lg:col-span-2 bg-white rounded-lg p-6 shadow-sm">
                        <h2 className="text-lg font-bold mb-4 uppercase">Đặc điểm nổi bật</h2>
                        <p className="text-gray-700 leading-relaxed mb-4">
                            iPhone 15 Pro Max là siêu phẩm mới nhất từ Apple với thiết kế khung viền Titan chuẩn hàng không vũ trụ...
                        </p>
                        <div className="w-full h-64 bg-gray-200 flex items-center justify-center text-gray-400 rounded-md">Banner Mô tả</div>
                    </div>

                    <div className="lg:col-span-1 bg-white rounded-lg p-6 shadow-sm">
                        <h2 className="text-lg font-bold mb-4 uppercase">Thông số kỹ thuật</h2>
                        <ul className="text-sm text-gray-700 space-y-3">
                            <li className="flex justify-between border-b pb-2">
                                <span className="text-gray-500 w-1/3">Màn hình:</span>
                                <span className="font-medium w-2/3 text-right">6.7 inch, Super Retina XDR</span>
                            </li>
                            <li className="flex justify-between border-b pb-2">
                                <span className="text-gray-500 w-1/3">Chip:</span>
                                <span className="font-medium w-2/3 text-right">Apple A17 Pro 6 nhân</span>
                            </li>
                            {/* Thêm các thông số khác */}
                        </ul>
                    </div>
                </div>

                {/* 4. SECTION ĐÁNH GIÁ SẢN PHẨM */}
                <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
                    <h2 className="text-lg font-bold mb-4 uppercase">Đánh giá sản phẩm</h2>
                    {/* Layout list review */}
                    <div className="border border-orange-200 bg-orange-50 p-6 rounded-md mb-4 flex items-center gap-8">
                        <div className="text-center">
                            <div className="text-4xl text-orange-500 font-bold">4.9 <span className="text-xl">trên 5</span></div>
                            <div className="text-yellow-400 text-xl mt-1">★★★★★</div>
                        </div>
                        {/* Các nút lọc đánh giá */}
                    </div>
                </div>

                {/* 5. SECTION GỢI Ý TỪ AI (Sản phẩm tương tự) */}
                <div className="bg-transparent rounded-lg p-6">
                    <h2 className="text-lg font-bold mb-4 uppercase">Sản phẩm tương tự (Gợi ý từ AI)</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Component Card Sản phẩm tái sử dụng từ trang chủ */}
                        <div className="h-64 bg-white rounded-md shadow-sm border border-gray-100 flex items-center justify-center text-gray-400">
                            Card Gợi ý 1
                        </div>
                        <div className="h-64 bg-white rounded-md shadow-sm border border-gray-100 flex items-center justify-center text-gray-400">
                            Card Gợi ý 2
                        </div>
                        <div className="h-64 bg-white rounded-md shadow-sm border border-gray-100 flex items-center justify-center text-gray-400">
                            Card Gợi ý 3
                        </div>
                        <div className="h-64 bg-white rounded-md shadow-sm border border-gray-100 flex items-center justify-center text-gray-400">
                            Card Gợi ý 4
                        </div>
                    </div>
                </div>

            </main>
        </>
    );
}