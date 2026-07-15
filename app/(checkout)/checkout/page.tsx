"use client";

import React, { useCallback, useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CartHeader from "@/components/CartHeader";
import {
  CartResponse,
  PaymentMethod,
  PaymentProvider,
  CouponPreviewResponse, // D07
  createOrder,
  createPayment,
  formatVnd,
  getCart,
  calculateDeliveryDate,
  applyCouponPreview // D07
} from "@/lib/shop";

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCoupon = searchParams.get("coupon"); // Bắt mã từ URL

  const [cart, setCart] = useState<CartResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // D07 States
  const [appliedCoupon, setAppliedCoupon] = useState<CouponPreviewResponse | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD");
  const [recipientName, setRecipientName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Hồ Chí Minh");
  const [district, setDistrict] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [note, setNote] = useState("");

  const loadCartAndCoupon = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      await getCart();
      const cartData = await getCart();
      setCart(cartData);

      // Nếu có truyền param coupon từ giỏ hàng, tự động apply
      if (initialCoupon && cartData.items.length > 0) {
        try {
          const preview = await applyCouponPreview(initialCoupon);
          setAppliedCoupon(preview);
        } catch {
          // Bỏ qua lỗi nếu mã hết hạn/sai để không block checkout
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
  }, [router, initialCoupon]);

  useEffect(() => {
    void loadCartAndCoupon();
  }, [loadCartAndCoupon]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!cart || cart.items.length === 0) {
      setError("Giỏ hàng đang trống.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const shippingAddress = [addressLine, district, city].filter(Boolean).join(", ");

      // D07: Bổ sung couponCode, province, shippingMethodCode
      const order = await createOrder({
        recipientName,
        phone,
        shippingAddress,
        province: city,
        shippingMethodCode: "STANDARD",
        couponCode: appliedCoupon?.couponCode,
        note,
        paymentMethod,
      });

      if (paymentMethod === "COD") {
        setCart({ ...cart, items: [], totalItems: 0, totalAmount: 0 });
        const params = new URLSearchParams({
          orderCode: order.orderCode,
          method: paymentMethod,
          total: String(order.totalAmount),
        });
        router.push(`/checkout/success?${params.toString()}`);
        return;
      }

      const provider = paymentMethod as PaymentProvider;
      const payment = await createPayment({
        orderId: order.orderCode,
        amount: order.totalAmount,
        provider,
        orderInfo: `Thanh toán đơn hàng ${order.orderCode}`,
      });

      const params = new URLSearchParams({
        orderCode: order.orderCode,
        method: paymentMethod,
        total: String(order.totalAmount),
        paymentId: String(payment.id),
      });

      if (payment.paymentUrl) {
        params.set("paymentUrl", payment.paymentUrl);
      }
      setCart({ ...cart, items: [], totalItems: 0, totalAmount: 0 });
      router.push(`/checkout/success?${params.toString()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể đặt hàng.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const items = cart?.items ?? [];
  const totalAmount = cart?.totalAmount ?? 0;
  const finalTotal = appliedCoupon ? appliedCoupon.totalBeforeShipping : totalAmount;
  const hasValidAddress = Boolean(city.trim() && district.trim() && addressLine.trim());

  return (
    <main className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-xl bg-white p-10 text-center text-sm font-medium text-gray-500 shadow-sm">
          Đang tải đơn hàng...
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl bg-white p-10 text-center shadow-sm">
          <h2 className="text-lg font-bold text-gray-800">Không có sản phẩm để thanh toán</h2>
          <button
            onClick={() => router.push("/cart")}
            className="mt-6 rounded-lg bg-[#EE4D2D] px-6 py-3 text-sm font-bold text-white transition hover:bg-orange-600"
          >
            Quay lại giỏ hàng
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 lg:flex-row">
          <div className="flex-1 space-y-6">
            <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-base font-bold text-gray-800">1. Thông tin người nhận</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <input
                  required
                  value={recipientName}
                  onChange={(event) => setRecipientName(event.target.value)}
                  type="text"
                  placeholder="Họ và tên"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-black placeholder:text-gray-400 outline-none transition focus:border-[#EE4D2D] focus:ring-1 focus:ring-[#EE4D2D]"
                />
                <input
                  required
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  type="tel"
                  placeholder="Số điện thoại"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-black placeholder:text-gray-400 outline-none transition focus:border-[#EE4D2D] focus:ring-1 focus:ring-[#EE4D2D]"
                />
              </div>
            </section>

            <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-base font-bold text-gray-800">2. Địa chỉ giao hàng</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <input
                  required
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  placeholder="Tỉnh / Thành phố"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-black placeholder:text-gray-400 outline-none transition focus:border-[#EE4D2D] focus:ring-1 focus:ring-[#EE4D2D]"
                />
                <input
                  required
                  value={district}
                  onChange={(event) => setDistrict(event.target.value)}
                  placeholder="Quận / Huyện"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-black placeholder:text-gray-400 outline-none transition focus:border-[#EE4D2D] focus:ring-1 focus:ring-[#EE4D2D]"
                />
                <input
                  required
                  value={addressLine}
                  onChange={(event) => setAddressLine(event.target.value)}
                  placeholder="Số nhà, tên đường"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-black placeholder:text-gray-400 outline-none transition focus:border-[#EE4D2D] focus:ring-1 focus:ring-[#EE4D2D] sm:col-span-2"
                />
                <input
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Ghi chú"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-black placeholder:text-gray-400 outline-none transition focus:border-[#EE4D2D] focus:ring-1 focus:ring-[#EE4D2D] sm:col-span-2"
                />
              </div>
            </section>

            <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-base font-bold text-gray-800">3. Phương thức thanh toán</h2>
              <div className="space-y-3">
                {paymentOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-all ${paymentMethod === option.value
                      ? "border-[#EE4D2D] bg-orange-50/10 shadow-sm"
                      : "border-gray-200 hover:bg-gray-50"
                      }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={option.value}
                      checked={paymentMethod === option.value}
                      onChange={() => setPaymentMethod(option.value)}
                      className="h-4 w-4 text-[#EE4D2D] focus:ring-[#EE4D2D]"
                    />
                    <span className="text-sm font-bold text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </section>
          </div>

          <aside className="w-full shrink-0 lg:w-[360px]">
            <div className="sticky top-[100px] rounded-xl border border-gray-100 bg-white shadow-sm">
              <div className="p-5">
                <h2 className="mb-4 text-base font-bold text-gray-800">
                  Đơn hàng của bạn ({cart?.totalItems ?? 0} sản phẩm)
                </h2>
                <div className="mb-5 space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded border border-gray-100 bg-gray-50 text-[10px] text-gray-400">
                        {item.imgUrl ? (
                          <img src={item.imgUrl} alt={item.name} className="h-full w-full object-contain p-1" />
                        ) : (
                          "IMG"
                        )}
                      </div>
                      <div className="flex flex-1 flex-col justify-between">
                        <h3 className="line-clamp-1 text-xs font-bold text-gray-700">{item.name}</h3>
                        <div className="flex items-end justify-between">
                          <span className="text-xs text-gray-500">SL: {item.quantity}</span>
                          <span className="text-xs font-bold text-gray-800">{formatVnd(item.lineTotal)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="my-4 border-t border-gray-200" />

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Tạm tính</span>
                    <span className="font-medium text-gray-800">{formatVnd(totalAmount)}</span>
                  </div>

                  {/* Task D07: Hiển thị số tiền giảm giá nếu có */}
                  {appliedCoupon && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Mã giảm giá ({appliedCoupon.couponCode})</span>
                      <span className="font-bold">- {formatVnd(appliedCoupon.discountAmount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Phí giao hàng</span>
                    <span className="font-medium text-gray-800">Miễn phí</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4 text-sm text-gray-600 border-t border-gray-100 pt-4">
                  <span>Dự kiến giao hàng:</span>
                  <span className={hasValidAddress ? "font-bold text-blue-600" : "font-medium text-amber-600"}>
                    {hasValidAddress ? calculateDeliveryDate() : "Vui lòng nhập địa chỉ"}
                  </span>
                </div>

                <div className="flex items-end justify-between mb-6">
                  <span className="text-sm font-bold text-gray-800">Tổng cộng:</span>
                  <span className="text-2xl font-extrabold leading-none text-[#EE4D2D]">
                    {formatVnd(finalTotal)}
                  </span>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting || !hasValidAddress}
                  className="w-full rounded-lg bg-gradient-to-r from-[#EE4D2D] to-[#FFD400] py-3.5 text-sm font-bold tracking-wide text-white shadow-md transition hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? "ĐANG XỬ LÝ..." : "XÁC NHẬN ĐẶT HÀNG"}
                </button>
              </div>
            </div>
          </aside>
        </form>
      )}
    </main>
  );
}

const paymentOptions: Array<{ value: PaymentMethod; label: string }> = [
  { value: "COD", label: "Thanh toán khi nhận hàng (COD)" },
  { value: "VNPAY", label: "Thanh toán qua VNPAY" },
  { value: "MOMO", label: "Thanh toán qua ví MoMo" },
];

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-[#F4F6F8] pb-20">
      <CartHeader title="Thanh toán đơn hàng" currentStep={2} />
      <Suspense fallback={<div className="text-center p-10">Đang tải trang thanh toán...</div>}>
        <CheckoutContent />
      </Suspense>
    </div>
  );
}