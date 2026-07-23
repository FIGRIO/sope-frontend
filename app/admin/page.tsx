"use client";

import { API_BASE_URL, getAccessToken } from "@/lib/auth";
import { parseJsonResponse } from "@/lib/api-response";
import {
  getAdminProducts,
  type ProductResponse,
} from "@/lib/admin-products";
import { formatVnd } from "@/lib/shop";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type AdminStatsResponse = {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalReviews: number;
  totalRevenue: number;
};

type RevenuePoint = {
  from: string;
  to: string;
  label: string;
  rangeLabel: string;
  revenue: number;
};

type InventoryStatus = "Còn hàng" | "Sắp hết hàng" | "Hết hàng";

type InventoryItem = {
  id: number;
  sku?: string | null;
  name: string;
  category: string;
  price?: number | null;
  stock: number;
  status: InventoryStatus;
};

const CHART_WIDTH = 1000;
const CHART_HEIGHT = 280;
const CHART_MARGIN = {
  top: 18,
  right: 24,
  bottom: 42,
  left: 72,
};

function padNumber(value: number) {
  return String(value).padStart(2, "0");
}

function formatLocalDateTime(date: Date, endOfDay = false) {
  const year = date.getFullYear();
  const month = padNumber(date.getMonth() + 1);
  const day = padNumber(date.getDate());
  const time = endOfDay ? "23:59:59" : "00:00:00";
  return `${year}-${month}-${day}T${time}`;
}

function formatShortDate(date: Date) {
  return `${padNumber(date.getDate())}/${padNumber(date.getMonth() + 1)}`;
}

function createRevenueBuckets() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const firstDay = new Date(today);
  firstDay.setDate(firstDay.getDate() - 29);

  return Array.from({ length: 10 }, (_, index) => {
    const fromDate = new Date(firstDay);
    fromDate.setDate(firstDay.getDate() + index * 3);

    const toDate = new Date(fromDate);
    toDate.setDate(fromDate.getDate() + 2);

    if (toDate.getTime() > today.getTime()) {
      toDate.setTime(today.getTime());
    }

    return {
      from: formatLocalDateTime(fromDate),
      to: formatLocalDateTime(toDate, true),
      label: formatShortDate(toDate),
      rangeLabel: `${formatShortDate(fromDate)} - ${formatShortDate(toDate)}`,
    };
  });
}

async function readErrorMessage(response: Response) {
  const fallback = `Yêu cầu thất bại (${response.status}).`;
  const text = await response.text();

  if (!text) return fallback;

  try {
    const payload = JSON.parse(text) as {
      message?: string;
      error?: string;
      detail?: string;
    };
    return payload.message || payload.error || payload.detail || fallback;
  } catch {
    return text;
  }
}

async function fetchAdminJson<T>(
  path: string,
  token: string,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
    signal,
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return parseJsonResponse<T>(response);
}

async function loadRevenueData(token: string, signal?: AbortSignal) {
  const buckets = createRevenueBuckets();

  const revenues = await Promise.all(
    buckets.map(async (bucket) => {
      const query = new URLSearchParams({
        from: bucket.from,
        to: bucket.to,
      });

      const value = await fetchAdminJson<number>(
        `/api/admin/dashboard/revenue?${query.toString()}`,
        token,
        signal,
      );

      return Math.max(0, Number(value) || 0);
    }),
  );

  return buckets.map<RevenuePoint>((bucket, index) => ({
    ...bucket,
    revenue: revenues[index],
  }));
}

async function loadAllProducts() {
  const firstPage = await getAdminProducts({
    page: 0,
    size: 100,
    sortBy: "id",
    sortDir: "desc",
  });

  if (firstPage.totalPages <= 1) {
    return firstPage.content;
  }

  const remainingPages = await Promise.all(
    Array.from({ length: firstPage.totalPages - 1 }, (_, index) =>
      getAdminProducts({
        page: index + 1,
        size: 100,
        sortBy: "id",
        sortDir: "desc",
      }),
    ),
  );

  return [firstPage, ...remainingPages].flatMap((page) => page.content);
}

