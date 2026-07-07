"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CartHeader from "@/components/CartHeader";
import {
  CartResponse,
  formatVnd,
  getCart,
  removeCartItem,
  updateCartItem,
} from "@/lib/shop";

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionItemId, setActionItemId] = useState<number | null>(null);
  const [error, setError] = useState("");

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

  const changeQuantity = async (itemId: number, quantity: number) => {
    if (quantity < 1) return;
    setActionItemId(itemId);
    setError("");
    try {
      setCart(await updateCartItem(itemId, quantity));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Khong the cap nhat gio hang.");
    } finally {
      setActionItemId(null);
    }
  };

  const removeItem = async (itemId: number) => {
    setActionItemId(itemId);
    setError("");
    try {
      setCart(await removeCartItem(itemId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Khong the xoa san pham.");
    } finally {
      setActionItemId(null);
    }
  };

  const items = cart?.items ?? [];
  const totalAmount = cart?.totalAmount ?? 0;

  return (
    <div className="min-h-screen bg-[#F4F6F8] pb-20">
      <CartHeader title="Gio hang" currentStep={1} />

      <main className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="rounded-xl bg-white p-10 text-center text-sm font-medium text-gray-500 shadow-sm">
            Dang tai gio hang...
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl bg-white p-10 text-center shadow-sm">
            <h2 className="text-lg font-bold text-gray-800">Gio hang dang trong</h2>
            <p className="mt-2 text-sm text-gray-500">Hay them san pham truoc khi thanh toan.</p>
            <button
              onClick={() => router.push("/products")}
              className="mt-6 rounded-lg bg-[#EE4D2D] px-6 py-3 text-sm font-bold text-white transition hover:bg-orange-600"
            >
              Xem san pham
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-6 lg:flex-row">
            <div className="flex-1 space-y-4">
              <div className="hidden grid-cols-12 items-center rounded-xl bg-white p-4 text-sm font-medium text-gray-500 shadow-sm md:grid">
                <div className="col-span-5">San pham</div>
                <div className="col-span-2 text-center">Don gia</div>
                <div className="col-span-2 text-center">So luong</div>
                <div className="col-span-2 text-center">So tien</div>
                <div className="col-span-1 text-center">Thao tac</div>
              </div>

              <div className="flex flex-col gap-4">
                {items.map((item) => {
                  const isBusy = actionItemId === item.id;
                  return (
                    <div
                      key={item.id}
                      className="grid grid-cols-1 items-center gap-4 rounded-xl bg-white p-4 shadow-sm md:grid-cols-12"
                    >
                      <div className="col-span-5 flex items-start gap-4 md:items-center">
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50 text-xs text-gray-400">
                          {item.imgUrl ? (
                            <img src={item.imgUrl} alt={item.name} className="h-full w-full object-contain p-1" />
                          ) : (
                            "IMG"
                          )}
                        </div>
                        <div className="flex min-w-0 flex-col justify-center">
                          <h3 className="line-clamp-2 text-sm font-medium leading-snug text-gray-800">
                            {item.name}
                          </h3>
                        </div>
                      </div>

                      <div className="hidden col-span-2 text-center text-sm font-medium text-gray-600 md:block">
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
                            disabled={isBusy}
                            className="flex h-full w-8 items-center justify-center text-gray-500 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="col-span-2 text-center text-sm font-bold text-[#EE4D2D]">
                        {formatVnd(item.lineTotal)}
                      </div>

                      <div className="col-span-1 flex justify-center">
                        <button
                          onClick={() => removeItem(item.id)}
                          disabled={isBusy}
                          className="text-gray-400 transition-colors hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label="Xoa san pham"
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
              <div className="sticky top-[100px] rounded-xl bg-white shadow-sm">
                <div className="p-5">
                  <h2 className="mb-4 text-base font-bold text-gray-800">Tong quan don hang</h2>
                  <div className="space-y-3 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Tam tinh ({cart?.totalItems ?? 0} san pham)</span>
                      <span className="font-medium text-gray-800">{formatVnd(totalAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Phi giao hang</span>
                      <span className="font-medium text-gray-800">Tinh khi dat hang</span>
                    </div>
                  </div>
                  <div className="my-4 border-t border-gray-200" />
                  <div className="flex items-end justify-between">
                    <span className="text-sm font-medium text-gray-800">Tong tien</span>
                    <span className="text-2xl font-extrabold leading-none text-[#EE4D2D]">
                      {formatVnd(totalAmount)}
                    </span>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <button
                    onClick={() => router.push("/checkout")}
                    className="w-full rounded-lg bg-gradient-to-r from-[#EE4D2D] to-[#FFD400] py-3.5 text-base font-bold text-white shadow-md transition hover:opacity-90 active:scale-[0.98]"
                  >
                    MUA HANG
                  </button>
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
