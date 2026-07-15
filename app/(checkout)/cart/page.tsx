"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import CartHeader from "@/components/CartHeader";
import {
  type CartItem,
  type CartResponse,
  type CouponPreviewResponse,
  formatVnd,
  getCart,
  removeCartItem,
  updateCartItem,
  calculateDeliveryDate,
  applyCouponPreview // Task D07
} from "@/lib/shop";

function buildVariantLabel(item: CartItem): string | null {
  const parts: string[] = [];
  if (item.colorName) parts.push(item.colorName);
  if (item.storageName) parts.push(item.storageName);
  return parts.length > 0 ? parts.join(", ") : null;
}

function getStockWarning(item: CartItem): string | null {
  if (item.inStock === false) {
    return "Sản phẩm hiện đã hết hàng";
  }
  if (
    item.availableQuantity != null &&
    item.availableQuantity < item.quantity
  ) {
    if (item.availableQuantity <= 0) {
      return "Sản phẩm hiện đã hết hàng";
    }
    return `Không đủ số lượng (chỉ còn ${item.availableQuantity} sản phẩm)`;
  }
  return null;
}

function isIncrementDisabled(item: CartItem): boolean {
  if (item.inStock === false) return true;
  if (
    item.availableQuantity != null &&
    item.quantity >= item.availableQuantity
  ) {
    return true;
  }
  return false;
}

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionItemId, setActionItemId] = useState<number | null>(null);
  const [error, setError] = useState("");

  // --- Task D07 States ---
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<CouponPreviewResponse | null>(null);
  const [couponError, setCouponError] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  // Ref giữ coupon code hiện tại để dùng trong loadCart mà không gây vòng lặp dependency
  const appliedCouponCodeRef = useRef<string | null>(null);
  useEffect(() => {
    appliedCouponCodeRef.current = appliedCoupon?.couponCode ?? null;
  }, [appliedCoupon]);

  const loadCart = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const cartData = await getCart();
      setCart(cartData);

      // Nếu có mã đang áp dụng, tự động cập nhật lại giảm giá khi giỏ hàng đổi
      const currentCouponCode = appliedCouponCodeRef.current;
      if (currentCouponCode) {
        try {
          const newPreview = await applyCouponPreview(currentCouponCode);
          setAppliedCoupon(newPreview);
        } catch {
          setAppliedCoupon(null);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không thể tải giỏ hàng.";
      setError(message);
      if (message.toLowerCase().includes("dang nhap")) {
        router.push("/login");
      }
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void Promise.resolve().then(loadCart);
  }, [loadCart]);

  const changeQuantity = async (itemId: number, quantity: number) => {
    if (quantity < 1) return;
    setActionItemId(itemId);
    setError("");
    try {
      setCart(await updateCartItem(itemId, quantity));
      // Xóa mã giảm giá nếu giỏ hàng bị thay đổi (buộc tính lại)
      setAppliedCoupon(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể cập nhật giỏ hàng.");
    } finally {
      setActionItemId(null);
    }
  };

  const removeItem = async (itemId: number) => {
    setActionItemId(itemId);
    setError("");
    try {
      setCart(await removeCartItem(itemId));
      setAppliedCoupon(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể xóa sản phẩm.");
    } finally {
      setActionItemId(null);
    }
  };

  // --- Task D07: Hàm áp dụng mã giảm giá ---
  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim() || !cart || cart.items.length === 0) return;

    setIsApplyingCoupon(true);
    setCouponError("");
    try {
      const response = await applyCouponPreview(couponInput.trim().toUpperCase());
      setAppliedCoupon(response);
      setCouponInput("");
    } catch (err) {
      setCouponError(err instanceof Error ? err.message : "Mã giảm giá không hợp lệ.");
      setAppliedCoupon(null);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const items = cart?.items ?? [];
  const totalAmount = cart?.totalAmount ?? 0;
  const finalTotal = appliedCoupon ? appliedCoupon.totalBeforeShipping : totalAmount;

  const hasStockViolation = useMemo(() => {
    return items.some((item) => getStockWarning(item) !== null);
  }, [items]);

  const handleCheckout = () => {
    // Chuyển coupon qua param để trang thanh toán tự động áp dụng
    if (appliedCoupon) {
      router.push(`/checkout?coupon=${appliedCoupon.couponCode}`);
    } else {
      router.push("/checkout");
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] pb-20">
      <CartHeader title="Giỏ hàng" currentStep={1} />

      <main className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {!isLoading && items.length > 0 && hasStockViolation && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            <svg className="h-5 w-5 shrink-0 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            Một số sản phẩm trong giỏ đã hết hàng hoặc không đủ số lượng. Vui lòng cập nhật trước khi thanh toán.
          </div>
        )}

        {isLoading ? (
          <div className="rounded-xl bg-white p-10 text-center text-sm font-medium text-gray-500 shadow-sm">
            Đang tải giỏ hàng...
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl bg-white p-10 text-center shadow-sm">
            <h2 className="text-lg font-bold text-gray-800">Giỏ hàng đang trống</h2>
            <p className="mt-2 text-sm text-gray-500">Hãy thêm sản phẩm trước khi thanh toán.</p>
            <button
              onClick={() => router.push("/products")}
              className="mt-6 rounded-lg bg-[#EE4D2D] px-6 py-3 text-sm font-bold text-white transition hover:bg-orange-600"
            >
              Xem sản phẩm
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-6 lg:flex-row">
            <div className="flex-1 space-y-4">
              <div className="hidden grid-cols-12 items-center rounded-xl bg-white p-4 text-sm font-medium text-gray-500 shadow-sm md:grid">
                <div className="col-span-5">Sản phẩm</div>
                <div className="col-span-2 text-center">Đơn giá</div>
                <div className="col-span-2 text-center">Số lượng</div>
                <div className="col-span-2 text-center">Số tiền</div>
                <div className="col-span-1 text-center">Thao tác</div>
              </div>

              <div className="flex flex-col gap-4">
                {items.map((item) => {
                  const isBusy = actionItemId === item.id;
                  const variantLabel = buildVariantLabel(item);
                  const stockWarning = getStockWarning(item);
                  const itemHasIssue = stockWarning !== null;
                  const cantIncrement = isIncrementDisabled(item);

                  return (
                    <div
                      key={item.id}
                      className={`grid grid-cols-1 items-center gap-4 rounded-xl bg-white p-4 shadow-sm md:grid-cols-12 ${itemHasIssue ? "border-2 border-red-200 bg-red-50/30" : ""
                        }`}
                    >
                      <div className="col-span-5 flex items-start gap-4 md:items-center">
                        <div className={`flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-gray-50 text-xs text-gray-400 ${itemHasIssue ? "border-red-200 opacity-60" : "border-gray-200"
                          }`}>
                          {item.imgUrl ? (
                            <img src={item.imgUrl} alt={item.name} className="h-full w-full object-contain p-1" />
                          ) : (
                            "IMG"
                          )}
                        </div>
                        <div className="flex min-w-0 flex-col justify-center">
                          <h3 className={`line-clamp-2 text-sm font-medium leading-snug ${itemHasIssue ? "text-gray-400" : "text-gray-800"
                            }`}>
                            {item.name}
                          </h3>

                          {variantLabel && (
                            <p className="mt-1 text-xs font-medium text-gray-500">
                              <span className="text-gray-400">Phân loại:</span>{" "}
                              {variantLabel}
                            </p>
                          )}

                          {stockWarning && (
                            <p className="mt-1 flex items-center gap-1 text-xs font-bold text-red-500">
                              <svg className="h-3.5 w-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              {stockWarning}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className={`hidden col-span-2 text-center text-sm font-medium md:block ${itemHasIssue ? "text-gray-400" : "text-gray-600"
                        }`}>
                        {formatVnd(item.price)}
                      </div>

                      <div className="col-span-2 flex items-center justify-center">
                        <div className="flex h-8 items-center rounded border border-gray-300">
                          <button
                            onClick={() => changeQuantity(item.id, item.quantity - 1)}
                            disabled={isBusy || item.quantity <= 1}
                            className="flex h-full w-8 items-center justify-center text-gray-500 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            -
                          </button>
                          <span className="flex h-full w-10 items-center justify-center border-x border-gray-300 text-sm font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => changeQuantity(item.id, item.quantity + 1)}
                            disabled={isBusy || cantIncrement}
                            className="flex h-full w-8 items-center justify-center text-gray-500 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                            title={cantIncrement ? "Đã đạt giới hạn tồn kho" : undefined}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className={`col-span-2 text-center text-sm font-bold ${itemHasIssue ? "text-gray-400 line-through" : "text-[#EE4D2D]"
                        }`}>
                        {formatVnd(item.lineTotal)}
                      </div>

                      <div className="col-span-1 flex justify-center">
                        <button
                          onClick={() => removeItem(item.id)}
                          disabled={isBusy}
                          className="text-gray-400 transition-colors hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label="Xóa sản phẩm"
                        >
                          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <aside className="w-full shrink-0 lg:w-[360px]">

              {/* --- Task D07: Giao diện Nhập Mã Giảm Giá --- */}
              <div className="mb-4 rounded-xl bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-sm font-bold text-gray-800 flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#EE4D2D]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path></svg>
                  Khuyến mãi
                </h2>

                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-green-700">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                      <span className="font-bold text-sm">Đã áp dụng mã: {appliedCoupon.couponCode}</span>
                    </div>
                    <button onClick={() => setAppliedCoupon(null)} className="text-gray-400 hover:text-red-500">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nhập mã giảm giá"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none uppercase placeholder:normal-case focus:border-[#EE4D2D]"
                    />
                    <button
                      type="submit"
                      disabled={isApplyingCoupon || !couponInput.trim() || hasStockViolation}
                      className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-bold text-white transition hover:bg-gray-700 disabled:opacity-50"
                    >
                      {isApplyingCoupon ? "Đang xử lý..." : "Áp dụng"}
                    </button>
                  </form>
                )}

                {couponError && <p className="mt-2 text-xs text-red-500">{couponError}</p>}
              </div>
              {/* ------------------------------------------- */}

              <div className="sticky top-[100px] rounded-xl bg-white shadow-sm">
                <div className="p-5">
                  <h2 className="mb-4 text-base font-bold text-gray-800">Tổng quan đơn hàng</h2>
                  <div className="space-y-3 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Tạm tính ({cart?.totalItems ?? 0} sản phẩm)</span>
                      <span className="font-medium text-gray-800">{formatVnd(totalAmount)}</span>
                    </div>

                    {/* Task D07: Hiển thị số tiền được giảm */}
                    {appliedCoupon && (
                      <div className="flex justify-between text-green-600">
                        <span>Giảm giá</span>
                        <span className="font-bold">- {formatVnd(appliedCoupon.discountAmount)}</span>
                      </div>
                    )}
                    {/* ------------------------------------ */}

                    <div className="flex justify-between">
                      <span>Phí giao hàng</span>
                      <span className="font-medium text-gray-800">Tính khi đặt hàng</span>
                    </div>

                    <div className="flex justify-between pt-3 border-t border-gray-100">
                      <span className="text-gray-500 font-medium">Dự kiến giao hàng</span>
                      <span className={`font-semibold ${hasStockViolation ? "text-red-500" : "text-blue-600"}`}>
                        {hasStockViolation ? "Không thể giao (Lỗi SP)" : calculateDeliveryDate()}
                      </span>
                    </div>
                  </div>
                  <div className="my-4 border-t border-gray-200" />
                  <div className="flex items-end justify-between">
                    <span className="text-sm font-medium text-gray-800">Tổng tiền</span>
                    <span className="text-2xl font-extrabold leading-none text-[#EE4D2D]">
                      {formatVnd(finalTotal)}
                    </span>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <button
                    onClick={handleCheckout}
                    disabled={hasStockViolation || actionItemId !== null}
                    className={`w-full rounded-lg py-3.5 text-base font-bold text-white shadow-md transition active:scale-[0.98] ${hasStockViolation
                      ? "cursor-not-allowed bg-gray-400 opacity-70"
                      : "bg-gradient-to-r from-[#EE4D2D] to-[#FFD400] hover:opacity-90"
                      }`}
                  >
                    {hasStockViolation ? "CẬP NHẬT GIỎ HÀNG ĐỂ TIẾP TỤC" : "MUA HÀNG"}
                  </button>
                  {hasStockViolation && (
                    <p className="mt-2 text-center text-xs font-medium text-red-500">
                      Vui lòng xóa hoặc cập nhật sản phẩm hết hàng trước khi đặt hàng.
                    </p>
                  )}
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}