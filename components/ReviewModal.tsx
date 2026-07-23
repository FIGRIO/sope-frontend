"use client";

import { API_BASE_URL, getAccessToken } from "@/lib/auth";
import { parseJsonResponse } from "@/lib/api-response";
import Image from "next/image";
import { useEffect, useState, type ChangeEvent } from "react";

type ReviewResponse = {
  id: number;
  productId: number;
  userId: number;
  username: string;
  rating: number;
  comment?: string | null;
  createdAt?: string | null;
};

type ReviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  productId: number;
  productName: string;
  productImage?: string;
  variantLabel?: string;
  onSubmitted: (review: ReviewResponse) => void | Promise<void>;
  onRequireLogin?: () => void;
};

const RATING_LABELS = [
  "Tệ",
  "Không hài lòng",
  "Bình thường",
  "Hài lòng",
  "Tuyệt vời",
];

async function readErrorMessage(response: Response) {
  const fallback = `Không thể gửi đánh giá (${response.status}).`;
  const text = await response.text();
  if (!text) return fallback;

  try {
    const payload = JSON.parse(text) as {
      message?: string;
      error?: string;
      errors?: Record<string, string>;
    };
    if (payload.message) return payload.message;
    if (payload.error) return payload.error;
    if (payload.errors) return Object.values(payload.errors).join(" ");
    return fallback;
  } catch {
    return text;
  }
}

export default function ReviewModal({
  isOpen,
  onClose,
  productId,
  productName,
  productImage,
  variantLabel,
  onSubmitted,
  onRequireLogin,
}: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    void Promise.resolve().then(() => {
      setRating(0);
      setHoverRating(0);
      setReviewText("");
      setError("");
      setIsSubmitting(false);
    });
  }, [isOpen, productId]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (rating < 1 || rating > 5) {
      setError("Vui lòng chọn từ 1 đến 5 sao.");
      return;
    }

    const comment = reviewText.trim();
    if (comment.length > 500) {
      setError("Nội dung đánh giá không được vượt quá 500 ký tự.");
      return;
    }

    const token = getAccessToken();
    if (!token) {
      setError("Bạn cần đăng nhập để đánh giá sản phẩm.");
      onRequireLogin?.();
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({
          productId,
          rating,
          comment: comment || null,
        }),
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      const savedReview = await parseJsonResponse<ReviewResponse>(response);
      await onSubmitted(savedReview);
      onClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Không thể gửi đánh giá. Vui lòng thử lại.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-gray-900/50 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={isSubmitting ? undefined : onClose}
        aria-label="Đóng cửa sổ đánh giá"
      />

      <div className="relative z-10 flex max-h-[90vh] w-full max-w-[600px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-6 py-5">
          <h2
            id="review-modal-title"
            className="text-xl font-bold text-gray-800"
          >
            Đánh giá sản phẩm
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 font-bold text-gray-500 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-6">
          <div className="mb-7 flex items-center gap-4">
            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-100 text-xs text-gray-400">
              {productImage ? (
                <Image
                  src={productImage}
                  alt={productName}
                  fill
                  sizes="64px"
                  className="object-contain p-1"
                />
              ) : (
                "Không có ảnh"
              )}
            </div>
            <div className="min-w-0">
              <h3 className="line-clamp-2 text-base font-bold text-gray-800">
                {productName}
              </h3>
              {variantLabel && (
                <p className="mt-1 text-sm text-gray-500">
                  Phân loại: {variantLabel}
                </p>
              )}
            </div>
          </div>

          <div className="mb-7">
            <h4 className="mb-3 text-base font-bold text-gray-800">
              Chất lượng sản phẩm
            </h4>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EE4D2D]"
                    aria-label={`${star} sao`}
                  >
                    <svg
                      className={`h-10 w-10 ${
                        star <= (hoverRating || rating)
                          ? "text-[#FBBF24]"
                          : "text-gray-300"
                      }`}
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  </button>
                ))}
              </div>
              <span className="font-bold text-[#EE4D2D]">
                {(hoverRating || rating) > 0
                  ? RATING_LABELS[(hoverRating || rating) - 1]
                  : "Chọn số sao"}
              </span>
            </div>
          </div>

          <div className="relative">
            <textarea
              className="h-36 w-full resize-none rounded-xl border border-gray-300 bg-gray-50 p-4 pb-8 text-sm text-gray-800 outline-none focus:border-[#EE4D2D] focus:ring-1 focus:ring-[#EE4D2D]"
              placeholder="Chia sẻ cảm nhận của bạn về sản phẩm (không bắt buộc)."
              value={reviewText}
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                setReviewText(event.target.value)
              }
              maxLength={500}
              disabled={isSubmitting}
            />
            <span className="absolute bottom-3 right-4 text-xs text-gray-400">
              {reviewText.length}/500
            </span>
          </div>

          <p className="mt-3 text-xs leading-5 text-gray-500">
            Bạn chỉ có thể đánh giá sản phẩm đã mua. Nếu đã từng đánh giá, nội
            dung mới sẽ cập nhật đánh giá trước đó.
          </p>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="mt-auto flex shrink-0 gap-4 border-t border-gray-200 bg-white p-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 rounded-lg border border-gray-300 py-3.5 font-bold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            TRỞ LẠI
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={rating === 0 || isSubmitting}
            className={`flex-1 rounded-lg py-3.5 font-bold text-white transition ${
              rating > 0 && !isSubmitting
                ? "bg-gradient-to-r from-[#EE4D2D] to-[#FFD400] shadow-md hover:opacity-90"
                : "cursor-not-allowed bg-gray-300"
            }`}
          >
            {isSubmitting ? "ĐANG GỬI..." : "HOÀN TẤT ĐÁNH GIÁ"}
          </button>
        </div>
      </div>
    </div>
  );
}
