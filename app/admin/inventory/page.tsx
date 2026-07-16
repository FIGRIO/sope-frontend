"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import {
  getAdminProducts,
  type ProductResponse,
  type ProductStatus,
  type ProductVariantResponse,
} from "@/lib/admin-products";
import {
  bulkRestock,
  getInventoryOverview,
  restockProduct,
  restockVariant,
  setProductStock,
  updateMinStockLevel,
  updateProductStatus,
  type InventoryOverview,
} from "@/lib/admin-inventory";

const emptyOverview: InventoryOverview = {
  totalProducts: 0,
  activeProducts: 0,
  inStockProducts: 0,
  outOfStockProducts: 0,
  lowStockProducts: 0,
  inactiveProducts: 0,
};

type FilterKey = "ALL" | "LOW_STOCK" | "OUT_OF_STOCK" | "INACTIVE";
type ActionKind = "RESTOCK" | "SET_STOCK" | "MIN_STOCK";

type ActionState = {
  kind: ActionKind;
  product: ProductResponse;
} | null;

const statusLabels: Record<ProductStatus, string> = {
  ACTIVE: "Đang bán",
  INACTIVE: "Ngừng bán",
  OUT_OF_STOCK: "Hết hàng",
};

function stockOf(product: ProductResponse) {
  return Math.max(0, product.availableQuantity ?? 0);
}

function productImage(product: ProductResponse) {
  return product.mainThumbnail || product.imgUrl || product.images?.[0] || null;
}

