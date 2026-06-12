'use client';
import React, { useState } from 'react';

// Định nghĩa Props cho Modal để nó có thể được điều khiển từ bên ngoài (ví dụ từ trang Chi tiết đơn hàng)
interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    // Có thể truyền thêm các thông tin như productName, thumbnail, variant...
}

export default function ReviewModal({ isOpen, onClose }: ReviewModalProps) {
    // 1. Quản lý State cho form đánh giá
    const [rating, setRating] = useState<number>(0);
    const [hoverRating, setHoverRating] = useState<number>(0);
    const [reviewText, setReviewText] = useState<string>('');

    // Mảng mô tả mức độ đánh giá tương ứng với số sao (1 đến 5)
    const ratingLabels = ["Tệ", "Không hài lòng", "Bình thường", "Hài lòng", "Tuyệt vời"];

    if (!isOpen) return null;

    // 2. Hàm xử lý giả lập việc nộp đánh giá
    const handleSubmit = () => {
        // Validation cơ bản trước khi nộp
        if (rating === 0) {
            alert('Vui lòng chọn số sao đánh giá!');
            return;
        }
        if (reviewText.length < 50) {
            alert('Vui lòng chia sẻ ít nhất 50 ký tự nhé!');
            return;
        }

        console.log("Đã gửi đánh giá: ", { rating, reviewText });
        // Tại đây bạn sẽ gọi API POST lên server để lưu vào database
        // Ví dụ: await fetch('/api/reviews', { method: 'POST', body: JSON.stringify(...) });

        alert('Gửi đánh giá thành công!');
        onClose(); // Đóng Modal sau khi thành công
    };

    return (
        // Lớp nền đen mờ bao phủ toàn màn hình (Overlay)
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm px-4">

            {/* Box Modal chính */}
            <div className="bg-white rounded-2xl w-full max-w-[600px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">

                {/* Header Modal */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 shrink-0">
                    <h2 className="text-xl font-bold text-gray-800">Đánh giá Sản phẩm</h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 font-bold transition"
                    >
                        ✕
                    </button>
                </div>

                {/* Nội dung Form (Scrollable nếu dài) */}
                <div className="p-6 overflow-y-auto max-h-[70vh]">

                    {/* Phần thông tin sản phẩm thu gọn */}
                    <div className="flex gap-4 items-center mb-8">
                        <div className="w-16 h-16 bg-gray-100 border border-gray-200 rounded-lg shrink-0 flex items-center justify-center text-gray-400 text-xs">
                            Ảnh
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 text-base line-clamp-1">iPhone 15 Pro Max 256GB</h3>
                            <p className="text-sm text-gray-500 mt-1">Phân loại: Titan Tự nhiên</p>
                        </div>
                    </div>

                    {/* Phần chọn số sao */}
                    <div className="mb-8">
                        <h4 className="font-bold text-gray-800 text-base mb-3">Chất lượng sản phẩm</h4>
                        <div className="flex items-center gap-4">
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        className="focus:outline-none transition-transform hover:scale-110"
                                    >
                                        <svg
                                            className={`w-10 h-10 ${star <= (hoverRating || rating) ? 'text-[#FBBF24]' : 'text-gray-300'}`}
                                            fill="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                        </svg>
                                    </button>
                                ))}
                            </div>
                            {/* Hiển thị Text mô tả độ hài lòng tương ứng */}
                            <span className="text-[#EE4D2D] font-bold text-base ml-2">
                                {(hoverRating || rating) > 0 ? ratingLabels[(hoverRating || rating) - 1] : ''}
                            </span>
                        </div>
                    </div>

                    {/* Đường kẻ ngang */}
                    <hr className="border-gray-200 mb-6" />

                    {/* Textarea nhập review */}
                    <div className="mb-6 relative">
                        <textarea
                            className="w-full h-36 bg-gray-50 border border-gray-300 rounded-xl p-4 text-sm text-gray-800 focus:ring-1 focus:ring-[#EE4D2D] focus:border-[#EE4D2D] resize-none outline-none"
                            placeholder="Hãy chia sẻ cảm nhận của bạn về sản phẩm để giúp những người mua khác nhé. (Tối thiểu 50 ký tự)"
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                            maxLength={500}
                        />
                        <span className="absolute bottom-3 right-4 text-xs text-gray-400">
                            {reviewText.length}/500 ký tự
                        </span>
                    </div>

                    {/* Phần Upload ảnh (Phác thảo UI) */}
                    <div>
                        <h4 className="font-bold text-gray-800 text-sm mb-3">Thêm Hình ảnh / Video</h4>
                        <button className="w-24 h-24 rounded-lg border-2 border-dashed border-[#EE4D2D] flex flex-col items-center justify-center gap-2 hover:bg-orange-50 transition cursor-pointer">
                            <svg className="w-6 h-6 text-[#EE4D2D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            </svg>
                            <span className="text-[#EE4D2D] font-bold text-xs">Tải ảnh lên</span>
                        </button>
                        {/* Khu vực dự kiến để render các thumbnail ảnh sau khi upload */}
                        <div className="flex gap-2 mt-3 flex-wrap">
                            {/* <div className="w-20 h-20 bg-gray-200 rounded-md"></div> */}
                        </div>
                    </div>
                </div>

                {/* Footer Modal (Buttons) */}
                <div className="p-6 border-t border-gray-200 bg-white flex gap-4 shrink-0 mt-auto">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3.5 rounded-lg border border-gray-300 font-bold text-gray-600 hover:bg-gray-50 transition"
                    >
                        TRỞ LẠI
                    </button>
                    <button
                        onClick={handleSubmit}
                        // Nếu chưa chọn sao thì làm mờ nút và vô hiệu hóa click
                        disabled={rating === 0}
                        className={`flex-1 py-3.5 rounded-lg font-bold text-white transition ${rating > 0
                                ? 'bg-gradient-to-r from-[#EE4D2D] to-[#FFD400] hover:opacity-90 shadow-md'
                                : 'bg-gray-300 cursor-not-allowed'
                            }`}
                    >
                        HOÀN TẤT ĐÁNH GIÁ
                    </button>
                </div>

            </div>
        </div>
    );
}