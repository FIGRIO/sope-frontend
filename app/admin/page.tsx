'use client';
import { API_BASE_URL, clearAuth, getStoredAuth, isAdminAuth, type AuthResponse } from '@/lib/auth';
import { formatVnd } from '@/lib/shop';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

type AdminStatsResponse = {
    totalUsers: number;
    totalProducts: number;
    totalOrders: number;
    totalReviews: number;
    totalRevenue: number;
};

// ==========================================
// 1. MOCK DATA (Dành cho Backend map API sau này)
// ==========================================
const kpiData = [
    { title: "Tổng Doanh thu", value: "1.25B đ", change: "+12.5%", isUp: true },
    { title: "Tài khoản Người dùng", value: "1,245", change: "+4.3%", isUp: true },
    { title: "Số lượng Sản phẩm", value: "342", change: "-2.1%", isUp: false, note: "23 Hết hàng" },
    { title: "Tổng Đơn hàng", value: "8,530", change: "+8.1%", isUp: true },
];

const inventoryData = [
    { id: "#F1024", name: "iPhone 15 Pro Max 256GB - Titan Tự nhiên", category: "Điện thoại", price: "29.990.000 đ", stock: 124, status: "Còn hàng" },
    { id: "#F1025", name: "Samsung Galaxy S24 Ultra - Đen", category: "Điện thoại", price: "31.990.000 đ", stock: 5, status: "Sắp hết hàng" },
    { id: "#F1026", name: "MacBook Air M3 13-inch 8GB/256GB", category: "Laptop", price: "27.590.000 đ", stock: 0, status: "Hết hàng" },
];

