'use client';
import React, { useState } from 'react';

export default function ChatbotWidget() {
    const [isOpen, setIsOpen] = useState(false);

    // Nếu đang đóng, chỉ hiển thị nút bong bóng chat tròn
    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-[#EE4D2D] to-[#FFD400] shadow-lg flex items-center justify-center text-white hover:scale-110 transition-transform z-50"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
            </button>
        );
    }

    // Nếu đang mở, hiển thị toàn bộ khung chat
    return (
        <div className="fixed bottom-6 right-6 w-[380px] h-[640px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden border border-gray-100">
            {/* Header */}
            <div className="h-[70px] bg-gradient-to-r from-[#EE4D2D] to-[#FFD400] px-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#EE4D2D] font-bold">
                        AI
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-base leading-tight">Trợ lý ảo AI</h3>
                        <p className="text-white/80 text-xs">Luôn sẵn sàng hỗ trợ 24/7</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="text-white hover:text-gray-200">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"></path></svg>
                    </button>
                    <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-200">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
            </div>

            {/* Khung tin nhắn */}
            <div className="flex-1 bg-white p-4 overflow-y-auto flex flex-col gap-4">

                {/* Tin nhắn AI */}
                <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#EE4D2D] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-1">AI</div>
                    <div>
                        <div className="bg-gray-100 text-gray-800 p-3 rounded-2xl rounded-tl-sm text-sm">
                            Chào bạn! Mình có thể giúp gì cho bạn về iPhone 15 Pro Max hôm nay?
                        </div>
                        <div className="text-xs text-gray-400 mt-1 ml-1">10:45 AM</div>
                    </div>
                </div>

                {/* Tin nhắn User */}
                <div className="flex flex-col items-end">
                    <div className="bg-gradient-to-r from-[#EE4D2D] to-[#FFD400] text-white p-3 rounded-2xl rounded-tr-sm text-sm max-w-[80%]">
                        Shop còn máy màu Titan không?
                    </div>
                    <div className="text-xs text-gray-400 mt-1 mr-1">10:46 AM</div>
                </div>

                {/* Tin nhắn AI (có thẻ sản phẩm) */}
                <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#EE4D2D] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-1">AI</div>
                    <div className="w-full">
                        <div className="bg-gray-100 text-gray-800 p-3 rounded-2xl rounded-tl-sm text-sm mb-2 w-[fit-content]">
                            Dạ, hiện tại hệ thống vẫn đang sẵn hàng ạ:
                        </div>

                        {/* Thẻ sản phẩm */}
                        <div className="bg-white border border-gray-200 rounded-xl shadow-sm w-64 overflow-hidden mb-3">
                            <div className="h-24 bg-gray-50 flex items-center justify-center text-gray-300 text-xs font-bold border-b border-gray-100">
                                Hình ảnh thu nhỏ
                            </div>
                            <div className="p-3 flex flex-col gap-1">
                                <span className="font-bold text-sm text-gray-800 line-clamp-1">iPhone 15 Pro Max 256GB</span>
                                <span className="font-bold text-sm text-[#EE4D2D]">29.990.000 ₫</span>
                                <button className="mt-2 w-full py-1.5 rounded-md border border-[#EE4D2D] text-[#EE4D2D] text-xs font-bold bg-[#FFF3ED] hover:bg-[#ffe6d9] transition">
                                    Thêm vào giỏ
                                </button>
                            </div>
                        </div>

                        {/* Nút hành động nhanh */}
                        <div className="flex gap-2 flex-wrap">
                            <button className="px-3 py-1.5 border border-[#EE4D2D] text-[#EE4D2D] text-xs font-semibold rounded-full hover:bg-orange-50 transition">
                                Gặp nhân viên CSKH
                            </button>
                            <button className="px-3 py-1.5 border border-gray-300 text-gray-600 text-xs rounded-full hover:bg-gray-50 transition">
                                Xem chi nhánh
                            </button>
                        </div>
                    </div>
                </div>

            </div>

            {/* Input Chat */}
            <div className="h-[70px] border-t border-gray-200 p-3 bg-white flex items-center gap-2 shrink-0">
                <input
                    type="text"
                    placeholder="Nhập tin nhắn của bạn..."
                    className="flex-1 bg-gray-100 border-transparent rounded-full px-4 py-2.5 text-sm focus:ring-0 focus:outline-none"
                />
                <button className="w-10 h-10 rounded-full bg-gradient-to-r from-[#EE4D2D] to-[#FFD400] flex items-center justify-center text-white shrink-0 hover:opacity-90 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 ml-1">
                        <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                    </svg>
                </button>
            </div>
        </div>
    );
}