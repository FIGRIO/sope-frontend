"use client";
import React, { useState } from "react";

export default function SellerChatDashboard() {
    const [activeTab, setActiveTab] = useState("all");

    return (
        <div className="flex h-screen w-full bg-[#F4F6F8] font-sans text-gray-800">

            <aside className="flex w-80 flex-col border-r border-gray-200 bg-white shadow-sm z-10">
                {/* Header Cột Trái (Dùng dải màu gradient cam vàng của bản thiết kế) */}
                <div className="flex h-[70px] items-center bg-gradient-to-r from-[#EE4D2D] to-[#FFD400] px-5 shadow-sm">
                    <h1 className="text-lg font-bold text-white tracking-wide">SOPE CHAT</h1>
                </div>

                {/* Khung tìm kiếm & Tabs */}
                <div className="border-b border-gray-100 p-4">
                    <div className="mb-4 flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 focus-within:border-[#EE4D2D] focus-within:ring-1 focus-within:ring-[#EE4D2D] transition-all">
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input type="text" placeholder="Tìm tên khách hàng..." className="ml-2 w-full bg-transparent text-sm outline-none placeholder:text-gray-400" />
                    </div>
                    <div className="flex gap-4 text-sm font-medium">
                        <button
                            onClick={() => setActiveTab("all")}
                            className={`pb-2 transition-colors ${activeTab === "all" ? "border-b-2 border-[#EE4D2D] text-[#EE4D2D]" : "text-gray-500 hover:text-gray-700"}`}
                        >
                            Tất cả
                        </button>
                        <button
                            onClick={() => setActiveTab("unread")}
                            className={`pb-2 flex items-center gap-1 transition-colors ${activeTab === "unread" ? "border-b-2 border-[#EE4D2D] text-[#EE4D2D]" : "text-gray-500 hover:text-gray-700"}`}
                        >
                            Chưa đọc <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">2</span>
                        </button>
                    </div>
                </div>

                {/* Danh sách Chat */}
                <div className="flex-1 overflow-y-auto">
                    {/* Item đang chọn (Active) */}
                    <div className="flex cursor-pointer border-l-4 border-[#EE4D2D] bg-orange-50/50 p-4 transition hover:bg-orange-50">
                        <div className="relative h-12 w-12 shrink-0 rounded-full bg-gray-300 overflow-hidden">
                            <img src="https://i.pravatar.cc/150?img=32" alt="Avatar" className="h-full w-full object-cover" />
                            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500"></span>
                        </div>
                        <div className="ml-3 flex-1 overflow-hidden">
                            <div className="flex items-center justify-between">
                                <h3 className="truncate font-bold text-gray-800">Nguyễn Văn A</h3>
                                <span className="text-[11px] font-medium text-[#EE4D2D]">10:05</span>
                            </div>
                            <p className="truncate text-sm text-gray-600 font-medium">Shop ơi cho mình hỏi đ...</p>
                        </div>
                    </div>

                    {/* Item thường */}
                    <div className="flex cursor-pointer border-l-4 border-transparent p-4 transition hover:bg-gray-50">
                        <div className="h-12 w-12 shrink-0 rounded-full bg-gray-200">
                            <img src="https://i.pravatar.cc/150?img=47" alt="Avatar" className="h-full w-full object-cover rounded-full" />
                        </div>
                        <div className="ml-3 flex-1 overflow-hidden">
                            <div className="flex items-center justify-between">
                                <h3 className="truncate font-medium text-gray-700">Trần Thị B</h3>
                                <span className="text-[11px] text-gray-400">Hôm qua</span>
                            </div>
                            <p className="truncate text-sm text-gray-400">Dạ mình cảm ơn shop ạ!</p>
                        </div>
                    </div>
                </div>
            </aside>

            <section className="flex flex-1 flex-col bg-[#F9FAFB]">
                {/* Header khung chat */}
                <div className="flex h-[70px] items-center justify-between border-b border-gray-200 bg-white px-6 shadow-sm z-0">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-bold text-gray-800">Nguyễn Văn A</h2>
                        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">Khách hàng mới</span>
                    </div>
                    <button className="text-gray-400 hover:text-[#EE4D2D]">
                        {/* Icon 3 chấm dọc */}
                        <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" /></svg>
                    </button>
                </div>

                {/* Vùng tin nhắn */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="flex justify-center">
                        <span className="rounded-full bg-gray-200 px-3 py-1 text-[11px] font-medium text-gray-500">Hôm nay</span>
                    </div>

                    {/* Tin nhắn khách hàng (Trái) */}
                    <div className="flex items-end gap-2">
                        <img src="https://i.pravatar.cc/150?img=32" alt="Avatar" className="h-8 w-8 rounded-full mb-5" />
                        <div className="flex flex-col gap-1 max-w-[70%]">
                            <div className="rounded-2xl rounded-bl-none bg-white p-3 text-sm text-gray-700 shadow-sm border border-gray-100">
                                Shop ơi cho mình hỏi điện thoại này còn màu Đen không ạ?
                            </div>
                            <span className="text-[11px] text-gray-400 ml-1">10:05 AM</span>
                        </div>
                    </div>

                    {/* Tin nhắn Shop (Phải) */}
                    <div className="flex items-end justify-end gap-2">
                        <div className="flex flex-col items-end gap-1 max-w-[70%]">
                            <div className="rounded-2xl rounded-br-none bg-[#EE4D2D] p-3 text-sm text-white shadow-sm">
                                Chào bạn, sản phẩm này bên mình vẫn còn sẵn màu Đen nguyên seal nhé ạ. Mình lên đơn cho bạn nha?
                            </div>
                            {/* Bổ sung Timestamp + Trạng thái Đã xem */}
                            <div className="flex items-center gap-1 mr-1">
                                <span className="text-[11px] text-gray-400">10:08 AM</span>
                                <span className="text-[11px] font-bold text-blue-500">· Đã xem</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Khung nhập text & Trả lời nhanh */}
                <div className="border-t border-gray-200 bg-white p-4">
                    {/* Quick Replies */}
                    <div className="mb-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        <button className="whitespace-nowrap rounded-full border border-[#EE4D2D]/30 bg-orange-50 px-3 py-1.5 text-[12px] font-medium text-[#EE4D2D] hover:bg-[#EE4D2D] hover:text-white transition">
                            Còn hàng không?
                        </button>
                        <button className="whitespace-nowrap rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-[12px] font-medium text-gray-600 hover:bg-gray-100 transition">
                            Xin địa chỉ shop
                        </button>
                        <button className="whitespace-nowrap rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-[12px] font-medium text-gray-600 hover:bg-gray-100 transition">
                            Gửi mã giảm giá
                        </button>
                    </div>

                    {/* Ô nhập chat */}
                    <div className="flex items-center rounded-xl border border-gray-300 bg-gray-50 px-2 focus-within:border-[#EE4D2D] focus-within:bg-white transition-colors">
                        <button className="p-2 text-gray-400 hover:text-gray-600">
                            {/* Icon đính kèm ảnh */}
                            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                        </button>
                        <input type="text" placeholder="Nhập tin nhắn..." className="max-h-32 min-h-[44px] w-full bg-transparent px-3 text-sm outline-none" />
                        <button className="m-1 flex h-9 w-9 items-center justify-center rounded-lg bg-[#EE4D2D] text-white transition hover:bg-orange-600">
                            <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10l15-7-4 14-3.5-4L7 16v-3.5L2 10z" /></svg>
                        </button>
                    </div>
                </div>
            </section>

            <aside className="hidden w-80 flex-col border-l border-gray-200 bg-white lg:flex z-10 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.02)]">
                <div className="flex h-[70px] items-center border-b border-gray-100 px-5">
                    <h2 className="text-base font-bold text-gray-800">Thông tin bổ sung</h2>
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                    {/* Box 1: Đơn hàng / Sản phẩm đang xem */}
                    <div className="mb-6 rounded-xl border border-gray-100 bg-gray-50 p-4">
                        <h3 className="mb-3 text-xs font-bold uppercase text-gray-500 tracking-wider">Sản phẩm đang hỏi</h3>
                        <div className="flex gap-3">
                            <div className="h-16 w-16 shrink-0 rounded bg-white p-1 border border-gray-200">
                                {/* Giả lập ảnh SP */}
                                <div className="h-full w-full bg-gray-100 flex items-center justify-center text-[10px] text-gray-400">IMG</div>
                            </div>
                            <div className="flex flex-col justify-between">
                                <p className="line-clamp-2 text-sm font-medium text-gray-800 leading-tight">iPhone 15 Pro 128GB Chính hãng</p>
                                <p className="text-sm font-bold text-[#EE4D2D]">25.990.000 đ</p>
                            </div>
                        </div>
                    </div>

                    {/* Box 2: Tính năng đắt giá - AI Tóm Tắt */}
                    <div className="relative overflow-hidden rounded-xl border border-blue-100 bg-gradient-to-b from-blue-50 to-white p-4 shadow-sm">
                        {/* Lấp lánh AI */}
                        <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-blue-400/10 blur-xl"></div>

                        <div className="mb-3 flex items-center gap-2">
                            <svg width="18" height="18" fill="none" stroke="#3B82F6" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <h3 className="text-sm font-bold text-blue-600">AI Tóm tắt hội thoại</h3>
                        </div>

                        <ul className="space-y-2 text-[13px] text-gray-700 leading-relaxed font-medium pl-1">
                            <li className="flex items-start gap-2">
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500"></span>
                                Khách quan tâm iPhone 15 màu Đen.
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500"></span>
                                Cần giao hàng hỏa tốc trong khu vực TP.HCM.
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500"></span>
                                Khách đang phân vân về chính sách bảo hành.
                            </li>
                        </ul>
                    </div>

                </div>
            </aside>

        </div>
    );
}