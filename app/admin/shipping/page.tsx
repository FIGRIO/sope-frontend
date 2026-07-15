"use client";

import React, { useEffect, useState } from "react";
import {
    getAdminShippingMethods,
    getAdminShippingZones,
    getAdminShippingRates,
    ShippingMethodResponse,
    ShippingZoneResponse,
    ShippingRateResponse,
    formatVnd
} from "@/lib/shop";

type TabType = "METHODS" | "ZONES" | "RATES";

export default function AdminShippingPage() {
    const [activeTab, setActiveTab] = useState<TabType>("RATES");
    const [isLoading, setIsLoading] = useState(true);

    const [methods, setMethods] = useState<ShippingMethodResponse[]>([]);
    const [zones, setZones] = useState<ShippingZoneResponse[]>([]);
    const [rates, setRates] = useState<ShippingRateResponse[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [methodsData, zonesData, ratesData] = await Promise.all([
                    getAdminShippingMethods(),
                    getAdminShippingZones(),
                    getAdminShippingRates()
                ]);
                setMethods(methodsData);
                setZones(zonesData);
                setRates(ratesData);
            } catch (error) {
                console.error("Lỗi khi tải dữ liệu giao hàng", error);
            } finally {
                setIsLoading(false);
            }
        };
        void fetchData();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="mx-auto max-w-7xl">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Quản lý Giao hàng</h1>
                        <p className="mt-1 text-sm text-gray-500">Cấu hình khu vực, phương thức và cước phí vận chuyển.</p>
                    </div>
                    <button className="rounded-lg bg-[#EE4D2D] px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-600 transition opacity-50 cursor-not-allowed" title="Chức năng đang chờ Backend cập nhật API">
                        + THÊM MỚI
                    </button>
                </div>

                {/* Tabs */}
                <div className="mb-6 flex gap-2 border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab("RATES")}
                        className={`pb-3 px-4 text-sm font-bold transition-colors ${activeTab === "RATES" ? "border-b-2 border-[#EE4D2D] text-[#EE4D2D]" : "text-gray-500 hover:text-gray-700"}`}
                    >
                        Bảng Giá Cước (Rates)
                    </button>
                    <button
                        onClick={() => setActiveTab("ZONES")}
                        className={`pb-3 px-4 text-sm font-bold transition-colors ${activeTab === "ZONES" ? "border-b-2 border-[#EE4D2D] text-[#EE4D2D]" : "text-gray-500 hover:text-gray-700"}`}
                    >
                        Khu Vực Giao (Zones)
                    </button>
                    <button
                        onClick={() => setActiveTab("METHODS")}
                        className={`pb-3 px-4 text-sm font-bold transition-colors ${activeTab === "METHODS" ? "border-b-2 border-[#EE4D2D] text-[#EE4D2D]" : "text-gray-500 hover:text-gray-700"}`}
                    >
                        Phương Thức (Methods)
                    </button>
                </div>

                {/* Bảng Dữ Liệu */}
                <div className="overflow-hidden rounded-xl bg-white shadow-sm border border-gray-200">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            {/* === BẢNG RATES === */}
                            {activeTab === "RATES" && (
                                <>
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Khu vực</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Phương thức</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Phí vận chuyển</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Thời gian giao</th>
                                            <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase">Trạng thái</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {isLoading ? (
                                            <tr><td colSpan={5} className="py-10 text-center text-gray-500">Đang tải...</td></tr>
                                        ) : rates.map((rate) => (
                                            <tr key={rate.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 font-medium text-gray-900">{rate.zone.name}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{rate.method.name}</td>
                                                <td className="px-6 py-4 font-bold text-[#EE4D2D]">{formatVnd(rate.fee)}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{rate.minDays} - {rate.maxDays} ngày</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${rate.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                        {rate.active ? "Kích hoạt" : "Vô hiệu hóa"}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </>
                            )}

                            {/* === BẢNG ZONES === */}
                            {activeTab === "ZONES" && (
                                <>
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Tên khu vực</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Tỉnh / Thành phố áp dụng</th>
                                            <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase">Độ ưu tiên</th>
                                            <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase">Trạng thái</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {isLoading ? (
                                            <tr><td colSpan={4} className="py-10 text-center text-gray-500">Đang tải...</td></tr>
                                        ) : zones.map((zone) => (
                                            <tr key={zone.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 font-bold text-gray-900">{zone.name}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    <div className="flex flex-wrap gap-1">
                                                        {zone.provinces.map((prov, idx) => (
                                                            <span key={idx} className="bg-gray-100 px-2 py-1 rounded text-xs">{prov}</span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center text-sm font-medium">{zone.priority}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${zone.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                        {zone.active ? "Kích hoạt" : "Vô hiệu hóa"}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </>
                            )}

                            {/* === BẢNG METHODS === */}
                            {activeTab === "METHODS" && (
                                <>
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Mã (Code)</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Tên hiển thị</th>
                                            <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase">Trạng thái</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {isLoading ? (
                                            <tr><td colSpan={3} className="py-10 text-center text-gray-500">Đang tải...</td></tr>
                                        ) : methods.map((method) => (
                                            <tr key={method.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 font-bold text-gray-900">{method.code}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{method.name}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${method.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                        {method.active ? "Kích hoạt" : "Vô hiệu hóa"}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </>
                            )}
                        </table>
                    </div>
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 text-xs text-gray-500 italic text-center">
                        * Lưu ý: Hiện tại Backend chưa mở API Thêm/Sửa/Xóa cho phân hệ này. Dữ liệu trên đang ở chế độ xem trước (Preview Mode).
                    </div>
                </div>
            </div>
        </div>
    );
}