// ==========================================
// 2. COMPONENT SIDEBAR
// ==========================================
const Sidebar = () => (
    <aside className="fixed left-0 top-0 h-screen w-[260px] bg-gray-900 text-white flex flex-col z-50 shadow-xl">
        {/* Logo */}
        <div className="h-[80px] flex flex-col justify-center px-8 border-b border-gray-800 shrink-0">
            <h1 className="text-2xl font-extrabold tracking-widest text-white">SOPE</h1>
            <span className="text-[10px] text-gray-400 font-medium tracking-widest">ADMIN PORTAL</span>
        </div>

        {/* Menu */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 scrollbar-hide">
            {/* Main Menu */}
            <div>
                <p className="px-4 text-xs font-bold text-gray-500 uppercase mb-3">Main Menu</p>
                <ul className="space-y-1">
                    <li>
                        <Link href="/admin" className="flex items-center gap-3 bg-gradient-to-r from-[#EE4D2D] to-[#FFD400] text-white px-4 py-3 rounded-xl font-bold shadow-md">
                            <span className="w-5 h-5 bg-white/20 rounded-md flex items-center justify-center">❖</span>
                            Tổng quan (Dashboard)
                        </Link>
                    </li>
                    <li>
                        <Link href="/admin/products" className="flex items-center gap-3 text-gray-400 hover:text-white hover:bg-gray-800 px-4 py-3 rounded-xl font-medium transition-colors">
                            <span className="w-5 h-5 border-2 border-current rounded-md"></span>
                            Quản lý Sản phẩm
                        </Link>
                    </li>
                    <li>
                        <Link href="/admin/users" className="flex items-center gap-3 text-gray-400 hover:text-white hover:bg-gray-800 px-4 py-3 rounded-xl font-medium transition-colors">
                            <span className="w-5 h-5 border-2 border-current rounded-md"></span>
                            Quản lý Tài khoản
                        </Link>
                    </li>
                    <li>
                        <Link href="/admin/orders" className="flex items-center justify-between text-gray-400 hover:text-white hover:bg-gray-800 px-4 py-3 rounded-xl font-medium transition-colors">
                            <div className="flex items-center gap-3">
                                <span className="w-5 h-5 border-2 border-current rounded-md"></span>
                                Quản lý Đơn hàng
                            </div>
                            <span className="w-5 h-5 bg-red-500 text-white flex items-center justify-center rounded-full text-[10px] font-bold">5</span>
                        </Link>
                    </li>
                </ul>
            </div>

            {/* System & AI */}
            <div>
                <p className="px-4 text-xs font-bold text-gray-500 uppercase mb-3">System & AI</p>
                <ul className="space-y-1">
                    <li>
                        <Link href="/admin/chatbot" className="flex items-center gap-3 text-gray-400 hover:text-white hover:bg-gray-800 px-4 py-3 rounded-xl font-medium transition-colors">
                            <span className="w-5 h-5 border-2 border-current rounded-md"></span>
                            Cấu hình AI Chatbot
                        </Link>
                    </li>
                    <li>
                        <Link href="/admin/logs" className="flex items-center gap-3 text-gray-400 hover:text-white hover:bg-gray-800 px-4 py-3 rounded-xl font-medium transition-colors">
                            <span className="w-5 h-5 border-2 border-current rounded-md"></span>
                            Log & Báo cáo hệ thống
                        </Link>
                    </li>
                </ul>
            </div>
        </div>
    </aside>
);

// ==========================================
// 3. COMPONENT TOPBAR
// ==========================================
const TopBar = ({ auth, onLogout }: { auth: AuthResponse | null; onLogout: () => void }) => (
    <header className="h-[80px] bg-white flex items-center justify-between px-8 border-b border-gray-200 sticky top-0 z-40">
        {/* Search */}
        <div className="w-[400px]">
            <div className="relative flex items-center w-full h-10 rounded-full focus-within:shadow-lg bg-gray-100 overflow-hidden transition-shadow">
                <div className="grid place-items-center h-full w-12 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <input className="peer h-full w-full outline-none text-sm text-gray-700 bg-transparent pr-2" type="text" id="search" placeholder="Tìm kiếm đơn hàng, tên khách hàng..." />
            </div>
        </div>

        {/* Profile & Notifications */}
        <div className="flex items-center gap-6">
            <button className="relative p-2 text-gray-400 hover:text-[#EE4D2D] transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                <span className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
            <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
                <div className="w-10 h-10 rounded-full bg-gray-200 border-2 border-white shadow-sm overflow-hidden">
                    {auth?.avatarUrl ? (
                        <img src={auth.avatarUrl} alt={auth.fullName || auth.username || "Admin"} className="w-full h-full object-cover" />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-[#EE4D2D] text-sm font-black text-white">
                            {(auth?.fullName || auth?.username || "A").slice(0, 1).toUpperCase()}
                        </div>
                    )}
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-700">{auth?.fullName || auth?.username || "Admin"}</span>
                    <button type="button" onClick={onLogout} className="text-left text-xs font-semibold text-[#EE4D2D] hover:underline">
                        Đăng xuất
                    </button>
                </div>
            </div>
        </div>
    </header>
);

// ==========================================
// 4. MAIN PAGE (TỔNG HỢP)
// ==========================================
export default function AdminDashboard() {
    const router = useRouter();
    const [auth, setAuth] = useState<AuthResponse | null>(null);
    const [isChecking, setIsChecking] = useState(true);
    const [stats, setStats] = useState<AdminStatsResponse | null>(null);
    const [statsError, setStatsError] = useState("");
    const [isStatsLoading, setIsStatsLoading] = useState(false);

    useEffect(() => {
        const loadStats = async (token: string) => {
            setIsStatsLoading(true);
            setStatsError("");
            try {
                const response = await fetch(`${API_BASE_URL}/api/admin/stats`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (!response.ok) {
                    throw new Error(`Không thể tải thống kê admin (${response.status})`);
                }
                setStats((await response.json()) as AdminStatsResponse);
            } catch (err) {
                setStatsError(err instanceof Error ? err.message : "Không thể tải thống kê admin.");
            } finally {
                setIsStatsLoading(false);
            }
        };

        const timer = window.setTimeout(() => {
            const storedAuth = getStoredAuth();
            if (!storedAuth?.accessToken) {
                router.replace("/login");
                return;
            }
            if (!isAdminAuth(storedAuth)) {
                router.replace("/");
                return;
            }
            setAuth(storedAuth);
            setIsChecking(false);
            void loadStats(storedAuth.accessToken);
        }, 0);

        return () => window.clearTimeout(timer);
    }, [router]);

    const handleLogout = () => {
        clearAuth();
        router.replace("/login");
        router.refresh();
    };

    if (isChecking || !auth) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#F4F6F8] text-sm font-semibold text-gray-500">
                Đang kiểm tra quyền admin...
            </div>
        );
    }

    const countFormatter = new Intl.NumberFormat("vi-VN");
    const loadingValue = isStatsLoading ? "Đang tải" : "0";
    const dashboardKpiData = auth ? [
        {
            title: "Tổng doanh thu",
            value: stats ? formatVnd(stats.totalRevenue) : loadingValue,
            change: "Từ đơn đã thanh toán",
            isUp: true,
            note: statsError ? "Lỗi API" : undefined,
        },
        {
            title: "Tài khoản người dùng",
            value: stats ? countFormatter.format(stats.totalUsers) : loadingValue,
            change: "Dữ liệu hệ thống",
            isUp: true,
        },
        {
            title: "Số lượng sản phẩm",
            value: stats ? countFormatter.format(stats.totalProducts) : loadingValue,
            change: "Dữ liệu hệ thống",
            isUp: true,
        },
        {
            title: "Tổng đơn hàng",
            value: stats ? countFormatter.format(stats.totalOrders) : loadingValue,
            change: "Đã lưu trong hệ thống",
            isUp: true,
        },
    ] : kpiData;
    const todayText = new Intl.DateTimeFormat("vi-VN").format(new Date());

    return (
        <div className="min-h-screen bg-[#F4F6F8] font-sans">
            <Sidebar />

            <div className="ml-[260px] flex flex-col min-h-screen">
                <TopBar auth={auth} onLogout={handleLogout} />

                {/* Nội dung trang Dashboard */}
                <main className="flex-1 p-8">

                    {/* Tiêu đề & Nút thao tác */}
                    <div className="flex items-end justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Tổng quan Hệ thống</h2>
                            <p className="text-sm text-gray-500 mt-1">Thống kê dữ liệu đến ngày <span className="font-semibold text-gray-700">{todayText}</span></p>
                        </div>
                        <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-gray-50 transition-colors">
                            Xuất báo cáo
                        </button>
                    </div>

                    {/* Lưới KPI Cards */}
                    {statsError && (
                        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                            {statsError}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {dashboardKpiData.map((kpi, idx) => (
                            <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-gray-50 to-gray-100 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>

                                <p className="text-sm font-medium text-gray-500 mb-2 relative z-10">{kpi.title}</p>
                                <h3 className="text-3xl font-extrabold text-gray-900 mb-2 relative z-10">{kpi.value}</h3>

                                <div className="flex items-center gap-2 relative z-10">
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${kpi.isUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {kpi.change}
                                    </span>
                                    {kpi.note && <span className="text-xs font-bold text-red-500">{kpi.note}</span>}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Vùng Biểu đồ (Mô phỏng bằng CSS/SVG) */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
                        <h3 className="text-base font-bold text-gray-900 mb-6">Thống kê Doanh thu (30 ngày gần nhất)</h3>
                        <div className="h-[280px] w-full relative">
                            {/* Bạn cài thư viện Recharts hoặc Chart.js để thay thế khối SVG tĩnh này khi code thật nhé */}
                            <svg className="w-full h-full" viewBox="0 0 1000 280" preserveAspectRatio="none">
                                <defs>
                                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#EE4D2D" stopOpacity="0.2" />
                                        <stop offset="100%" stopColor="#EE4D2D" stopOpacity="0" />
                                    </linearGradient>
                                </defs>
                                {/* Grid lines */}
                                <line x1="0" y1="20" x2="1000" y2="20" stroke="#F3F4F6" strokeWidth="1" />
                                <line x1="0" y1="100" x2="1000" y2="100" stroke="#F3F4F6" strokeWidth="1" />
                                <line x1="0" y1="180" x2="1000" y2="180" stroke="#F3F4F6" strokeWidth="1" />
                                <line x1="0" y1="260" x2="1000" y2="260" stroke="#E5E7EB" strokeWidth="2" />
                                {/* Labels */}
                                <text x="0" y="24" fill="#9CA3AF" fontSize="12">150M</text>
                                <text x="0" y="104" fill="#9CA3AF" fontSize="12">100M</text>
                                <text x="0" y="184" fill="#9CA3AF" fontSize="12">50M</text>
                                {/* Area + Line */}
                                <path d="M50 200 L150 120 L250 180 L350 50 L450 160 L550 90 L650 140 L750 60 L850 110 L950 40 L950 260 L50 260 Z" fill="url(#chartGrad)" />
                                <path d="M50 200 L150 120 L250 180 L350 50 L450 160 L550 90 L650 140 L750 60 L850 110 L950 40" fill="none" stroke="#EE4D2D" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    </div>

                    {/* Vùng Bảng Tồn kho */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-base font-bold text-gray-900">Quản lý số lượng tồn kho (Inventory)</h3>
                            <Link href="/admin/inventory" className="text-sm font-bold text-[#EE4D2D] hover:underline">
                                Xem tất cả &gt;
                            </Link>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        <th className="px-6 py-4">ID</th>
                                        <th className="px-6 py-4">Tên Sản phẩm</th>
                                        <th className="px-6 py-4">Danh mục</th>
                                        <th className="px-6 py-4 text-right">Giá bán</th>
                                        <th className="px-6 py-4 text-right">Tồn kho</th>
                                        <th className="px-6 py-4 text-center">Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                                    {inventoryData.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-500">{item.id}</td>
                                            <td className="px-6 py-4 font-bold text-gray-900">{item.name}</td>
                                            <td className="px-6 py-4 text-gray-500">{item.category}</td>
                                            <td className="px-6 py-4 text-right font-semibold">{item.price}</td>
                                            <td className="px-6 py-4 text-right font-medium">{item.stock}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${item.status === 'Còn hàng' ? 'bg-green-100 text-green-700' :
                                                        item.status === 'Sắp hết hàng' ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-red-100 text-red-700'
                                                    }`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </main>
            </div>
        </div>
    );
}
