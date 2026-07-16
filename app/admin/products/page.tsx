/* eslint-disable @next/next/no-img-element */
"use client";

import {
  createAdminProduct,
  deleteAdminProduct,
  getAdminProducts,
  restockAdminProduct,
  updateAdminProduct,
  updateAdminProductStatus,
  type ProductRequestPayload,
  type ProductResponse,
  type ProductStatus,
} from "@/lib/admin-products";
import { formatVnd } from "@/lib/shop";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import toast from "react-hot-toast";

type FilterState = {
  keyword: string;
  category: string;
  brand: string;
  minPrice: string;
  maxPrice: string;
};

type ProductFormState = {
  sku: string;
  name: string;
  category: string;
  brand: string;
  price: string;
  oldPrice: string;
  mainThumbnail: string;
  url: string;
  shortDescription: string;
  description: string;
};

const emptyFilters: FilterState = {
  keyword: "",
  category: "",
  brand: "",
  minPrice: "",
  maxPrice: "",
};

const emptyProductForm: ProductFormState = {
  sku: "",
  name: "",
  category: "phone",
  brand: "",
  price: "",
  oldPrice: "",
  mainThumbnail: "",
  url: "",
  shortDescription: "",
  description: "",
};

const statusLabels: Record<ProductStatus, string> = {
  ACTIVE: "Đang bán",
  INACTIVE: "Ngừng bán",
  OUT_OF_STOCK: "Hết hàng",
};

const statusClasses: Record<ProductStatus, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  INACTIVE: "bg-gray-100 text-gray-600",
  OUT_OF_STOCK: "bg-red-100 text-red-700",
};

function toNumberOrUndefined(value: string) {
  const normalized = value.replace(/[^\d]/g, "");
  if (!normalized) return undefined;
  const numberValue = Number(normalized);
  return Number.isFinite(numberValue) ? numberValue : undefined;
}

function getProductImage(product: ProductResponse) {
  return (
    product.mainThumbnail ||
    product.imgUrl ||
    product.images?.find(Boolean) ||
    ""
  );
}