function normalizeCategory(category?: string | null) {
  const normalized = category?.trim().toLocaleLowerCase("vi") ?? "";

  if (normalized === "phone" || normalized.includes("điện thoại")) {
    return "Điện thoại";
  }

  if (normalized === "tablet" || normalized.includes("máy tính bảng")) {
    return "Máy tính bảng";
  }

  if (normalized === "laptop" || normalized.includes("máy tính xách tay")) {
    return "Laptop";
  }

  return category?.trim() || "Chưa phân loại";
}

function getProductStock(product: ProductResponse) {
  return Math.max(0, Number(product.availableQuantity) || 0);
}

function getInventoryStatus(product: ProductResponse): InventoryStatus {
  const stock = getProductStock(product);

  if (product.status === "OUT_OF_STOCK" || stock <= 0) {
    return "Hết hàng";
  }

  if (product.lowStock) {
    return "Sắp hết hàng";
  }

  return "Còn hàng";
}

function buildInventoryPreview(products: ProductResponse[]) {
  return products
    .filter((product) => product.status !== "INACTIVE")
    .sort((left, right) => {
      const leftStatus = getInventoryStatus(left);
      const rightStatus = getInventoryStatus(right);
      const priority: Record<InventoryStatus, number> = {
        "Hết hàng": 0,
        "Sắp hết hàng": 1,
        "Còn hàng": 2,
      };

      const statusDifference = priority[leftStatus] - priority[rightStatus];
      if (statusDifference !== 0) return statusDifference;

      const stockDifference = getProductStock(left) - getProductStock(right);
      if (stockDifference !== 0) return stockDifference;

      return right.id - left.id;
    })
    .slice(0, 5)
    .map<InventoryItem>((product) => ({
      id: product.id,
      sku: product.sku,
      name: product.name,
      category: normalizeCategory(product.category),
      price: product.price,
      stock: getProductStock(product),
      status: getInventoryStatus(product),
    }));
}

function niceMaximum(value: number) {
  if (value <= 0) return 1_000_000;

  const exponent = 10 ** Math.floor(Math.log10(value));
  const fraction = value / exponent;
  const niceFraction =
    fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;

  return niceFraction * exponent;
}

function formatCompactVnd(value: number) {
  const compact = (number: number) =>
    new Intl.NumberFormat("vi-VN", {
      maximumFractionDigits: number >= 10 ? 0 : 1,
    }).format(number);

  if (value >= 1_000_000_000) return `${compact(value / 1_000_000_000)} tỷ`;
  if (value >= 1_000_000) return `${compact(value / 1_000_000)} tr`;
  if (value >= 1_000) return `${compact(value / 1_000)} nghìn`;
  return new Intl.NumberFormat("vi-VN").format(value);
}

