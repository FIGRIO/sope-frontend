import Header from "@/components/Header";

export default function HomePage() {
  // Mảng danh mục lấy chuẩn theo hình Figma của bạn
  const categories = [
    "Điện thoại", "Laptop", "Phụ kiện", "Smartwatch", "Đồng hồ",
    "Tablet", "Máy cũ, Thu cũ", "Màn hình, Máy in", "Sim, Thẻ cào", "Dịch vụ tiện ích"
  ];

  // Mảng sản phẩm giả lập
  const mockProducts = Array.from({ length: 10 }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-[#F4F6F8]">
      {/* Header dùng chung */}
      <Header />

      {/* Khung nội dung chính */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* === KHỐI 1: DANH MỤC SẢN PHẨM === */}
        <section className="mb-8 rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-8">
            <h2 className="text-base font-bold text-gray-800 uppercase tracking-wide">Danh mục sản phẩm</h2>
            <div className="mt-2 h-[3px] w-20 bg-[#EE4D2D]"></div>
          </div>

          {/* Lưới 5 cột cho các vòng tròn danh mục */}
          <div className="grid grid-cols-2 gap-y-8 gap-x-4 sm:grid-cols-3 md:grid-cols-5">
            {categories.map((cat, index) => (
              <div key={index} className="group flex cursor-pointer flex-col items-center text-center">
                <div className="mb-3 flex h-[88px] w-[88px] items-center justify-center rounded-full bg-gray-50 transition-all duration-300 group-hover:shadow-md border border-gray-100 group-hover:border-[#EE4D2D]/40">
                  {/* Chỗ này sau sẽ chèn hình ảnh icon thực tế */}
                  <span className="text-xs text-gray-400">Icon</span>
                </div>
                <span className="text-sm font-medium text-gray-700 transition-colors group-hover:text-[#EE4D2D]">
                  {cat}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* === KHỐI 2: GỢI Ý RIÊNG CHO BẠN === */}
        <section className="rounded-xl bg-white p-6 shadow-sm">
          {/* Tiêu đề căn giữa */}
          <div className="mb-8 flex justify-center border-b border-gray-100 pb-4">
            <h2 className="text-lg font-bold text-[#EE4D2D] uppercase tracking-widest">
              Gợi ý riêng cho bạn
            </h2>
          </div>

          {/* Lưới sản phẩm (5 cột) */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:gap-5">
            {mockProducts.map((item) => (
              <div key={item} className="group relative flex cursor-pointer flex-col overflow-hidden rounded-xl bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg border border-gray-100 hover:border-[#EE4D2D]/50">

                {/* Khung ảnh sản phẩm */}
                <div className="aspect-square w-full bg-gray-50 relative overflow-hidden flex items-center justify-center p-4">
                  <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/[0.03]"></div>
                  <span className="text-gray-300 text-sm">Hình sản phẩm</span>
                </div>

                {/* Khung thông tin */}
                <div className="flex flex-1 flex-col justify-between p-4 bg-white">
                  <h3 className="mb-3 line-clamp-2 text-sm font-medium text-gray-700 transition-colors group-hover:text-[#EE4D2D] leading-relaxed">
                    Sản phẩm công nghệ mẫu {item} - Hàng chính hãng cao cấp
                  </h3>
                  <div className="mt-auto">
                    <span className="text-base font-bold text-[#EE4D2D]">20.000.000₫</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Nút Xem thêm căn giữa */}
          <div className="mt-10 flex justify-center pb-4">
            <button className="min-w-[200px] rounded border border-gray-300 bg-white px-8 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 active:scale-95 hover:border-gray-400">
              Xem thêm
            </button>
          </div>
        </section>

      </main>
    </div>
  );
}