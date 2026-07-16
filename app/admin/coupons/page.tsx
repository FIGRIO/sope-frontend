"use client";

import React, { useEffect, useState } from "react";
import {
    CouponResponse,
    CouponRequest,
    getAdminCoupons,
    createAdminCoupon,
    updateAdminCoupon,
    toggleAdminCouponStatus,
    formatVnd
} from "@/lib/shop";

export default function AdminCouponsPage() {
    const [coupons, setCoupons] = useState<CouponResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState<CouponRequest>({
        code: "",
        description: "",
        discountType: "PERCENTAGE",
        discountValue: 0,
        scope: "ALL_ORDER",
        minOrderAmount: 0,
        maxDiscountAmount: 0,
        usageLimit: 100,
        usageLimitPerUser: 1,
        startAt: "",
        endAt: ""
    });

    const fetchCoupons = async () => {
        setIsLoading(true);
        try {
            const data = await getAdminCoupons();
            setCoupons(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Lỗi khi tải danh sách mã giảm giá");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void Promise.resolve().then(fetchCoupons);
    }, []);

    const openCreateModal = () => {
        setEditingId(null);
        setFormData({
            code: "",
            description: "",
            discountType: "PERCENTAGE",
            discountValue: 0,
            scope: "ALL_ORDER",
            minOrderAmount: 0,
            maxDiscountAmount: 0,
            usageLimit: 100,
            usageLimitPerUser: 1,
            startAt: "",
            endAt: ""
        });
        setIsModalOpen(true);
    };

    const openEditModal = (coupon: CouponResponse) => {
        setEditingId(coupon.id);
        setFormData({
            code: coupon.code,
            description: coupon.description || "",
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            scope: coupon.scope,
            minOrderAmount: coupon.minOrderAmount || 0,
            maxDiscountAmount: coupon.maxDiscountAmount || 0,
            usageLimit: coupon.usageLimit || 0,
            usageLimitPerUser: coupon.usageLimitPerUser || 1,
            startAt: coupon.startAt ? coupon.startAt.slice(0, 16) : "", // Format datetime-local
            endAt: coupon.endAt ? coupon.endAt.slice(0, 16) : ""
        });
        setIsModalOpen(true);
    };

    const handleToggleStatus = async (id: number, currentStatus: boolean) => {
        if (!window.confirm(`Bạn muốn ${currentStatus ? "TẠM NGƯNG" : "KÍCH HOẠT"} mã này?`)) return;
        try {
            await toggleAdminCouponStatus(id, !currentStatus);
            await fetchCoupons();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Có lỗi xảy ra");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // Chuẩn hóa dữ liệu trước khi gửi
            const payload: CouponRequest = {
                ...formData,
                startAt: formData.startAt ? new Date(formData.startAt).toISOString() : undefined,
                endAt: formData.endAt ? new Date(formData.endAt).toISOString() : undefined,
            };

            if (editingId) {
                await updateAdminCoupon(editingId, payload);
                alert("Cập nhật thành công!");
            } else {
                await createAdminCoupon(payload);
                alert("Tạo mã giảm giá thành công!");
            }
            setIsModalOpen(false);
            await fetchCoupons();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Thao tác thất bại");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="mx-auto max-w-7xl">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Quản lý Mã Giảm Giá</h1>
                        <p className="mt-1 text-sm text-gray-500">Tạo và cấu hình các chương trình khuyến mãi.</p>
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="rounded-lg bg-[#EE4D2D] px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-600 transition"
                    >
                        + TẠO MÃ MỚI
                    </button>
                </div>

                {error && (
                    <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm font-medium text-red-700 border border-red-200">
                        {error}
                    </div>
                )}

                <div className="overflow-hidden rounded-xl bg-white shadow-sm border border-gray-200">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Mã (Code)</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Giảm giá</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase">Đã dùng / Tổng</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase">Trạng thái</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {isLoading ? (
                                    <tr><td colSpan={5} className="py-10 text-center text-gray-500">Đang tải dữ liệu...</td></tr>
                                ) : coupons.length === 0 ? (
                                    <tr><td colSpan={5} className="py-10 text-center text-gray-500">Chưa có mã giảm giá nào.</td></tr>
                                ) : (
                                    coupons.map((coupon) => (
                                        <tr key={coupon.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="whitespace-nowrap px-6 py-4">
                                                <div className="font-bold text-gray-900">{coupon.code}</div>
                                                <div className="text-xs text-gray-500 max-w-[200px] truncate" title={coupon.description}>{coupon.description}</div>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm">
                                                <span className="font-bold text-[#EE4D2D]">
                                                    {coupon.discountType === "PERCENTAGE" ? `${coupon.discountValue}%` : formatVnd(coupon.discountValue)}
                                                </span>
                                                <div className="text-xs text-gray-500 mt-1">Đơn tối thiểu: {formatVnd(coupon.minOrderAmount)}</div>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-center text-sm font-medium">
                                                <span className="text-gray-900">{coupon.usedCount}</span> / <span className="text-gray-500">{coupon.usageLimit || "∞"}</span>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-center">
                                                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${coupon.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                    {coupon.active ? "Đang chạy" : "Tạm ngưng"}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                                <button onClick={() => openEditModal(coupon)} className="text-blue-600 hover:text-blue-900 mr-4">Sửa</button>
                                                <button
                                                    onClick={() => handleToggleStatus(coupon.id, coupon.active)}
                                                    className={coupon.active ? "text-red-600 hover:text-red-900" : "text-green-600 hover:text-green-900"}
                                                >
                                                    {coupon.active ? "Ngưng" : "Kích hoạt"}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal Form */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
                        <div className="border-b border-gray-100 bg-gray-50 px-6 py-4 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-gray-800">{editingId ? "Cập nhật mã giảm giá" : "Tạo mã giảm giá mới"}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700 text-xl font-bold">&times;</button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[75vh]">
                            <div className="grid grid-cols-2 gap-5 text-sm">

                                <div className="col-span-2">
                                    <label className="mb-1 block font-bold text-gray-700">Mã Coupon (Code) *</label>
                                    <input required type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} className="w-full rounded-lg border border-gray-300 p-2.5 outline-none focus:border-[#EE4D2D] uppercase" placeholder="Ví dụ: SUMMER2026" />
                                </div>

                                <div className="col-span-2">
                                    <label className="mb-1 block font-bold text-gray-700">Mô tả chương trình</label>
                                    <input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full rounded-lg border border-gray-300 p-2.5 outline-none focus:border-[#EE4D2D]" />
                                </div>

                                <div>
                                    <label className="mb-1 block font-bold text-gray-700">Loại giảm giá</label>
                                    <select value={formData.discountType} onChange={(e) => setFormData({ ...formData, discountType: e.target.value as CouponRequest["discountType"] })} className="w-full rounded-lg border border-gray-300 p-2.5 outline-none focus:border-[#EE4D2D]">
                                        <option value="PERCENTAGE">Giảm theo phần trăm (%)</option>
                                        <option value="FIXED_AMOUNT">Giảm số tiền cố định (VNĐ)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1 block font-bold text-gray-700">Giá trị giảm *</label>
                                    <input required type="number" min="1" value={formData.discountValue || ''} onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })} className="w-full rounded-lg border border-gray-300 p-2.5 outline-none focus:border-[#EE4D2D]" placeholder={formData.discountType === "PERCENTAGE" ? "Ví dụ: 10" : "Ví dụ: 50000"} />
                                </div>

                                <div>
                                    <label className="mb-1 block font-bold text-gray-700">Đơn hàng tối thiểu (VNĐ)</label>
                                    <input type="number" min="0" value={formData.minOrderAmount || ''} onChange={(e) => setFormData({ ...formData, minOrderAmount: Number(e.target.value) })} className="w-full rounded-lg border border-gray-300 p-2.5 outline-none focus:border-[#EE4D2D]" />
                                </div>

                                <div>
                                    <label className="mb-1 block font-bold text-gray-700">Giảm tối đa (VNĐ)</label>
                                    <input type="number" min="0" value={formData.maxDiscountAmount || ''} onChange={(e) => setFormData({ ...formData, maxDiscountAmount: Number(e.target.value) })} className="w-full rounded-lg border border-gray-300 p-2.5 outline-none focus:border-[#EE4D2D]" disabled={formData.discountType === "FIXED_AMOUNT"} title="Chỉ áp dụng cho loại giảm %" />
                                </div>

                                <div>
                                    <label className="mb-1 block font-bold text-gray-700">Lượt sử dụng tối đa</label>
                                    <input type="number" min="1" value={formData.usageLimit || ''} onChange={(e) => setFormData({ ...formData, usageLimit: Number(e.target.value) })} className="w-full rounded-lg border border-gray-300 p-2.5 outline-none focus:border-[#EE4D2D]" />
                                </div>

                                <div>
                                    <label className="mb-1 block font-bold text-gray-700">Lượt sử dụng / 1 khách</label>
                                    <input type="number" min="1" value={formData.usageLimitPerUser || ''} onChange={(e) => setFormData({ ...formData, usageLimitPerUser: Number(e.target.value) })} className="w-full rounded-lg border border-gray-300 p-2.5 outline-none focus:border-[#EE4D2D]" />
                                </div>

                                <div>
                                    <label className="mb-1 block font-bold text-gray-700">Bắt đầu từ</label>
                                    <input type="datetime-local" value={formData.startAt} onChange={(e) => setFormData({ ...formData, startAt: e.target.value })} className="w-full rounded-lg border border-gray-300 p-2.5 outline-none focus:border-[#EE4D2D]" />
                                </div>

                                <div>
                                    <label className="mb-1 block font-bold text-gray-700">Hết hạn lúc</label>
                                    <input type="datetime-local" value={formData.endAt} onChange={(e) => setFormData({ ...formData, endAt: e.target.value })} className="w-full rounded-lg border border-gray-300 p-2.5 outline-none focus:border-[#EE4D2D]" />
                                </div>
                            </div>

                            <div className="mt-8 flex justify-end gap-3 border-t border-gray-100 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-lg bg-gray-100 px-5 py-2.5 font-bold text-gray-700 hover:bg-gray-200">
                                    Hủy
                                </button>
                                <button type="submit" disabled={isSubmitting} className="rounded-lg bg-[#EE4D2D] px-5 py-2.5 font-bold text-white hover:bg-orange-600 disabled:opacity-70">
                                    {isSubmitting ? "Đang lưu..." : "Lưu Thay Đổi"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
