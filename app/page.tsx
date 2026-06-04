import Header from "@/components/Header";
import Link from 'next/link';
import phoneData from './data/data_phone.json'; 
import tabletData from './data/data_tablet.json'; 
import laptopData from './data/data_laptop.json';

export default function HomePage() {
  // Mảng danh mục lấy chuẩn theo hình Figma của bạn
  // Mảng danh mục lấy chuẩn theo hình Figma của bạn
  const categories = [
    "Điện thoại", "Laptop","Tablet"
  ];

  // 1. CHUYỂN ĐỔI DỮ LIỆU THỰC TẾ VÀ GIỚI HẠN HIỂN THỊ (Lấy 5 sản phẩm mỗi loại hiện lên trang chủ)
  const phones = (Array.isArray(phoneData) ? phoneData : [phoneData]).slice(0, 5);
  const tablets = (Array.isArray(tabletData) ? tabletData : [tabletData]).slice(0, 5);
  const laptops = (Array.isArray(laptopData) ? laptopData : [laptopData]).slice(0, 5);

  // 2. HÀM ĐỊNH DẠNG GIÁ TIỀN TIÊU CHUẨN ĐỒNG BỘ
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
  return (
    <div className="min-h-screen bg-[#F4F6F8]">
      {/* Header dùng chung */}
      <Header />

      {/* Khung nội dung chính */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* === KHỐI 1: DANH MỤC SẢN PHẨM === */}
        <section className="mb-10 flex flex-col items-center rounded-xl bg-white p-6 shadow-sm">
          
          {/* Tiêu đề căn giữa */}
          <div className="mb-8 flex flex-col items-center text-center">
            <h2 className="text-base font-bold text-gray-800 uppercase tracking-wide">Danh mục sản phẩm</h2>
            <div className="mt-2 h-[3px] w-20 bg-[#EE4D2D]"></div>
          </div>

          {/* Dùng flex-wrap và justify-center để ép toàn bộ nội dung căn giữa tuyệt đối */}
          <div className="flex w-full flex-wrap justify-center gap-x-6 gap-y-8 sm:gap-x-10 md:gap-x-12">
            {categories.map((cat, index) => (
              <Link 
                key={index} 
                href={`/products?category=${cat}`} 
                className="group flex cursor-pointer flex-col items-center text-center w-[100px] sm:w-[120px]"
              >
                
                {/* Vòng tròn Icon */}
                <div className="mb-3 flex h-[88px] w-[88px] items-center justify-center rounded-full bg-gray-50 transition-all duration-300 group-hover:shadow-md border border-gray-100 group-hover:border-[#EE4D2D]/40">
                  {/* Chỗ này sau sẽ chèn hình ảnh icon thực tế */}
                  <span className="text-xs text-gray-400">Icon</span>
                </div>
                
                {/* Chữ mô tả */}
                <span className="text-sm font-medium text-gray-700 transition-colors group-hover:text-[#EE4D2D] leading-tight">
                  {cat}
                </span>
                
              </Link>
            ))}
          </div>
          
        </section>
        {/* === KHỐI 2: PHÂN VÙNG SẢN PHẨM THEO LOẠI === */}
        
        {/* --- PHÂN VÙNG ĐIỆN THOẠI --- */}
        <section className="mb-10 rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-base font-bold text-gray-800 uppercase tracking-wide">Điện thoại nổi bật</h2>
            <div className="mt-2 h-[3px] w-20 bg-[#EE4D2D]"></div>
          </div>

          {/* Lưới sản phẩm Điện thoại */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:gap-5">
            {phones.map((product: any, index: number) => (
              <Link 
                href={`/products/${product.sku}`}
                key={product.sku || index}
                className="group relative flex cursor-pointer flex-col overflow-hidden rounded-lg border border-gray-100 hover:border-[#EE4D2D]/50 bg-white"
              >
                <div className="aspect-square w-full bg-gray-50 relative overflow-hidden flex items-center justify-center p-4">
                  <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/[0.03]"></div>
                  {product.infographic_images && product.infographic_images.length > 0 ? (
                    <img src={product.infographic_images[0]} alt={product.product_name} className="object-contain h-full w-full rounded-lg transition-transform duration-300 group-hover:scale-105" />
                  ) : (
                    <span className="text-gray-300 text-sm">Hình sản phẩm</span>
                  )}
                </div>
                <div className="flex flex-1 flex-col justify-between p-4 bg-white">
                  <h3 className="mb-3 line-clamp-2 text-sm font-medium text-gray-700 transition-colors group-hover:text-[#EE4D2D] leading-relaxed">
                    {product.product_name}
                  </h3>
                  <div className="mt-auto">
                    <span className="text-base font-bold text-[#EE4D2D]">{formatPrice(product.current_price)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Nút Xem thêm của Điện thoại */}
          <div className="mt-10 flex justify-center pb-2">
            <Link href="/products?category=Điện thoại">
              <button className="min-w-[200px] rounded border border-gray-300 bg-white px-8 py-2.5 text-sm font-medium text-gray-600 transition hover:border-[#EE4D2D] hover:text-[#EE4D2D]">
                Xem thêm Điện thoại
              </button>
            </Link>
          </div>
        </section>

        {/* --- PHÂN VÙNG LAPTOP --- */}
        <section className="mb-10 rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-base font-bold text-gray-800 uppercase tracking-wide">Laptop nổi bật</h2>
            <div className="mt-2 h-[3px] w-20 bg-[#EE4D2D]"></div>
          </div>

          {/* Lưới sản phẩm Laptop */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:gap-5">
            {laptops.map((product: any, index: number) => (
              <Link 
                href={`/products/${product.sku}`}
                key={product.sku || index}
                className="group relative flex cursor-pointer flex-col overflow-hidden rounded-lg border border-gray-100 hover:border-[#EE4D2D]/50 bg-white"
              >
                <div className="aspect-square w-full bg-gray-50 relative overflow-hidden flex items-center justify-center p-4">
                  <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/[0.03]"></div>
                  {product.infographic_images && product.infographic_images.length > 0 ? (
                    <img src={product.infographic_images[0]} alt={product.product_name} className="object-contain h-full w-full rounded-lg transition-transform duration-300 group-hover:scale-105" />
                  ) : (
                    <span className="text-gray-300 text-sm">Hình sản phẩm</span>
                  )}
                </div>
                <div className="flex flex-1 flex-col justify-between p-4 bg-white">
                  <h3 className="mb-3 line-clamp-2 text-sm font-medium text-gray-700 transition-colors group-hover:text-[#EE4D2D] leading-relaxed">
                    {product.product_name}
                  </h3>
                  <div className="mt-auto">
                    <span className="text-base font-bold text-[#EE4D2D]">{formatPrice(product.current_price)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Nút Xem thêm của Laptop */}
          <div className="mt-10 flex justify-center pb-2">
            <Link href="/products?category=Laptop">
              <button className="min-w-[200px] rounded border border-gray-300 bg-white px-8 py-2.5 text-sm font-medium text-gray-600 transition hover:border-[#EE4D2D] hover:text-[#EE4D2D]">
                Xem thêm Laptop
              </button>
            </Link>
          </div>
        </section>

        {/* --- PHÂN VÙNG TABLET (MÁY TÍNH BẢNG) --- */}
        <section className="mb-6 rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-base font-bold text-gray-800 uppercase tracking-wide">Máy tính bảng nổi bật</h2>
            <div className="mt-2 h-[3px] w-20 bg-[#EE4D2D]"></div>
          </div>

          {/* Lưới sản phẩm Máy tính bảng */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:gap-5">
            {tablets.map((product: any, index: number) => (
              <Link 
                href={`/products/${product.sku}`}
                key={product.sku || index}
                className="group relative flex cursor-pointer flex-col overflow-hidden rounded-lg border border-gray-100 hover:border-[#EE4D2D]/50 bg-white"
              >
                <div className="aspect-square w-full bg-gray-50 relative overflow-hidden flex items-center justify-center p-4">
                  <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/[0.03]"></div>
                  {product.infographic_images && product.infographic_images.length > 0 ? (
                    <img src={product.infographic_images[0]} alt={product.product_name} className="object-contain h-full w-full rounded-lg transition-transform duration-300 group-hover:scale-105" />
                  ) : (
                    <span className="text-gray-300 text-sm">Hình sản phẩm</span>
                  )}
                </div>
                <div className="flex flex-1 flex-col justify-between p-4 bg-white">
                  <h3 className="mb-3 line-clamp-2 text-sm font-medium text-gray-700 transition-colors group-hover:text-[#EE4D2D] leading-relaxed">
                    {product.product_name}
                  </h3>
                  <div className="mt-auto">
                    <span className="text-base font-bold text-[#EE4D2D]">{formatPrice(product.current_price)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Nút Xem thêm của Máy tính bảng */}
          <div className="mt-10 flex justify-center pb-2">
            <Link href="/products?category=Máy tính bảng">
              <button className="min-w-[200px] rounded border border-gray-300 bg-white px-8 py-2.5 text-sm font-medium text-gray-600 transition hover:border-[#EE4D2D] hover:text-[#EE4D2D]">
                Xem thêm Máy tính bảng
              </button>
            </Link>
          </div>
        </section>

      </main>
    </div>
  );
}