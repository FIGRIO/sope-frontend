import Header from "@/components/Header";
import Link from 'next/link';

// ==========================================
// 1. KHAI BÁO INTERFACE (Tránh lỗi any)
// ==========================================
interface Product {
  id: number;
  sku: string;
  name: string;
  price: number;
  mainThumbnail?: string;
  images?: string[];
}

// ==========================================
// 2. HÀM FETCH DỮ LIỆU TỪ SPRING BOOT
// ==========================================
async function getProductsByCategory(category: string): Promise<Product[]> {
  try {
    // Gọi API với size=5 để lấy đúng 5 sản phẩm nổi bật cho trang chủ
    const res = await fetch(`http://localhost:8080/api/products?category=${category}&size=5`, { 
      cache: 'no-store' // Đảm bảo luôn lấy dữ liệu mới nhất
    });
    
    if (!res.ok) return [];
    
    const data = await res.json();
    return data.content || [];
  } catch (error) {
    console.error(`Lỗi fetch data category ${category}:`, error);
    return [];
  }
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

// ==========================================
// 3. COMPONENT TRANG CHỦ (Server Component)
// ==========================================
export default async function HomePage() {
  // Mảng danh mục ánh xạ Tên hiển thị (Tiếng Việt) với Slug gọi API (Tiếng Anh)
  const categories = [
    { name: "Điện thoại", slug: "phone" },
    { name: "Laptop", slug: "laptop" },
    { name: "Tablet", slug: "tablet" }
  ];

  // FETCH DỮ LIỆU ĐỒNG THỜI CHO 3 DANH MỤC
  const [phones, laptops, tablets] = await Promise.all([
    getProductsByCategory('phone'),
    getProductsByCategory('laptop'),
    getProductsByCategory('tablet')
  ]);

  return (
    <div className="min-h-screen bg-[#F4F6F8]">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* === KHỐI 1: DANH MỤC SẢN PHẨM === */}
        <section className="mb-10 flex flex-col items-center rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-8 flex flex-col items-center text-center">
            <h2 className="text-base font-bold text-gray-800 uppercase tracking-wide">Danh mục sản phẩm</h2>
            <div className="mt-2 h-[3px] w-20 bg-[#EE4D2D]"></div>
          </div>

          <div className="flex w-full flex-wrap justify-center gap-x-6 gap-y-8 sm:gap-x-10 md:gap-x-12">
            {categories.map((cat, index) => (
              <Link 
                key={index} 
                href={`/products?category=${cat.slug}`} // Đã chuyển sang gọi bằng slug (phone, laptop...)
                className="group flex cursor-pointer flex-col items-center text-center w-[100px] sm:w-[120px]"
              >
                <div className="mb-3 flex h-[88px] w-[88px] items-center justify-center rounded-full bg-gray-50 transition-all duration-300 group-hover:shadow-md border border-gray-100 group-hover:border-[#EE4D2D]/40">
                  <span className="text-xs text-gray-400">Icon</span>
                </div>
                <span className="text-sm font-medium text-gray-700 transition-colors group-hover:text-[#EE4D2D] leading-tight">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
        
        {/* === KHỐI 2: ĐIỆN THOẠI NỔI BẬT === */}
        <section className="mb-10 rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-base font-bold text-gray-800 uppercase tracking-wide">Điện thoại nổi bật</h2>
            <div className="mt-2 h-[3px] w-20 bg-[#EE4D2D]"></div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:gap-5">
            {phones.map((product) => (
              <Link 
                href={`/products/${product.id}`} // Đã đổi thành id
                key={product.id} // Đã tối ưu key thành id
                className="group relative flex cursor-pointer flex-col overflow-hidden rounded-lg border border-gray-100 hover:border-[#EE4D2D]/50 bg-white"
              >
                <div className="aspect-square w-full bg-gray-50 relative overflow-hidden flex items-center justify-center p-4">
                  <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/[0.03]"></div>
                  {/* Sử dụng mainThumbnail thay cho img_url */}
                  {product.mainThumbnail ? (
                    <img src={product.mainThumbnail} alt={product.name} className="object-contain h-full w-full rounded-lg transition-transform duration-300 group-hover:scale-105" />
                  ) : product.images && product.images.length > 0 ? (
                    <img src={product.images[0]} alt={product.name} className="object-contain h-full w-full rounded-lg transition-transform duration-300 group-hover:scale-105" />
                  ) : (
                    <span className="text-gray-300 text-sm">Hình sản phẩm</span>
                  )}
                </div>
                <div className="flex flex-1 flex-col justify-between p-4 bg-white">
                  <h3 className="mb-3 line-clamp-2 text-sm font-medium text-gray-700 transition-colors group-hover:text-[#EE4D2D] leading-relaxed">
                    {product.name}
                  </h3>
                  <div className="mt-auto">
                    <span className="text-base font-bold text-[#EE4D2D]">{formatPrice(product.price)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-10 flex justify-center pb-2">
            <Link href="/products?category=phone">
              <button className="min-w-[200px] rounded border border-gray-300 bg-white px-8 py-2.5 text-sm font-medium text-gray-600 transition hover:border-[#EE4D2D] hover:text-[#EE4D2D]">
                Xem thêm Điện thoại
              </button>
            </Link>
          </div>
        </section>

        {/* === KHỐI 3: LAPTOP NỔI BẬT === */}
        <section className="mb-10 rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-base font-bold text-gray-800 uppercase tracking-wide">Laptop nổi bật</h2>
            <div className="mt-2 h-[3px] w-20 bg-[#EE4D2D]"></div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:gap-5">
            {laptops.map((product) => (
              <Link 
                href={`/products/${product.id}`} // Đã đổi thành id
                key={product.id} // Đã tối ưu key thành id
                className="group relative flex cursor-pointer flex-col overflow-hidden rounded-lg border border-gray-100 hover:border-[#EE4D2D]/50 bg-white"
              >
                <div className="aspect-square w-full bg-gray-50 relative overflow-hidden flex items-center justify-center p-4">
                  <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/[0.03]"></div>
                  {product.mainThumbnail ? (
                    <img src={product.mainThumbnail} alt={product.name} className="object-contain h-full w-full rounded-lg transition-transform duration-300 group-hover:scale-105" />
                  ) : product.images && product.images.length > 0 ? (
                    <img src={product.images[0]} alt={product.name} className="object-contain h-full w-full rounded-lg transition-transform duration-300 group-hover:scale-105" />
                  ) : (
                    <span className="text-gray-300 text-sm">Hình sản phẩm</span>
                  )}
                </div>
                <div className="flex flex-1 flex-col justify-between p-4 bg-white">
                  <h3 className="mb-3 line-clamp-2 text-sm font-medium text-gray-700 transition-colors group-hover:text-[#EE4D2D] leading-relaxed">
                    {product.name}
                  </h3>
                  <div className="mt-auto">
                    <span className="text-base font-bold text-[#EE4D2D]">{formatPrice(product.price)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-10 flex justify-center pb-2">
            <Link href="/products?category=laptop">
              <button className="min-w-[200px] rounded border border-gray-300 bg-white px-8 py-2.5 text-sm font-medium text-gray-600 transition hover:border-[#EE4D2D] hover:text-[#EE4D2D]">
                Xem thêm Laptop
              </button>
            </Link>
          </div>
        </section>

        {/* === KHỐI 4: TABLET NỔI BẬT === */}
        <section className="mb-6 rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-base font-bold text-gray-800 uppercase tracking-wide">Máy tính bảng nổi bật</h2>
            <div className="mt-2 h-[3px] w-20 bg-[#EE4D2D]"></div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:gap-5">
            {tablets.map((product) => (
              <Link
                href={`/products/${product.id}`} // Đã đổi thành id
                key={product.id} // Đã tối ưu key thành id
                className="group relative flex cursor-pointer flex-col overflow-hidden rounded-lg border border-gray-100 hover:border-[#EE4D2D]/50 bg-white"
              >
                <div className="aspect-square w-full bg-gray-50 relative overflow-hidden flex items-center justify-center p-4">
                  <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/[0.03]"></div>
                  {product.mainThumbnail ? (
                        <img src={product.mainThumbnail} alt={product.name} className="object-contain h-full w-full rounded-lg transition-transform duration-300 group-hover:scale-105" />
                      ) : product.images && product.images.length > 0 ? (
                        <img src={product.images[0]} alt={product.name} className="object-contain h-full w-full rounded-lg transition-transform duration-300 group-hover:scale-105" />
                      ) : (
                        <span className="text-gray-300 text-sm">Hình sản phẩm</span>
                      )}
                </div>
                <div className="flex flex-1 flex-col justify-between p-4 bg-white">
                  <h3 className="mb-3 line-clamp-2 text-sm font-medium text-gray-700 transition-colors group-hover:text-[#EE4D2D] leading-relaxed">
                    {product.name}
                  </h3>
                  <div className="mt-auto">
                    <span className="text-base font-bold text-[#EE4D2D]">{formatPrice(product.price)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-10 flex justify-center pb-2">
            <Link href="/products?category=tablet">
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