"use client";

import React, { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PwaInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        // Lắng nghe sự kiện trình duyệt báo rằng PWA đã sẵn sàng để cài đặt
        const handler = (event: Event) => {
            const e = event as BeforeInstallPromptEvent;
            // Ngăn chặn trình duyệt hiển thị thanh cài đặt mặc định (để mình tự làm cho đẹp)
            e.preventDefault();
            // Lưu lại event để gọi hộp thoại cài đặt khi người dùng bấm nút
            setDeferredPrompt(e);
            // Hiển thị banner của chúng ta
            setShowPrompt(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Hiển thị hộp thoại cài đặt mặc định của hệ điều hành
        deferredPrompt.prompt();

        // Đợi người dùng phản hồi (Đồng ý cài hoặc Hủy)
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`Người dùng đã chọn: ${outcome}`);

        // Đã dùng xong thì xóa event và ẩn banner đi
        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    if (!showPrompt) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-80 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-gray-100 p-4 z-[100] flex items-center gap-4 animate-in slide-in-from-bottom-5 fade-in duration-300">
            <div className="w-12 h-12 bg-gradient-to-tr from-[#EE4D2D] to-[#FFD400] rounded-xl flex items-center justify-center shrink-0 text-white font-extrabold text-xl shadow-inner">
                S
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-gray-900 truncate">Cài đặt SOPE App</h3>
                <p className="text-xs text-gray-500 mt-0.5 leading-snug">Truy cập nhanh hơn, mua sắm mượt mà hơn!</p>
            </div>
            <button
                onClick={handleInstallClick}
                className="bg-gray-900 text-white text-xs font-bold px-4 py-2.5 rounded-lg hover:bg-gray-800 transition active:scale-95"
            >
                Cài đặt
            </button>

            {/* Nút tắt */}
            <button
                onClick={() => setShowPrompt(false)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-gray-200 text-gray-400 rounded-full flex items-center justify-center hover:bg-gray-50 hover:text-gray-600 shadow-sm transition"
                aria-label="Đóng"
            >
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
}