async function loadAllProducts() {
  const first = await getAdminProducts({ page: 0, size: 100, sortBy: "id", sortDir: "desc" });
  if (first.totalPages <= 1) return first.content;

  const remainingPages = await Promise.all(
    Array.from({ length: first.totalPages - 1 }, (_, index) =>
      getAdminProducts({ page: index + 1, size: 100, sortBy: "id", sortDir: "desc" }),
    ),
  );
  return [first, ...remainingPages].flatMap((page) => page.content);
}

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [overview, setOverview] = useState<InventoryOverview>(emptyOverview);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("ALL");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkQuantity, setBulkQuantity] = useState("1");
  const [busyKey, setBusyKey] = useState("");
  const [action, setAction] = useState<ActionState>(null);
  const [actionValue, setActionValue] = useState("1");
  const [variantProduct, setVariantProduct] = useState<ProductResponse | null>(null);
  const [variantQuantities, setVariantQuantities] = useState<Record<number, string>>({});

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [overviewData, productData] = await Promise.all([
        getInventoryOverview(),
        loadAllProducts(),
      ]);
      setOverview(overviewData);
      setProducts(productData);
      setSelectedIds((current) => {
        const validIds = new Set(productData.map((product) => product.id));
        return new Set([...current].filter((id) => validIds.has(id)));
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Không thể tải dữ liệu tồn kho.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("vi");
    return products.filter((product) => {
      const status = product.status ?? "ACTIVE";
      const matchesFilter =
        filter === "ALL" ||
        (filter === "LOW_STOCK" && product.lowStock && stockOf(product) > 0) ||
        (filter === "OUT_OF_STOCK" && (status === "OUT_OF_STOCK" || stockOf(product) === 0)) ||
        (filter === "INACTIVE" && status === "INACTIVE");
      if (!matchesFilter) return false;
      if (!keyword) return true;
      return [product.name, product.sku, product.brand, product.category]
        .filter(Boolean)
        .some((value) => String(value).toLocaleLowerCase("vi").includes(keyword));
    });
  }, [filter, products, search]);

  const selectedVisible = filteredProducts.filter((product) => selectedIds.has(product.id));
  const allVisibleSelected =
    filteredProducts.length > 0 && filteredProducts.every((product) => selectedIds.has(product.id));

  const openAction = (kind: ActionKind, product: ProductResponse) => {
    setAction({ kind, product });
    setActionValue(kind === "SET_STOCK" ? String(stockOf(product)) : kind === "MIN_STOCK" ? "5" : "1");
  };

  const submitAction = async (event: FormEvent) => {
    event.preventDefault();
    if (!action) return;
    const value = Number(actionValue);
    const allowsZero = action.kind !== "RESTOCK";
    if (!Number.isInteger(value) || value < (allowsZero ? 0 : 1)) {
      toast.error(allowsZero ? "Số lượng phải là số nguyên không âm." : "Số lượng nhập phải lớn hơn 0.");
      return;
    }

    const key = `${action.kind}-${action.product.id}`;
    setBusyKey(key);
    try {
      if (action.kind === "RESTOCK") {
        await restockProduct(action.product.id, value);
        toast.success(`Đã nhập thêm ${value} sản phẩm.`);
      } else if (action.kind === "SET_STOCK") {
        await setProductStock(action.product.id, value);
        toast.success(`Đã đặt tồn kho thành ${value}.`);
      } else {
        await updateMinStockLevel(action.product.id, value);
        toast.success(`Đã cập nhật mức cảnh báo tối thiểu thành ${value}.`);
      }
      setAction(null);
      await loadData();
    } catch (submitError) {
      toast.error(submitError instanceof Error ? submitError.message : "Không thể cập nhật tồn kho.");
    } finally {
      setBusyKey("");
    }
  };

  const changeStatus = async (product: ProductResponse, status: ProductStatus) => {
    const key = `status-${product.id}`;
    setBusyKey(key);
    try {
      await updateProductStatus(product.id, status);
      toast.success(`Đã chuyển “${product.name}” sang ${statusLabels[status].toLowerCase()}.`);
      await loadData();
    } catch (statusError) {
      toast.error(statusError instanceof Error ? statusError.message : "Không thể đổi trạng thái.");
    } finally {
      setBusyKey("");
    }
  };

  const submitBulkRestock = async () => {
    const quantity = Number(bulkQuantity);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      toast.error("Số lượng nhập hàng loạt phải là số nguyên lớn hơn 0.");
      return;
    }
    if (selectedIds.size === 0) {
      toast.error("Hãy chọn ít nhất một sản phẩm.");
      return;
    }

    setBusyKey("bulk");
    try {
      await bulkRestock([...selectedIds].map((productId) => ({ productId, quantity })));
      toast.success(`Đã nhập thêm ${quantity} cho ${selectedIds.size} sản phẩm.`);
      setSelectedIds(new Set());
      await loadData();
    } catch (bulkError) {
      toast.error(bulkError instanceof Error ? bulkError.message : "Không thể nhập kho hàng loạt.");
    } finally {
      setBusyKey("");
    }
  };

  const submitVariantRestock = async (variant: ProductVariantResponse) => {
    const quantity = Number(variantQuantities[variant.id] ?? "1");
    if (!Number.isInteger(quantity) || quantity <= 0) {
      toast.error("Số lượng nhập variant phải là số nguyên lớn hơn 0.");
      return;
    }
    const key = `variant-${variant.id}`;
    setBusyKey(key);
    try {
      await restockVariant(variant.id, quantity);
      toast.success("Đã nhập kho biến thể.");
      setVariantProduct(null);
      await loadData();
    } catch (variantError) {
      toast.error(variantError instanceof Error ? variantError.message : "Không thể nhập kho biến thể.");
    } finally {
      setBusyKey("");
    }
  };

  return (
    <main className="space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#EE4D2D]">Kho hàng</p>
          <h1 className="mt-1 text-2xl font-extrabold text-gray-900">Quản lý tồn kho</h1>
          <p className="mt-1 text-sm text-gray-500">Theo dõi tồn khả dụng, nhập kho, đặt tồn và mức cảnh báo.</p>
        </div>
        <button
          type="button"
          onClick={() => void loadData()}
          disabled={loading}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          {loading ? "Đang tải..." : "Làm mới dữ liệu"}
        </button>
      </header>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <OverviewCard label="Tổng sản phẩm" value={overview.totalProducts} />
        <OverviewCard label="Đang bán" value={overview.activeProducts} />
        <OverviewCard label="Còn hàng" value={overview.inStockProducts} />
        <OverviewCard label="Sắp hết" value={overview.lowStockProducts} emphasis="warning" />
        <OverviewCard label="Hết hàng" value={overview.outOfStockProducts} emphasis="danger" />
        <OverviewCard label="Ngừng bán" value={overview.inactiveProducts} />
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 p-4 sm:p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap gap-2">
              {([
                ["ALL", "Tất cả"],
                ["LOW_STOCK", "Sắp hết"],
                ["OUT_OF_STOCK", "Hết hàng"],
                ["INACTIVE", "Ngừng bán"],
              ] as Array<[FilterKey, string]>).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value)}
                  className={`rounded-full px-4 py-2 text-sm font-bold transition ${filter === value ? "bg-[#EE4D2D] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm theo tên, SKU, thương hiệu..."
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-[#EE4D2D] xl:max-w-sm"
            />
          </div>

          <div className="mt-4 flex flex-col gap-3 rounded-xl bg-orange-50 p-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-orange-900">
              Đã chọn {selectedIds.size} sản phẩm{selectedVisible.length !== selectedIds.size ? " (một số nằm ngoài bộ lọc)" : ""}.
            </p>
            <div className="flex gap-2">
              <input
                value={bulkQuantity}
                onChange={(event) => setBulkQuantity(event.target.value)}
                inputMode="numeric"
                className="w-28 rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#EE4D2D]"
                aria-label="Số lượng nhập hàng loạt"
              />
              <button
                type="button"
                onClick={() => void submitBulkRestock()}
                disabled={busyKey === "bulk" || selectedIds.size === 0}
                className="rounded-lg bg-[#EE4D2D] px-4 py-2 text-sm font-bold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busyKey === "bulk" ? "Đang nhập..." : "Nhập hàng loạt"}
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={(event) => {
                      setSelectedIds((current) => {
                        const next = new Set(current);
                        filteredProducts.forEach((product) => event.target.checked ? next.add(product.id) : next.delete(product.id));
                        return next;
                      });
                    }}
                    aria-label="Chọn tất cả sản phẩm đang hiển thị"
                  />
                </th>
                <th className="px-4 py-3">Sản phẩm</th>
                <th className="px-4 py-3">Tồn khả dụng</th>
                <th className="px-4 py-3">Biến thể</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-500">Đang tải tồn kho...</td></tr>
              ) : filteredProducts.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-500">Không có sản phẩm phù hợp.</td></tr>
              ) : filteredProducts.map((product) => {
                const status = product.status ?? "ACTIVE";
                const stock = stockOf(product);
                const image = productImage(product);
                return (
                  <tr key={product.id} className="align-top hover:bg-gray-50/70">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(product.id)}
                        onChange={(event) => setSelectedIds((current) => {
                          const next = new Set(current);
                          event.target.checked ? next.add(product.id) : next.delete(product.id);
                          return next;
                        })}
                        aria-label={`Chọn ${product.name}`}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex min-w-[260px] items-center gap-3">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                          {image ? <img src={image} alt="" className="h-full w-full object-contain p-1" /> : null}
                        </div>
                        <div>
                          <p className="line-clamp-2 text-sm font-bold text-gray-900">{product.name}</p>
                          <p className="mt-1 text-xs text-gray-500">SKU: {product.sku || "—"} · ID: {product.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className={`text-lg font-extrabold ${stock === 0 ? "text-red-600" : product.lowStock ? "text-amber-600" : "text-emerald-600"}`}>{stock}</p>
                      <p className="text-xs text-gray-500">{product.lowStock ? "Đang dưới mức cảnh báo" : "Tồn kho bình thường"}</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700">
                      <button
                        type="button"
                        onClick={() => {
                          setVariantProduct(product);
                          setVariantQuantities({});
                        }}
                        disabled={!product.variants?.length}
                        className="font-bold text-blue-600 hover:text-blue-800 disabled:cursor-not-allowed disabled:text-gray-400"
                      >
                        {product.variants?.length ?? 0} biến thể
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <select
                        value={status}
                        disabled={busyKey === `status-${product.id}`}
                        onChange={(event) => void changeStatus(product, event.target.value as ProductStatus)}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 outline-none focus:border-[#EE4D2D]"
                      >
                        {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex min-w-[250px] flex-wrap justify-end gap-2">
                        <ActionButton onClick={() => openAction("RESTOCK", product)}>Nhập thêm</ActionButton>
                        <ActionButton onClick={() => openAction("SET_STOCK", product)}>Đặt tồn</ActionButton>
                        <ActionButton onClick={() => openAction("MIN_STOCK", product)}>Mức cảnh báo</ActionButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {action && (
        <Modal title={action.kind === "RESTOCK" ? "Nhập thêm hàng" : action.kind === "SET_STOCK" ? "Đặt tồn kho tuyệt đối" : "Cập nhật mức cảnh báo"} onClose={() => setAction(null)}>
          <form onSubmit={submitAction} className="space-y-4">
            <p className="text-sm text-gray-600"><span className="font-bold text-gray-900">{action.product.name}</span><br />Tồn khả dụng hiện tại: {stockOf(action.product)}</p>
            <input
              autoFocus
              required
              min={action.kind === "RESTOCK" ? 1 : 0}
              step={1}
              type="number"
              value={actionValue}
              onChange={(event) => setActionValue(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-[#EE4D2D]"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setAction(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700">Hủy</button>
              <button disabled={busyKey === `${action.kind}-${action.product.id}`} className="rounded-lg bg-[#EE4D2D] px-4 py-2 text-sm font-bold text-white disabled:opacity-60">Lưu thay đổi</button>
            </div>
          </form>
        </Modal>
      )}

      {variantProduct && (
        <Modal title={`Tồn kho biến thể — ${variantProduct.name}`} onClose={() => setVariantProduct(null)} wide>
          <div className="max-h-[65vh] space-y-3 overflow-y-auto pr-1">
            {(variantProduct.variants ?? []).map((variant) => (
              <div key={variant.id} className="grid gap-3 rounded-xl border border-gray-200 p-4 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                <div>
                  <p className="font-bold text-gray-900">{[variant.storageName, variant.colorName].filter(Boolean).join(" · ") || `Biến thể #${variant.id}`}</p>
                  <p className="mt-1 text-xs text-gray-500">SKU: {variant.sku || "—"} · Khả dụng: {variant.availableQuantity ?? 0} · Đã giữ: {variant.reservedQuantity ?? 0}</p>
                </div>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={variantQuantities[variant.id] ?? "1"}
                  onChange={(event) => setVariantQuantities((current) => ({ ...current, [variant.id]: event.target.value }))}
                  className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#EE4D2D]"
                />
                <button
                  type="button"
                  onClick={() => void submitVariantRestock(variant)}
                  disabled={busyKey === `variant-${variant.id}`}
                  className="rounded-lg bg-[#EE4D2D] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
                >
                  Nhập kho
                </button>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </main>
  );
}

function OverviewCard({ label, value, emphasis }: { label: string; value: number; emphasis?: "warning" | "danger" }) {
  const valueClass = emphasis === "danger" ? "text-red-600" : emphasis === "warning" ? "text-amber-600" : "text-gray-900";
  return <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><p className="text-xs font-bold uppercase tracking-wide text-gray-500">{label}</p><p className={`mt-2 text-2xl font-extrabold ${valueClass}`}>{value.toLocaleString("vi-VN")}</p></div>;
}

function ActionButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-gray-700 hover:border-[#EE4D2D] hover:text-[#EE4D2D]">{children}</button>;
}

function Modal({ title, children, onClose, wide = false }: { title: string; children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" onMouseDown={onClose}>
      <div className={`w-full ${wide ? "max-w-3xl" : "max-w-md"} rounded-2xl bg-white shadow-2xl`} onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4"><h2 className="font-extrabold text-gray-900">{title}</h2><button type="button" onClick={onClose} className="rounded-lg px-2 py-1 text-xl text-gray-500 hover:bg-gray-100">×</button></div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