function RevenueChart({
  data,
  loading,
}: {
  data: RevenuePoint[];
  loading: boolean;
}) {
  const chart = useMemo(() => {
    const plotWidth = CHART_WIDTH - CHART_MARGIN.left - CHART_MARGIN.right;
    const plotHeight = CHART_HEIGHT - CHART_MARGIN.top - CHART_MARGIN.bottom;
    const baselineY = CHART_MARGIN.top + plotHeight;
    const maxRevenue = Math.max(...data.map((point) => point.revenue), 0);
    const yMaximum = niceMaximum(maxRevenue);

    const points = data.map((point, index) => {
      const x =
        CHART_MARGIN.left +
        (data.length <= 1 ? plotWidth / 2 : (index / (data.length - 1)) * plotWidth);
      const y =
        CHART_MARGIN.top +
        plotHeight -
        (Math.min(point.revenue, yMaximum) / yMaximum) * plotHeight;

      return { ...point, x, y };
    });

    const linePath = points
      .map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`)
      .join(" ");

    const areaPath = points.length
      ? `${linePath} L${points.at(-1)?.x ?? CHART_MARGIN.left} ${baselineY} L${points[0].x} ${baselineY} Z`
      : "";

    const gridLines = Array.from({ length: 4 }, (_, index) => {
      const ratio = index / 3;
      return {
        y: CHART_MARGIN.top + ratio * plotHeight,
        value: yMaximum * (1 - ratio),
      };
    });

    return {
      areaPath,
      baselineY,
      gridLines,
      hasRevenue: maxRevenue > 0,
      linePath,
      points,
    };
  }, [data]);

  if (loading) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-xl bg-gray-50 text-sm font-semibold text-gray-500">
        Đang tải dữ liệu doanh thu thực tế...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-xl bg-gray-50 text-sm font-semibold text-gray-500">
        Chưa có dữ liệu doanh thu để hiển thị.
      </div>
    );
  }

  return (
    <div className="relative h-[280px] w-full">
      <svg
        className="h-full w-full"
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        preserveAspectRatio="none"
        role="img"
        aria-label="Biểu đồ doanh thu thực tế trong 30 ngày gần nhất"
      >
        <defs>
          <linearGradient id="dashboardRevenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#EE4D2D" stopOpacity="0.24" />
            <stop offset="100%" stopColor="#EE4D2D" stopOpacity="0" />
          </linearGradient>
        </defs>

        {chart.gridLines.map((line) => (
          <g key={line.y}>
            <line
              x1={CHART_MARGIN.left}
              y1={line.y}
              x2={CHART_WIDTH - CHART_MARGIN.right}
              y2={line.y}
              stroke="#E5E7EB"
              strokeWidth="1"
            />
            <text
              x={CHART_MARGIN.left - 10}
              y={line.y + 4}
              fill="#9CA3AF"
              fontSize="12"
              textAnchor="end"
            >
              {formatCompactVnd(line.value)}
            </text>
          </g>
        ))}

        {chart.areaPath && (
          <path d={chart.areaPath} fill="url(#dashboardRevenueGradient)" />
        )}

        {chart.linePath && (
          <path
            d={chart.linePath}
            fill="none"
            stroke="#EE4D2D"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {chart.points.map((point) => (
          <g key={`${point.from}-${point.to}`}>
            <circle
              cx={point.x}
              cy={point.y}
              r="5"
              fill="#FFFFFF"
              stroke="#EE4D2D"
              strokeWidth="3"
            >
              <title>{`${point.rangeLabel}: ${formatVnd(point.revenue)}`}</title>
            </circle>
            <text
              x={point.x}
              y={chart.baselineY + 24}
              fill="#9CA3AF"
              fontSize="11"
              textAnchor="middle"
            >
              {point.label}
            </text>
          </g>
        ))}
      </svg>

      {!chart.hasRevenue && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center pb-8 text-sm font-semibold text-gray-400">
          Chưa phát sinh doanh thu trong 30 ngày gần nhất.
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [revenueData, setRevenueData] = useState<RevenuePoint[]>([]);
  const [inventoryData, setInventoryData] = useState<InventoryItem[]>([]);

  const [statsError, setStatsError] = useState("");
  const [revenueError, setRevenueError] = useState("");
  const [inventoryError, setInventoryError] = useState("");

  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [isRevenueLoading, setIsRevenueLoading] = useState(true);
  const [isInventoryLoading, setIsInventoryLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const token = getAccessToken();

    if (!token) {
      const message = "Không tìm thấy phiên đăng nhập Admin.";
      void Promise.resolve().then(() => {
        setStatsError(message);
        setRevenueError(message);
        setInventoryError(message);
        setIsStatsLoading(false);
        setIsRevenueLoading(false);
        setIsInventoryLoading(false);
      });
      return () => controller.abort();
    }

    const loadStats = async () => {
      setStatsError("");
      setIsStatsLoading(true);

      try {
        const result = await fetchAdminJson<AdminStatsResponse>(
          "/api/admin/stats",
          token,
          controller.signal,
        );
        setStats(result);
      } catch (error) {
        if (controller.signal.aborted) return;
        setStatsError(
          error instanceof Error ? error.message : "Không thể tải thống kê Admin.",
        );
      } finally {
        if (!controller.signal.aborted) setIsStatsLoading(false);
      }
    };

    const loadRevenue = async () => {
      setRevenueError("");
      setIsRevenueLoading(true);

      try {
        setRevenueData(await loadRevenueData(token, controller.signal));
      } catch (error) {
        if (controller.signal.aborted) return;
        setRevenueError(
          error instanceof Error
            ? error.message
            : "Không thể tải dữ liệu doanh thu 30 ngày.",
        );
      } finally {
        if (!controller.signal.aborted) setIsRevenueLoading(false);
      }
    };

    const loadInventory = async () => {
      setInventoryError("");
      setIsInventoryLoading(true);

      try {
        const products = await loadAllProducts();
        if (!controller.signal.aborted) {
          setInventoryData(buildInventoryPreview(products));
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        setInventoryError(
          error instanceof Error
            ? error.message
            : "Không thể tải dữ liệu tồn kho.",
        );
      } finally {
        if (!controller.signal.aborted) setIsInventoryLoading(false);
      }
    };

    void Promise.resolve().then(() => Promise.all([
      loadStats(),
      loadRevenue(),
      loadInventory(),
    ]));

    return () => controller.abort();
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
          <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-base font-bold text-gray-900">
              Thống kê Doanh thu (30 ngày gần nhất)
            </h3>
            <span className="text-xs font-medium text-gray-400">
              Mỗi điểm là tổng doanh thu của 3 ngày
            </span>
          </div>

          {revenueError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {revenueError}
            </div>
          )}

          <RevenueChart data={revenueData} loading={isRevenueLoading} />
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 p-6">
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Quản lý số lượng tồn kho (Inventory)
              </h3>
              <p className="mt-1 text-xs text-gray-400">
                Ưu tiên hiển thị sản phẩm hết hàng và sắp hết hàng.
              </p>
            </div>

            <Link
              href="/admin/inventory"
              className="text-sm font-bold text-[#EE4D2D] hover:underline"
            >
              Xem tất cả &gt;
            </Link>
          </div>

          {inventoryError && (
            <div className="border-b border-red-200 bg-red-50 px-6 py-3 text-sm font-semibold text-red-700">
              {inventoryError}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] border-collapse text-left">
              <thead>
                <tr className="bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-4">ID/SKU</th>
                  <th className="px-6 py-4">Tên Sản phẩm</th>
                  <th className="px-6 py-4">Danh mục</th>
                  <th className="px-6 py-4 text-right">Giá bán</th>
                  <th className="px-6 py-4 text-right">Tồn kho</th>
                  <th className="px-6 py-4 text-center">Trạng thái</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {isInventoryLoading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-10 text-center font-semibold text-gray-500"
                    >
                      Đang tải tồn kho thực tế...
                    </td>
                  </tr>
                ) : inventoryData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-10 text-center font-semibold text-gray-500"
                    >
                      Chưa có sản phẩm tồn kho để hiển thị.
                    </td>
                  </tr>
                ) : (
                  inventoryData.map((item) => (
                    <tr
                      key={item.id}
                      className="transition-colors hover:bg-gray-50/50"
                    >
                      <td className="px-6 py-4 font-medium text-gray-500">
                        #{item.sku || item.id}
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900">
                        <Link
                          href="/admin/products"
                          className="hover:text-[#EE4D2D] hover:underline"
                        >
                          {item.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {item.category}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold">
                        {formatVnd(item.price)}
                      </td>
                      <td className="px-6 py-4 text-right font-medium">
                        {countFormatter.format(item.stock)}
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
