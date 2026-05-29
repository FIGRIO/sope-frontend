import Link from 'next/link';

export default function Header() {
    return (
        <header className="sticky top-0 z-50 bg-gradient-to-r from-[#EE4D2D] to-[#FFD400] shadow-md">
            <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between gap-8">

                    {/* Logo */}
                    <Link href="/" className="shrink-0 text-3xl font-extrabold tracking-tight text-white">
                        SOPE
                    </Link>

                    {/* Thanh Tìm kiếm */}
                    <div className="flex-1 max-w-3xl">
                        <div className="relative flex w-full items-center">
                            <input
                                type="text"
                                placeholder="Tìm kiếm sản phẩm, thương hiệu..."
                                className="w-full rounded-full border-none bg-white px-6 py-2.5 pr-12 text-sm text-gray-800 shadow-inner outline-none focus:ring-2 focus:ring-orange-300"
                            />
                            <button className="absolute right-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#EE4D2D] text-white transition hover:bg-orange-600">
                                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Giỏ hàng & Nút Đăng nhập/Đăng ký */}
                    <div className="flex shrink-0 items-center gap-6 text-white">
                        <Link href="/cart" className="relative transition hover:text-gray-100">
                            <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-[#EE4D2D] shadow">
                                3
                            </span>
                        </Link>
                        <div className="flex items-center gap-3 border-l border-white/40 pl-6 text-sm font-medium">
                            <Link href="/register" className="transition hover:underline">Đăng ký</Link>
                            <span className="opacity-60">|</span>
                            <Link href="/login" className="transition hover:underline">Đăng nhập</Link>
                        </div>
                    </div>

                </div>
            </div>
        </header>
    );
}