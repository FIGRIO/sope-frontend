"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import {
  createAdminCoupon,
  deleteAdminCoupon,
  formatVnd,
  getAdminCoupons,
  toggleAdminCouponStatus,
  updateAdminCoupon,
  type CouponRequest,
  type CouponResponse,
} from "@/lib/shop";
import { getAdminProducts, type ProductResponse } from "@/lib/admin-products";

type FormState = {
  code: string;
  description: string;
  discountType: CouponRequest["discountType"];
  discountValue: string;
  scope: CouponRequest["scope"];
  applicableProductIds: number[];
  applicableCategories: string[];
  minOrderAmount: string;
  maxDiscountAmount: string;
  usageLimit: string;
  usageLimitPerUser: string;
  startAt: string;
  endAt: string;
};

const emptyForm: FormState = {
  code: "",
  description: "",
  discountType: "PERCENTAGE",
  discountValue: "10",
  scope: "ALL_ORDER",
  applicableProductIds: [],
  applicableCategories: [],
  minOrderAmount: "",
  maxDiscountAmount: "",
  usageLimit: "100",
  usageLimitPerUser: "1",
  startAt: "",
  endAt: "",
};

function toOptionalNumber(value: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function formatDateTime(value?: string) {
  if (!value) return "Không giới hạn";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function couponState(coupon: CouponResponse) {
  if (!coupon.active) return { label: "Tạm ngưng", className: "bg-gray-100 text-gray-600" };
  const now = Date.now();
  if (coupon.startAt && new Date(coupon.startAt).getTime() > now) {
    return { label: "Sắp diễn ra", className: "bg-blue-100 text-blue-700" };
  }
  if (coupon.endAt && new Date(coupon.endAt).getTime() < now) {
    return { label: "Đã hết hạn", className: "bg-red-100 text-red-700" };
  }
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    return { label: "Hết lượt", className: "bg-amber-100 text-amber-700" };
  }
  return { label: "Đang chạy", className: "bg-emerald-100 text-emerald-700" };
}

async function loadProducts() {
  const first = await getAdminProducts({ page: 0, size: 100, sortBy: "name", sortDir: "asc" });
  if (first.totalPages <= 1) return first.content;
  const rest = await Promise.all(Array.from({ length: first.totalPages - 1 }, (_, index) =>
    getAdminProducts({ page: index + 1, size: 100, sortBy: "name", sortDir: "asc" })));
  return [first, ...rest].flatMap((page) => page.content);
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<CouponResponse[]>([]);
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [busyKey, setBusyKey] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [couponData, productData] = await Promise.all([getAdminCoupons(), loadProducts()]);
      setCoupons(couponData);
      setProducts(productData);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Không thể tải danh sách mã giảm giá.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const categories = useMemo(() => [...new Set(products.map((product) => product.category).filter((value): value is string => Boolean(value)))].sort(), [products]);

  const filteredCoupons = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("vi");
    return coupons.filter((coupon) => {
      if (statusFilter === "ACTIVE" && !coupon.active) return false;
      if (statusFilter === "INACTIVE" && coupon.active) return false;
      if (!keyword) return true;
      return `${coupon.code} ${coupon.description ?? ""}`.toLocaleLowerCase("vi").includes(keyword);
    });
  }, [coupons, search, statusFilter]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (coupon: CouponResponse) => {
    setEditingId(coupon.id);
    setForm({
      code: coupon.code,
      description: coupon.description ?? "",
      discountType: coupon.discountType,
      discountValue: String(coupon.discountValue),
      scope: coupon.scope,
      applicableProductIds: coupon.applicableProductIds ?? [],
      applicableCategories: coupon.applicableCategories ?? [],
      minOrderAmount: coupon.minOrderAmount == null ? "" : String(coupon.minOrderAmount),
      maxDiscountAmount: coupon.maxDiscountAmount == null ? "" : String(coupon.maxDiscountAmount),
      usageLimit: coupon.usageLimit == null ? "" : String(coupon.usageLimit),
      usageLimitPerUser: coupon.usageLimitPerUser == null ? "" : String(coupon.usageLimitPerUser),
      startAt: coupon.startAt ? coupon.startAt.slice(0, 16) : "",
      endAt: coupon.endAt ? coupon.endAt.slice(0, 16) : "",
    });
    setModalOpen(true);
  };

  const buildPayload = (): CouponRequest => {
    const discountValue = Number(form.discountValue);
    if (!Number.isFinite(discountValue) || discountValue <= 0) {
      throw new Error("Giá trị giảm phải lớn hơn 0.");
    }
    if (form.discountType === "PERCENTAGE" && discountValue > 100) {
      throw new Error("Mức giảm phần trăm không được vượt quá 100%.");
    }
    if (form.startAt && form.endAt && form.startAt >= form.endAt) {
      throw new Error("Thời gian bắt đầu phải trước thời gian kết thúc.");
    }
    if (form.scope === "SPECIFIC_PRODUCTS" && form.applicableProductIds.length === 0) {
      throw new Error("Hãy chọn ít nhất một sản phẩm áp dụng.");
    }
    if (form.scope === "SPECIFIC_CATEGORIES" && form.applicableCategories.length === 0) {
      throw new Error("Hãy chọn ít nhất một danh mục áp dụng.");
    }

    return {
      code: form.code.trim().toUpperCase(),
      description: form.description.trim() || undefined,
      discountType: form.discountType,
      discountValue,
      scope: form.scope,
      applicableProductIds: form.scope === "SPECIFIC_PRODUCTS" ? form.applicableProductIds : [],
      applicableCategories: form.scope === "SPECIFIC_CATEGORIES" ? form.applicableCategories : [],
      minOrderAmount: toOptionalNumber(form.minOrderAmount),
      maxDiscountAmount: form.discountType === "PERCENTAGE" ? toOptionalNumber(form.maxDiscountAmount) : undefined,
      usageLimit: toOptionalNumber(form.usageLimit),
      usageLimitPerUser: toOptionalNumber(form.usageLimitPerUser),
      // LocalDateTime phía backend nhận chuỗi local, không gửi hậu tố Z.
      startAt: form.startAt || undefined,
      endAt: form.endAt || undefined,
    };
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const key = editingId ? `edit-${editingId}` : "create";
    setBusyKey(key);
    try {
      const payload = buildPayload();
      if (editingId) {
        await updateAdminCoupon(editingId, payload);
        toast.success("Đã cập nhật mã giảm giá.");
      } else {
        await createAdminCoupon(payload);
        toast.success("Đã tạo mã giảm giá.");
      }
      setModalOpen(false);
      await loadData();
    } catch (submitError) {
      toast.error(submitError instanceof Error ? submitError.message : "Không thể lưu mã giảm giá.");
    } finally {
      setBusyKey("");
    }
  };

  const toggleStatus = async (coupon: CouponResponse) => {
    const key = `toggle-${coupon.id}`;
    setBusyKey(key);
    try {
      await toggleAdminCouponStatus(coupon.id, !coupon.active);
      toast.success(coupon.active ? "Đã tạm ngưng mã giảm giá." : "Đã kích hoạt mã giảm giá.");
      await loadData();
    } catch (toggleError) {
      toast.error(toggleError instanceof Error ? toggleError.message : "Không thể đổi trạng thái.");
    } finally {
      setBusyKey("");
    }
  };

  const remove = async (coupon: CouponResponse) => {
    if (!window.confirm(`Xóa mã ${coupon.code}? Mã đã có lịch sử sử dụng sẽ không thể xóa.`)) return;
    const key = `delete-${coupon.id}`;
    setBusyKey(key);
    try {
      await deleteAdminCoupon(coupon.id);
      toast.success("Đã xóa mã giảm giá.");
      await loadData();
    } catch (deleteError) {
      toast.error(deleteError instanceof Error ? deleteError.message : "Không thể xóa mã giảm giá.");
    } finally {
      setBusyKey("");
    }
  };

  return (
    <main className="space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#EE4D2D]">Khuyến mãi</p>
          <h1 className="mt-1 text-2xl font-extrabold text-gray-900">Quản lý mã giảm giá</h1>
          <p className="mt-1 text-sm text-gray-500">Tạo mã theo đơn hàng, sản phẩm hoặc danh mục và kiểm soát giới hạn sử dụng.</p>
        </div>
        <button type="button" onClick={openCreate} className="rounded-lg bg-[#EE4D2D] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-orange-600">+ Tạo mã mới</button>
      </header>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

      <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            {(["ALL", "ACTIVE", "INACTIVE"] as const).map((value) => (
              <button key={value} type="button" onClick={() => setStatusFilter(value)} className={`rounded-full px-4 py-2 text-sm font-bold ${statusFilter === value ? "bg-[#EE4D2D] text-white" : "bg-gray-100 text-gray-600"}`}>
                {value === "ALL" ? "Tất cả" : value === "ACTIVE" ? "Đang bật" : "Tạm ngưng"}
              </button>
            ))}
          </div>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm mã hoặc mô tả..." className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-[#EE4D2D] sm:max-w-sm" />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50"><tr className="text-left text-xs font-bold uppercase tracking-wide text-gray-500"><th className="px-5 py-3">Mã</th><th className="px-5 py-3">Giá trị</th><th className="px-5 py-3">Phạm vi</th><th className="px-5 py-3">Lượt dùng</th><th className="px-5 py-3">Hiệu lực</th><th className="px-5 py-3">Trạng thái</th><th className="px-5 py-3 text-right">Thao tác</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-gray-500">Đang tải mã giảm giá...</td></tr> : filteredCoupons.length === 0 ? <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-gray-500">Chưa có mã giảm giá phù hợp.</td></tr> : filteredCoupons.map((coupon) => {
                const state = couponState(coupon);
                const scopeText = coupon.scope === "ALL_ORDER" ? "Toàn đơn hàng" : coupon.scope === "SPECIFIC_PRODUCTS" ? `${coupon.applicableProductIds?.length ?? 0} sản phẩm` : `${coupon.applicableCategories?.length ?? 0} danh mục`;
                return (
                  <tr key={coupon.id} className="align-top hover:bg-gray-50/70">
                    <td className="px-5 py-4"><p className="font-extrabold text-gray-900">{coupon.code}</p><p className="mt-1 max-w-[220px] text-xs text-gray-500">{coupon.description || "Không có mô tả"}</p></td>
                    <td className="px-5 py-4"><p className="font-bold text-[#EE4D2D]">{coupon.discountType === "PERCENTAGE" ? `${coupon.discountValue}%` : formatVnd(coupon.discountValue)}</p><p className="mt-1 text-xs text-gray-500">Đơn tối thiểu: {coupon.minOrderAmount == null ? "Không" : formatVnd(coupon.minOrderAmount)}</p>{coupon.maxDiscountAmount != null && <p className="text-xs text-gray-500">Tối đa: {formatVnd(coupon.maxDiscountAmount)}</p>}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-gray-700">{scopeText}</td>
                    <td className="px-5 py-4"><p className="text-sm font-bold text-gray-900">{coupon.usedCount} / {coupon.usageLimit ?? "∞"}</p><p className="mt-1 text-xs text-gray-500">Mỗi người: {coupon.usageLimitPerUser ?? "∞"}</p></td>
                    <td className="px-5 py-4 text-xs text-gray-600"><p>Từ: {formatDateTime(coupon.startAt)}</p><p className="mt-1">Đến: {formatDateTime(coupon.endAt)}</p></td>
                    <td className="px-5 py-4"><span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${state.className}`}>{state.label}</span></td>
                    <td className="px-5 py-4"><div className="flex min-w-[180px] justify-end gap-2"><button type="button" onClick={() => openEdit(coupon)} className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50">Sửa</button><button type="button" disabled={busyKey === `toggle-${coupon.id}`} onClick={() => void toggleStatus(coupon)} className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50">{coupon.active ? "Ngưng" : "Bật"}</button><button type="button" disabled={busyKey === `delete-${coupon.id}`} onClick={() => void remove(coupon)} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50">Xóa</button></div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" onMouseDown={() => setModalOpen(false)}>
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4"><h2 className="text-lg font-extrabold text-gray-900">{editingId ? "Chỉnh sửa mã giảm giá" : "Tạo mã giảm giá"}</h2><button type="button" onClick={() => setModalOpen(false)} className="rounded-lg px-2 py-1 text-xl text-gray-500 hover:bg-gray-100">×</button></div>
            <form onSubmit={submit} className="space-y-6 p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Mã giảm giá"><input required maxLength={50} value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "") }))} className="input" placeholder="VD: SALE20" /></Field>
                <Field label="Mô tả"><input value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className="input" placeholder="Khuyến mãi mùa hè" /></Field>
                <Field label="Loại giảm"><select value={form.discountType} onChange={(event) => setForm((current) => ({ ...current, discountType: event.target.value as FormState["discountType"], maxDiscountAmount: event.target.value === "FIXED_AMOUNT" ? "" : current.maxDiscountAmount }))} className="input"><option value="PERCENTAGE">Theo phần trăm</option><option value="FIXED_AMOUNT">Số tiền cố định</option></select></Field>
                <Field label={form.discountType === "PERCENTAGE" ? "Phần trăm giảm" : "Số tiền giảm (VND)"}><input required type="number" min={1} max={form.discountType === "PERCENTAGE" ? 100 : undefined} value={form.discountValue} onChange={(event) => setForm((current) => ({ ...current, discountValue: event.target.value }))} className="input" /></Field>
                <Field label="Phạm vi áp dụng"><select value={form.scope} onChange={(event) => setForm((current) => ({ ...current, scope: event.target.value as FormState["scope"] }))} className="input"><option value="ALL_ORDER">Toàn đơn hàng</option><option value="SPECIFIC_PRODUCTS">Sản phẩm cụ thể</option><option value="SPECIFIC_CATEGORIES">Danh mục cụ thể</option></select></Field>
                <Field label="Đơn hàng tối thiểu (để trống = không giới hạn)"><input type="number" min={0} value={form.minOrderAmount} onChange={(event) => setForm((current) => ({ ...current, minOrderAmount: event.target.value }))} className="input" /></Field>
                {form.discountType === "PERCENTAGE" && <Field label="Giảm tối đa (để trống = không giới hạn)"><input type="number" min={0} value={form.maxDiscountAmount} onChange={(event) => setForm((current) => ({ ...current, maxDiscountAmount: event.target.value }))} className="input" /></Field>}
                <Field label="Tổng lượt sử dụng"><input type="number" min={1} value={form.usageLimit} onChange={(event) => setForm((current) => ({ ...current, usageLimit: event.target.value }))} className="input" placeholder="Để trống = không giới hạn" /></Field>
                <Field label="Lượt dùng mỗi người"><input type="number" min={1} value={form.usageLimitPerUser} onChange={(event) => setForm((current) => ({ ...current, usageLimitPerUser: event.target.value }))} className="input" placeholder="Để trống = không giới hạn" /></Field>
                <Field label="Bắt đầu"><input type="datetime-local" value={form.startAt} onChange={(event) => setForm((current) => ({ ...current, startAt: event.target.value }))} className="input" /></Field>
                <Field label="Kết thúc"><input type="datetime-local" value={form.endAt} onChange={(event) => setForm((current) => ({ ...current, endAt: event.target.value }))} className="input" /></Field>
              </div>

              {form.scope === "SPECIFIC_PRODUCTS" && <SelectionBox title="Chọn sản phẩm" items={products.map((product) => ({ id: product.id, label: `${product.name} (ID: ${product.id})` }))} selected={form.applicableProductIds} onToggle={(id) => setForm((current) => ({ ...current, applicableProductIds: current.applicableProductIds.includes(id) ? current.applicableProductIds.filter((value) => value !== id) : [...current.applicableProductIds, id] }))} />}
              {form.scope === "SPECIFIC_CATEGORIES" && <SelectionBox title="Chọn danh mục" items={categories.map((category) => ({ id: category, label: category }))} selected={form.applicableCategories} onToggle={(id) => setForm((current) => ({ ...current, applicableCategories: current.applicableCategories.includes(id) ? current.applicableCategories.filter((value) => value !== id) : [...current.applicableCategories, id] }))} />}

              <div className="flex justify-end gap-3 border-t border-gray-200 pt-5"><button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-bold text-gray-700">Hủy</button><button disabled={busyKey === (editingId ? `edit-${editingId}` : "create")} className="rounded-lg bg-[#EE4D2D] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">{busyKey ? "Đang lưu..." : "Lưu mã giảm giá"}</button></div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`.input{width:100%;border:1px solid #d1d5db;border-radius:.5rem;padding:.7rem .9rem;color:#111827;outline:none;background:white}.input:focus{border-color:#ee4d2d;box-shadow:0 0 0 1px #ee4d2d}`}</style>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-sm font-bold text-gray-700">{label}</span>{children}</label>;
}

function SelectionBox<T extends number | string>({ title, items, selected, onToggle }: { title: string; items: Array<{ id: T; label: string }>; selected: T[]; onToggle: (id: T) => void }) {
  return <div className="rounded-xl border border-gray-200"><div className="border-b border-gray-200 px-4 py-3"><p className="font-bold text-gray-800">{title} <span className="text-sm font-medium text-gray-500">({selected.length} đã chọn)</span></p></div><div className="grid max-h-64 gap-2 overflow-y-auto p-4 sm:grid-cols-2"><>{items.map((item) => <label key={String(item.id)} className="flex cursor-pointer items-start gap-2 rounded-lg border border-gray-200 p-3 text-sm text-gray-700 hover:bg-gray-50"><input type="checkbox" checked={selected.includes(item.id)} onChange={() => onToggle(item.id)} className="mt-0.5" /><span>{item.label}</span></label>)}</></div></div>;
}
