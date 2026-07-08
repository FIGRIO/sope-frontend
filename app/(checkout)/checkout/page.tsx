"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CartHeader from "@/components/CartHeader";
import {
  CartResponse,
  PaymentMethod,
  PaymentProvider,
  createOrder,
  createPayment,
  formatVnd,
  getCart,
} from "@/lib/shop";

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD");
  const [recipientName, setRecipientName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Ho Chi Minh");
  const [district, setDistrict] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    setIsLoading(true);
    setError("");
    try {
      setCart(await getCart());
    } catch (err) {
      const message = err instanceof Error ? err.message : "Khong the tai gio hang.";
      setError(message);
      if (message.toLowerCase().includes("dang nhap")) {
        router.push("/login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!cart || cart.items.length === 0) {
      setError("Gio hang dang trong.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const shippingAddress = [addressLine, district, city].filter(Boolean).join(", ");
      const order = await createOrder({
        recipientName,
        phone,
        shippingAddress,
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
        orderInfo: `Thanh toan don hang ${order.orderCode}`,
      });

      const params = new URLSearchParams({
        orderCode: order.orderCode,
        method: paymentMethod,
        total: String(order.totalAmount),
      });

      if (payment.paymentUrl) {
        params.set("paymentUrl", payment.paymentUrl);
      }
      router.push(`/checkout/success?${params.toString()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Khong the dat hang.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const items = cart?.items ?? [];
  const totalAmount = cart?.totalAmount ?? 0;

  return (
    <div className="min-h-screen bg-[#F4F6F8] pb-20">
      <CartHeader title="Thanh toan don hang" currentStep={2} />

      <main className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="rounded-xl bg-white p-10 text-center text-sm font-medium text-gray-500 shadow-sm">
            Dang tai don hang...
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl bg-white p-10 text-center shadow-sm">
            <h2 className="text-lg font-bold text-gray-800">Khong co san pham de thanh toan</h2>
            <button
              onClick={() => router.push("/cart")}
              className="mt-6 rounded-lg bg-[#EE4D2D] px-6 py-3 text-sm font-bold text-white transition hover:bg-orange-600"
            >
              Quay lai gio hang
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-6 lg:flex-row">
            <div className="flex-1 space-y-6">
              <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                <h2 className="mb-5 text-base font-bold text-gray-800">1. Thong tin nguoi nhan</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <input
                    required
                    value={recipientName}
                    onChange={(event) => setRecipientName(event.target.value)}
                    type="text"
                    placeholder="Ho va ten"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#EE4D2D] focus:ring-1 focus:ring-[#EE4D2D]"
                  />
                  <input
                    required
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    type="tel"
                    placeholder="So dien thoai"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#EE4D2D] focus:ring-1 focus:ring-[#EE4D2D]"
                  />
                </div>
              </section>

              <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                <h2 className="mb-5 text-base font-bold text-gray-800">2. Dia chi giao hang</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <input
                    required
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                    placeholder="Tinh / Thanh pho"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#EE4D2D] focus:ring-1 focus:ring-[#EE4D2D]"
                  />
                  <input
                    required
                    value={district}
                    onChange={(event) => setDistrict(event.target.value)}
                    placeholder="Quan / Huyen"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#EE4D2D] focus:ring-1 focus:ring-[#EE4D2D]"
                  />
                  <input
                    required
                    value={addressLine}
                    onChange={(event) => setAddressLine(event.target.value)}
                    placeholder="So nha, ten duong"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#EE4D2D] focus:ring-1 focus:ring-[#EE4D2D] sm:col-span-2"
                  />
                  <input
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Ghi chu"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#EE4D2D] focus:ring-1 focus:ring-[#EE4D2D] sm:col-span-2"
                  />
                </div>
              </section>

              <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                <h2 className="mb-5 text-base font-bold text-gray-800">3. Phuong thuc thanh toan</h2>
                <div className="space-y-3">
                  {paymentOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-all ${
                        paymentMethod === option.value
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
                    Don hang cua ban ({cart?.totalItems ?? 0} san pham)
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
                  <div className="flex items-end justify-between mb-6">
                    <span className="text-sm font-bold text-gray-800">Tong cong:</span>
                    <span className="text-2xl font-extrabold leading-none text-[#EE4D2D]">
                      {formatVnd(totalAmount)}
                    </span>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-lg bg-gradient-to-r from-[#EE4D2D] to-[#FFD400] py-3.5 text-sm font-bold tracking-wide text-white shadow-md transition hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSubmitting ? "DANG XU LY..." : "XAC NHAN DAT HANG"}
                  </button>
                </div>
              </div>
            </aside>
          </form>
        )}
      </main>
    </div>
  );
}

const paymentOptions: Array<{ value: PaymentMethod; label: string }> = [
  { value: "COD", label: "Thanh toan khi nhan hang (COD)" },
  { value: "VNPAY", label: "Thanh toan qua VNPAY" },
  { value: "MOMO", label: "Thanh toan qua vi MoMo" },
];
