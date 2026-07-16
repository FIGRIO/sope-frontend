"use client";

import { API_BASE_URL, getAccessToken } from "@/lib/auth";
import { formatVnd } from "@/lib/shop";
import Link from "next/link";
import { useEffect, useState } from "react";

type AdminStatsResponse = {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalReviews: number;
  totalRevenue: number;
};

type InventoryItem = {
  id: string;
  name: string;
  category: string;
  price: string;
  stock: number;
  status: "Còn hàng" | "Sắp hết hàng" | "Hết hàng";
};

/*
 * Bảng tồn kho vẫn đang là dữ liệu tĩnh của Dashboard cũ.
 * Sẽ thay bằng API inventory thật ở bước hoàn thiện Dashboard.
 */
const inventoryData: InventoryItem[] = [
  {
    id: "#F1024",
    name: "iPhone 15 Pro Max 256GB - Titan Tự nhiên",
    category: "Điện thoại",
    price: "29.990.000 đ",
    stock: 124,
    status: "Còn hàng",
  },
  {
    id: "#F1025",
    name: "Samsung Galaxy S24 Ultra - Đen",
    category: "Điện thoại",
    price: "31.990.000 đ",
    stock: 5,
    status: "Sắp hết hàng",
  },
  {
    id: "#F1026",
    name: "MacBook Air M3 13-inch 8GB/256GB",
    category: "Laptop",
    price: "27.590.000 đ",
    stock: 0,
    status: "Hết hàng",
  },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [statsError, setStatsError] = useState("");
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      const token = getAccessToken();

      if (!token) {
        setStatsError("Không tìm thấy phiên đăng nhập Admin.");
        setIsStatsLoading(false);
        return;
      }

      setStatsError("");
      setIsStatsLoading(true);

      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/stats`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`Không thể tải thống kê Admin (${response.status}).`);
        }

        setStats((await response.json()) as AdminStatsResponse);
      } catch (error) {
        setStatsError(
          error instanceof Error
            ? error.message
            : "Không thể tải thống kê Admin.",
        );
      } finally {
        setIsStatsLoading(false);
      }
    };

    void loadStats();
  }, []);

  const countFormatter = new Intl.NumberFormat("vi-VN");
  const loadingValue = isStatsLoading ? "Đang tải" : "0";

  const dashboardKpiData = [
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
  ];

  const todayText = new Intl.DateTimeFormat("vi-VN").format(new Date());

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Tổng quan Hệ thống
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Thống kê dữ liệu đến ngày{" "}
              <span className="font-semibold text-gray-700">{todayText}</span>
            </p>
          </div>

          <button
            type="button"
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            Xuất báo cáo
          </button>
        </div>

        {statsError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {statsError}
          </div>
        )}

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {dashboardKpiData.map((kpi) => (
            <div
              key={kpi.title}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
            >
              <div className="absolute right-0 top-0 -mr-4 -mt-4 h-24 w-24 rounded-bl-full bg-gradient-to-br from-gray-50 to-gray-100 transition-transform group-hover:scale-110" />

              <p className="relative z-10 mb-2 text-sm font-medium text-gray-500">
                {kpi.title}
              </p>

              <h3 className="relative z-10 mb-2 text-3xl font-extrabold text-gray-900">
                {kpi.value}
              </h3>

              <div className="relative z-10 flex items-center gap-2">
                <span
                  className={`rounded-md px-2 py-0.5 text-xs font-bold ${
                    kpi.isUp
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {kpi.change}
                </span>

                {kpi.note && (
                  <span className="text-xs font-bold text-red-500">
                    {kpi.note}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mb-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="mb-6 text-base font-bold text-gray-900">
            Thống kê Doanh thu (30 ngày gần nhất)
          </h3>

          <div className="relative h-[280px] w-full">
            <svg
              className="h-full w-full"
              viewBox="0 0 1000 280"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EE4D2D" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#EE4D2D" stopOpacity="0" />
                </linearGradient>
              </defs>

              <line
                x1="0"
                y1="20"
                x2="1000"
                y2="20"
                stroke="#F3F4F6"
                strokeWidth="1"
              />
              <line
                x1="0"
                y1="100"
                x2="1000"
                y2="100"
                stroke="#F3F4F6"
                strokeWidth="1"
              />
              <line
                x1="0"
                y1="180"
                x2="1000"
                y2="180"
                stroke="#F3F4F6"
                strokeWidth="1"
              />
              <line
                x1="0"
                y1="260"
                x2="1000"
                y2="260"
                stroke="#E5E7EB"
                strokeWidth="2"
              />

              <text x="0" y="24" fill="#9CA3AF" fontSize="12">
                150M
              </text>
              <text x="0" y="104" fill="#9CA3AF" fontSize="12">
                100M
              </text>
              <text x="0" y="184" fill="#9CA3AF" fontSize="12">
                50M
              </text>

              <path
                d="M50 200 L150 120 L250 180 L350 50 L450 160 L550 90 L650 140 L750 60 L850 110 L950 40 L950 260 L50 260 Z"
                fill="url(#chartGrad)"
              />
              <path
                d="M50 200 L150 120 L250 180 L350 50 L450 160 L550 90 L650 140 L750 60 L850 110 L950 40"
                fill="none"
                stroke="#EE4D2D"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 p-6">
            <h3 className="text-base font-bold text-gray-900">
              Quản lý số lượng tồn kho (Inventory)
            </h3>

            <Link
              href="/admin/inventory"
              className="text-sm font-bold text-[#EE4D2D] hover:underline"
            >
              Xem tất cả &gt;
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] border-collapse text-left">
              <thead>
                <tr className="bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Tên Sản phẩm</th>
                  <th className="px-6 py-4">Danh mục</th>
                  <th className="px-6 py-4 text-right">Giá bán</th>
                  <th className="px-6 py-4 text-right">Tồn kho</th>
                  <th className="px-6 py-4 text-center">Trạng thái</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {inventoryData.map((item) => (
                  <tr
                    key={item.id}
                    className="transition-colors hover:bg-gray-50/50"
                  >
                    <td className="px-6 py-4 font-medium text-gray-500">
                      {item.id}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {item.category}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold">
                      {item.price}
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      {item.stock}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                          item.status === "Còn hàng"
                            ? "bg-green-100 text-green-700"
                            : item.status === "Sắp hết hàng"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