function buildRequestPayload(
  form: ProductFormState,
  currentProduct?: ProductResponse | null,
): ProductRequestPayload {
  const brand = form.brand.trim();

  return {
    sku: form.sku.trim() || undefined,
    product_name: form.name.trim(),
    category: form.category.trim() || undefined,
    mainThumbnail: form.mainThumbnail.trim() || undefined,
    brand: brand ? [[brand]] : [],
    short_description: form.shortDescription.trim() || undefined,
    detailed_article: form.description.trim() || undefined,
    current_price: form.price.trim() || undefined,
    original_price: form.oldPrice.trim() || undefined,
    url: form.url.trim() || undefined,
    infographic_images: currentProduct?.images ?? [],
    detailed_specs: currentProduct?.specs ?? {},
    storage_variants: currentProduct?.storageVariants ?? [],
    color_variants: currentProduct?.colorVariants ?? [],
    customer_reviews: currentProduct?.reviews ?? [],
  };
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [draftFilters, setDraftFilters] = useState<FilterState>(emptyFilters);
  const [filters, setFilters] = useState<FilterState>(emptyFilters);
  const [sortValue, setSortValue] = useState("id-desc");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [busyKey, setBusyKey] = useState("");

  const [detailProduct, setDetailProduct] = useState<ProductResponse | null>(null);
  const [editingProduct, setEditingProduct] = useState<ProductResponse | null>(null);
  const [productForm, setProductForm] = useState<ProductFormState>(emptyProductForm);
  const [productModalOpen, setProductModalOpen] = useState(false);

  const [stockProduct, setStockProduct] = useState<ProductResponse | null>(null);
  const [restockQuantity, setRestockQuantity] = useState("1");

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setPageError("");

    const [sortBy, sortDir] = sortValue.split("-") as [
      "id" | "name" | "price" | "sku" | "brand" | "category",
      "asc" | "desc",
    ];

    try {
      const data = await getAdminProducts({
        keyword: filters.keyword,
        category: filters.category,
        brand: filters.brand,
        minPrice: toNumberOrUndefined(filters.minPrice),
        maxPrice: toNumberOrUndefined(filters.maxPrice),
        page,
        size,
        sortBy,
        sortDir,
      });

      setProducts(data.content ?? []);
      setTotalElements(data.totalElements ?? 0);
      setTotalPages(Math.max(data.totalPages ?? 1, 1));

      if (page > 0 && page >= data.totalPages && data.totalPages > 0) {
        setPage(data.totalPages - 1);
      }
    } catch (error) {
      setProducts([]);
      setPageError(
        error instanceof Error
          ? error.message
          : "Không thể tải danh sách sản phẩm.",
      );
    } finally {
      setLoading(false);
    }
  }, [filters, page, refreshKey, size, sortValue]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const visiblePages = useMemo(() => {
    const pages: number[] = [];
    const start = Math.max(0, Math.min(page - 2, totalPages - 5));
    const end = Math.min(totalPages, start + 5);

    for (let index = start; index < end; index += 1) {
      pages.push(index);
    }
    return pages;
  }, [page, totalPages]);

  const refreshProducts = () => setRefreshKey((value) => value + 1);

  const applyFilters = (event: FormEvent) => {
    event.preventDefault();
    setPage(0);
    setFilters({ ...draftFilters });
    setRefreshKey((value) => value + 1);
  };

  const clearFilters = () => {
    setDraftFilters(emptyFilters);
    setFilters(emptyFilters);
    setPage(0);
    setRefreshKey((value) => value + 1);
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setProductForm(emptyProductForm);
    setProductModalOpen(true);
  };

  const openEditModal = (product: ProductResponse) => {
    setEditingProduct(product);
    setProductForm({
      sku: product.sku ?? "",
      name: product.name ?? "",
      category: product.category ?? "phone",
      brand: product.brand ?? "",
      price: product.price != null ? String(product.price) : "",
      oldPrice: product.oldPrice != null ? String(product.oldPrice) : "",
      mainThumbnail: product.mainThumbnail ?? product.imgUrl ?? "",
      url: product.url ?? "",
      shortDescription: product.shortDescription ?? "",
      description: product.description ?? "",
    });
    setProductModalOpen(true);
  };

  const saveProduct = async (event: FormEvent) => {
    event.preventDefault();

    if (!productForm.name.trim()) {
      toast.error("Tên sản phẩm không được để trống.");
      return;
    }

    const key = editingProduct ? `edit-${editingProduct.id}` : "create";
    setBusyKey(key);

    try {
      const payload = buildRequestPayload(productForm, editingProduct);

      if (editingProduct) {
        await updateAdminProduct(editingProduct.id, payload);
        toast.success("Đã cập nhật sản phẩm.");
      } else {
        await createAdminProduct(payload);
        toast.success("Đã tạo sản phẩm mới.");
      }

      setProductModalOpen(false);
      setEditingProduct(null);
      refreshProducts();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể lưu sản phẩm.",
      );
    } finally {
      setBusyKey("");
    }
  };

  const changeStatus = async (
    product: ProductResponse,
    status: ProductStatus,
  ) => {
    const key = `status-${product.id}`;
    setBusyKey(key);

    try {
      await updateAdminProductStatus(product.id, status);
      toast.success(`Đã chuyển sản phẩm sang “${statusLabels[status]}”.`);
      setProducts((items) =>
        items.map((item) =>
          item.id === product.id
            ? {
                ...item,
                status,
                inStock:
                  status === "ACTIVE"
                    ? (item.availableQuantity ?? 0) > 0
                    : false,
              }
            : item,
        ),
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể cập nhật trạng thái.",
      );
    } finally {
      setBusyKey("");
    }
  };

  const submitRestock = async (event: FormEvent) => {
    event.preventDefault();
    if (!stockProduct) return;

    const quantity = Number(restockQuantity);
    if (!Number.isInteger(quantity) || quantity < 1) {
      toast.error("Số lượng nhập phải là số nguyên lớn hơn 0.");
      return;
    }

    const key = `restock-${stockProduct.id}`;
    setBusyKey(key);

    try {
      const result = await restockAdminProduct(stockProduct.id, quantity);
      toast.success(`Đã nhập thêm ${quantity} sản phẩm.`);
      setProducts((items) =>
        items.map((item) =>
          item.id === stockProduct.id
            ? {
                ...item,
                availableQuantity: result.newStock,
                status: result.status as ProductStatus,
                inStock: result.newStock > 0,
                lowStock: false,
              }
            : item,
        ),
      );
      setStockProduct(null);
      setRestockQuantity("1");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể nhập thêm hàng.",
      );
    } finally {
      setBusyKey("");
    }
  };

  const removeProduct = async (product: ProductResponse) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa sản phẩm “${product.name}”?\n\n` +
        "Nếu sản phẩm đã phát sinh đơn hàng, Backend có thể từ chối do ràng buộc dữ liệu. " +
        "Trong trường hợp đó, nên chuyển sản phẩm sang trạng thái Ngừng bán.",
    );

    if (!confirmed) return;

    const key = `delete-${product.id}`;
    setBusyKey(key);

    try {
      await deleteAdminProduct(product.id);
      toast.success("Đã xóa sản phẩm.");
      refreshProducts();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể xóa sản phẩm.",
      );
    } finally {
      setBusyKey("");
    }
  };

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#EE4D2D]">
              Danh mục quản trị
            </p>
            <h1 className="mt-1 text-2xl font-extrabold text-gray-900">
              Quản lý Sản phẩm
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Có {new Intl.NumberFormat("vi-VN").format(totalElements)} sản phẩm
              trong hệ thống.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="rounded-xl bg-[#EE4D2D] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#d94326]"
          >
            + Thêm sản phẩm
          </button>
        </div>

        <form
          onSubmit={applyFilters}
          className="mb-6 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5"
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <input
              value={draftFilters.keyword}
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  keyword: event.target.value,
                }))
              }
              className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#EE4D2D] xl:col-span-2"
              placeholder="Tìm theo tên sản phẩm..."
            />

            <select
              value={draftFilters.category}
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  category: event.target.value,
                }))
              }
              className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#EE4D2D]"
            >
              <option value="">Tất cả danh mục</option>
              <option value="phone">Điện thoại</option>
              <option value="tablet">Máy tính bảng</option>
              <option value="laptop">Laptop</option>
            </select>

            <input
              value={draftFilters.brand}
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  brand: event.target.value,
                }))
              }
              className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#EE4D2D]"
              placeholder="Thương hiệu"
            />

            <input
              inputMode="numeric"
              value={draftFilters.minPrice}
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  minPrice: event.target.value,
                }))
              }
              className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#EE4D2D]"
              placeholder="Giá từ"
            />

            <input
              inputMode="numeric"
              value={draftFilters.maxPrice}
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  maxPrice: event.target.value,
                }))
              }
              className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#EE4D2D]"
              placeholder="Giá đến"
            />
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="submit"
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-bold text-white hover:bg-gray-800"
              >
                Áp dụng bộ lọc
              </button>
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50"
              >
                Xóa bộ lọc
              </button>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={sortValue}
                onChange={(event) => {
                  setSortValue(event.target.value);
                  setPage(0);
                }}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#EE4D2D]"
              >
                <option value="id-desc">Mới nhất</option>
                <option value="id-asc">Cũ nhất</option>
                <option value="name-asc">Tên A–Z</option>
                <option value="name-desc">Tên Z–A</option>
                <option value="price-asc">Giá tăng dần</option>
                <option value="price-desc">Giá giảm dần</option>
              </select>

              <select
                value={size}
                onChange={(event) => {
                  setSize(Number(event.target.value));
                  setPage(0);
                }}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#EE4D2D]"
              >
                <option value={10}>10 dòng</option>
                <option value={20}>20 dòng</option>
                <option value={50}>50 dòng</option>
              </select>
            </div>
          </div>
        </form>

        {pageError && (
          <div className="mb-4 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
            <span>{pageError}</span>
            <button
              type="button"
              onClick={refreshProducts}
              className="rounded-lg border border-red-200 bg-white px-3 py-2 font-bold hover:bg-red-100"
            >
              Thử lại
            </button>
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[1180px] w-full border-collapse text-left">
              <thead>
                <tr className="bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-500">
                  <th className="px-5 py-4">Sản phẩm</th>
                  <th className="px-5 py-4">SKU</th>
                  <th className="px-5 py-4">Danh mục</th>
                  <th className="px-5 py-4">Giá bán</th>
                  <th className="px-5 py-4 text-center">Tồn kho</th>
                  <th className="px-5 py-4 text-center">Biến thể</th>
                  <th className="px-5 py-4 text-center">Trạng thái</th>
                  <th className="px-5 py-4 text-right">Thao tác</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index}>
                      <td colSpan={8} className="px-5 py-4">
                        <div className="h-12 animate-pulse rounded-lg bg-gray-100" />
                      </td>
                    </tr>
                  ))
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-16 text-center">
                      <div className="text-4xl text-gray-300">▢</div>
                      <p className="mt-3 font-bold text-gray-700">
                        Không tìm thấy sản phẩm
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        Hãy thay đổi từ khóa hoặc bộ lọc đang sử dụng.
                      </p>
                    </td>
                  </tr>
                ) : (
                  products.map((product) => {
                    const status = product.status ?? "ACTIVE";
                    const image = getProductImage(product);
                    const stock = product.availableQuantity ?? 0;

                    return (
                      <tr
                        key={product.id}
                        className="transition-colors hover:bg-gray-50/70"
                      >
                        <td className="px-5 py-4">
                          <div className="flex min-w-[300px] items-center gap-3">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-white">
                              {image ? (
                                <img
                                  src={image}
                                  alt={product.name}
                                  className="h-full w-full object-contain p-1"
                                />
                              ) : (
                                <span className="text-[10px] text-gray-400">
                                  Không ảnh
                                </span>
                              )}
                            </div>

                            <div className="min-w-0">
                              <p
                                className="max-w-[360px] truncate font-bold text-gray-900"
                                title={product.name}
                              >
                                {product.name}
                              </p>
                              <p className="mt-1 text-xs text-gray-500">
                                ID #{product.id}
                                {product.brand ? ` · ${product.brand}` : ""}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 font-mono text-xs text-gray-600">
                          {product.sku || "—"}
                        </td>

                        <td className="px-5 py-4">
                          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                            {product.category || "Chưa phân loại"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-bold text-[#D0021C]">
                            {formatVnd(product.price)}
                          </p>
                          {product.oldPrice != null &&
                            product.price != null &&
                            product.oldPrice > product.price && (
                              <p className="mt-1 text-xs text-gray-400 line-through">
                                {formatVnd(product.oldPrice)}
                              </p>
                            )}
                        </td>

                        <td className="px-5 py-4 text-center">
                          <span
                            className={`font-bold ${
                              stock === 0
                                ? "text-red-600"
                                : product.lowStock
                                  ? "text-amber-600"
                                  : "text-gray-800"
                            }`}
                          >
                            {new Intl.NumberFormat("vi-VN").format(stock)}
                          </span>
                          {product.lowStock && stock > 0 && (
                            <p className="mt-1 text-[11px] font-semibold text-amber-600">
                              Sắp hết
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4 text-center font-semibold">
                          {product.variants?.length ?? 0}
                        </td>

                        <td className="px-5 py-4 text-center">
                          <select
                            value={status}
                            disabled={busyKey === `status-${product.id}`}
                            onChange={(event) =>
                              void changeStatus(
                                product,
                                event.target.value as ProductStatus,
                              )
                            }
                            className={`rounded-full border-0 px-3 py-1.5 text-xs font-bold outline-none disabled:opacity-50 ${statusClasses[status]}`}
                          >
                            <option value="ACTIVE">Đang bán</option>
                            <option value="INACTIVE">Ngừng bán</option>
                            <option value="OUT_OF_STOCK">Hết hàng</option>
                          </select>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setDetailProduct(product)}
                              className="rounded-lg px-2.5 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100"
                            >
                              Xem
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditModal(product)}
                              className="rounded-lg px-2.5 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50"
                            >
                              Sửa
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setStockProduct(product);
                                setRestockQuantity("1");
                              }}
                              className="rounded-lg px-2.5 py-2 text-xs font-bold text-green-700 hover:bg-green-50"
                            >
                              Nhập kho
                            </button>
                            <button
                              type="button"
                              disabled={busyKey === `delete-${product.id}`}
                              onClick={() => void removeProduct(product)}
                              className="rounded-lg px-2.5 py-2 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {!loading && products.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-500">
                Trang <strong>{page + 1}</strong> / {totalPages}
              </p>

              <div className="flex flex-wrap items-center gap-1">
                <button
                  type="button"
                  disabled={page === 0}
                  onClick={() => setPage((value) => Math.max(0, value - 1))}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Trước
                </button>

                {visiblePages.map((pageIndex) => (
                  <button
                    key={pageIndex}
                    type="button"
                    onClick={() => setPage(pageIndex)}
                    className={`h-9 w-9 rounded-lg text-sm font-bold ${
                      pageIndex === page
                        ? "bg-[#EE4D2D] text-white"
                        : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {pageIndex + 1}
                  </button>
                ))}

                <button
                  type="button"
                  disabled={page >= totalPages - 1}
                  onClick={() =>
                    setPage((value) => Math.min(totalPages - 1, value + 1))
                  }
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {productModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-6 py-4">
              <div>
                <h2 className="text-lg font-extrabold text-gray-900">
                  {editingProduct ? "Cập nhật sản phẩm" : "Thêm sản phẩm mới"}
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  Các thông số nâng cao và variant hiện được giữ nguyên khi sửa.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setProductModalOpen(false)}
                className="rounded-lg p-2 text-xl text-gray-400 hover:bg-gray-200 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={saveProduct}
              className="max-h-[calc(92vh-76px)] overflow-y-auto p-6"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="sm:col-span-2">
                  <span className="mb-1 block text-sm font-bold text-gray-700">
                    Tên sản phẩm *
                  </span>
                  <input
                    required
                    value={productForm.name}
                    onChange={(event) =>
                      setProductForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 outline-none focus:border-[#EE4D2D]"
                  />
                </label>

                <label>
                  <span className="mb-1 block text-sm font-bold text-gray-700">
                    SKU
                  </span>
                  <input
                    value={productForm.sku}
                    onChange={(event) =>
                      setProductForm((current) => ({
                        ...current,
                        sku: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 outline-none focus:border-[#EE4D2D]"
                  />
                </label>

                <label>
                  <span className="mb-1 block text-sm font-bold text-gray-700">
                    Danh mục
                  </span>
                  <select
                    value={productForm.category}
                    onChange={(event) =>
                      setProductForm((current) => ({
                        ...current,
                        category: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 outline-none focus:border-[#EE4D2D]"
                  >
                    <option value="phone">Điện thoại</option>
                    <option value="tablet">Máy tính bảng</option>
                    <option value="laptop">Laptop</option>
                  </select>
                </label>

                <label>
                  <span className="mb-1 block text-sm font-bold text-gray-700">
                    Thương hiệu
                  </span>
                  <input
                    value={productForm.brand}
                    onChange={(event) =>
                      setProductForm((current) => ({
                        ...current,
                        brand: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 outline-none focus:border-[#EE4D2D]"
                    placeholder="Apple, Samsung, ASUS..."
                  />
                </label>

                <label>
                  <span className="mb-1 block text-sm font-bold text-gray-700">
                    Giá bán
                  </span>
                  <input
                    inputMode="numeric"
                    value={productForm.price}
                    onChange={(event) =>
                      setProductForm((current) => ({
                        ...current,
                        price: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 outline-none focus:border-[#EE4D2D]"
                    placeholder="29990000"
                  />
                </label>

                <label>
                  <span className="mb-1 block text-sm font-bold text-gray-700">
                    Giá gốc
                  </span>
                  <input
                    inputMode="numeric"
                    value={productForm.oldPrice}
                    onChange={(event) =>
                      setProductForm((current) => ({
                        ...current,
                        oldPrice: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 outline-none focus:border-[#EE4D2D]"
                    placeholder="31990000"
                  />
                </label>

                <label className="sm:col-span-2">
                  <span className="mb-1 block text-sm font-bold text-gray-700">
                    Ảnh đại diện
                  </span>
                  <input
                    value={productForm.mainThumbnail}
                    onChange={(event) =>
                      setProductForm((current) => ({
                        ...current,
                        mainThumbnail: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 outline-none focus:border-[#EE4D2D]"
                    placeholder="https://..."
                  />
                </label>

                <label className="sm:col-span-2">
                  <span className="mb-1 block text-sm font-bold text-gray-700">
                    URL nguồn
                  </span>
                  <input
                    value={productForm.url}
                    onChange={(event) =>
                      setProductForm((current) => ({
                        ...current,
                        url: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 outline-none focus:border-[#EE4D2D]"
                  />
                </label>

                <label className="sm:col-span-2">
                  <span className="mb-1 block text-sm font-bold text-gray-700">
                    Mô tả ngắn
                  </span>
                  <textarea
                    value={productForm.shortDescription}
                    onChange={(event) =>
                      setProductForm((current) => ({
                        ...current,
                        shortDescription: event.target.value,
                      }))
                    }
                    rows={3}
                    className="w-full resize-y rounded-xl border border-gray-200 px-3 py-2.5 outline-none focus:border-[#EE4D2D]"
                  />
                </label>

                <label className="sm:col-span-2">
                  <span className="mb-1 block text-sm font-bold text-gray-700">
                    Mô tả chi tiết
                  </span>
                  <textarea
                    value={productForm.description}
                    onChange={(event) =>
                      setProductForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    rows={6}
                    className="w-full resize-y rounded-xl border border-gray-200 px-3 py-2.5 outline-none focus:border-[#EE4D2D]"
                  />
                </label>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-5">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="rounded-xl bg-gray-100 px-5 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-200"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={
                    busyKey === "create" ||
                    busyKey === `edit-${editingProduct?.id}`
                  }
                  className="rounded-xl bg-[#EE4D2D] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#d94326] disabled:opacity-60"
                >
                  {busyKey === "create" ||
                  busyKey === `edit-${editingProduct?.id}`
                    ? "Đang lưu..."
                    : "Lưu sản phẩm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {stockProduct && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <form
            onSubmit={submitRestock}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <h2 className="text-lg font-extrabold text-gray-900">
              Nhập thêm tồn kho
            </h2>
            <p className="mt-2 text-sm text-gray-500">{stockProduct.name}</p>
            <p className="mt-1 text-xs text-gray-400">
              Tồn khả dụng hiện tại: {stockProduct.availableQuantity ?? 0}
            </p>

            <label className="mt-5 block">
              <span className="mb-1 block text-sm font-bold text-gray-700">
                Số lượng nhập thêm
              </span>
              <input
                required
                type="number"
                min={1}
                step={1}
                value={restockQuantity}
                onChange={(event) => setRestockQuantity(event.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 outline-none focus:border-[#EE4D2D]"
              />
            </label>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setStockProduct(null)}
                className="rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-200"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={busyKey === `restock-${stockProduct.id}`}
                className="rounded-xl bg-green-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-60"
              >
                {busyKey === `restock-${stockProduct.id}`
                  ? "Đang nhập..."
                  : "Xác nhận nhập kho"}
              </button>
            </div>
          </form>
        </div>
      )}

      {detailProduct && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-6 py-4">
              <div>
                <h2 className="text-lg font-extrabold text-gray-900">
                  Chi tiết sản phẩm
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  ID #{detailProduct.id} · {detailProduct.sku || "Không có SKU"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailProduct(null)}
                className="rounded-lg p-2 text-xl text-gray-400 hover:bg-gray-200 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <div className="max-h-[calc(90vh-76px)] overflow-y-auto p-6">
              <div className="grid gap-6 md:grid-cols-[220px_1fr]">
                <div className="flex h-[220px] items-center justify-center overflow-hidden rounded-2xl border border-gray-100 bg-white">
                  {getProductImage(detailProduct) ? (
                    <img
                      src={getProductImage(detailProduct)}
                      alt={detailProduct.name}
                      className="h-full w-full object-contain p-4"
                    />
                  ) : (
                    <span className="text-sm text-gray-400">Không có ảnh</span>
                  )}
                </div>

                <div>
                  <h3 className="text-xl font-extrabold text-gray-900">
                    {detailProduct.name}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    {detailProduct.shortDescription || "Chưa có mô tả ngắn."}
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                    <Info label="Danh mục" value={detailProduct.category || "—"} />
                    <Info label="Thương hiệu" value={detailProduct.brand || "—"} />
                    <Info label="Giá bán" value={formatVnd(detailProduct.price)} />
                    <Info
                      label="Tồn khả dụng"
                      value={String(detailProduct.availableQuantity ?? 0)}
                    />
                    <Info
                      label="Trạng thái"
                      value={
                        statusLabels[detailProduct.status ?? "ACTIVE"]
                      }
                    />
                    <Info
                      label="Số biến thể"
                      value={String(detailProduct.variants?.length ?? 0)}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-7">
                <h4 className="mb-3 font-extrabold text-gray-900">
                  Các phiên bản sản phẩm
                </h4>

                {detailProduct.variants?.length ? (
                  <div className="overflow-x-auto rounded-xl border border-gray-100">
                    <table className="min-w-[760px] w-full text-left text-sm">
                      <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                        <tr>
                          <th className="px-4 py-3">SKU</th>
                          <th className="px-4 py-3">Màu</th>
                          <th className="px-4 py-3">Dung lượng</th>
                          <th className="px-4 py-3">Giá</th>
                          <th className="px-4 py-3 text-center">Tồn</th>
                          <th className="px-4 py-3 text-center">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {detailProduct.variants.map((variant) => (
                          <tr key={variant.id}>
                            <td className="px-4 py-3 font-mono text-xs">
                              {variant.sku || "—"}
                            </td>
                            <td className="px-4 py-3">
                              {variant.colorName || "—"}
                            </td>
                            <td className="px-4 py-3">
                              {variant.storageName || "—"}
                            </td>
                            <td className="px-4 py-3 font-bold text-[#D0021C]">
                              {formatVnd(variant.price ?? detailProduct.price)}
                            </td>
                            <td className="px-4 py-3 text-center font-bold">
                              {variant.availableQuantity ?? 0}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span
                                className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                                  variant.active && variant.inStock
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {variant.active && variant.inStock
                                  ? "Đang bán"
                                  : "Không khả dụng"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
                    Sản phẩm này chưa có variant typed.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-50 p-3">
      <p className="text-xs font-semibold text-gray-500">{label}</p>
      <p className="mt-1 font-bold text-gray-800">{value}</p>
    </div>
  );
}
