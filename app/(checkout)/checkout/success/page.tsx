"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import CartHeader from "@/components/CartHeader";
import { formatVnd } from "@/lib/shop";
import type { PaymentMethod } from "@/lib/shop";

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const orderCode = searchParams.get("orderCode") ?? "";
  const method = (searchParams.get("method") ?? "COD") as PaymentMethod;
  const paymentUrl = searchParams.get("paymentUrl") ?? "";
  const total = Number(searchParams.get("total") ?? 0);
  const needsOnlinePayment = method !== "COD" && paymentUrl.length > 0;

  return (
    <div className="min-h-screen bg-[#F4F6F8] pb-20">
      <CartHeader title="Hoan tat don hang" currentStep={3} />

      <main className="mx-auto mt-8 max-w-3xl px-4 sm:px-6 lg:px-8">
        <section className="rounded-xl border border-gray-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-3xl font-black text-green-600">
            OK
          </div>

          <h1 className="text-2xl font-extrabold text-gray-900">Dat hang thanh cong</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-gray-600">
            Don hang cua ban da duoc tao. Hay hoan tat buoc thanh toan neu ban chon VNPAY hoac MoMo,
            sau do ban co the quay ve trang chinh.
          </p>

          <div className="mt-7 rounded-lg border border-gray-100 bg-gray-50 p-5 text-left">
            <div className="flex items-center justify-between gap-4 py-2 text-sm">
              <span className="font-medium text-gray-500">Ma don hang</span>
              <span className="font-bold text-gray-900">{orderCode || "Dang cap nhat"}</span>
            </div>
            <div className="flex items-center justify-between gap-4 py-2 text-sm">
              <span className="font-medium text-gray-500">Phuong thuc</span>
              <span className="font-bold text-gray-900">{method}</span>
            </div>
            {total > 0 && (
              <div className="flex items-center justify-between gap-4 py-2 text-sm">
                <span className="font-medium text-gray-500">Tong thanh toan</span>
                <span className="font-bold text-[#EE4D2D]">{formatVnd(total)}</span>
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            {needsOnlinePayment && (
              <a
                href={paymentUrl}
                className="rounded-lg bg-[#EE4D2D] px-6 py-3 text-sm font-bold text-white transition hover:bg-orange-600"
              >
                Tiep tuc thanh toan
              </a>
            )}
            <Link
              href="/"
              className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
            >
              Ve trang chinh
            </Link>
            <Link
              href="/products"
              className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
            >
              Tiep tuc mua sam
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F4F6F8]">
          <CartHeader title="Hoan tat don hang" currentStep={3} />
          <div className="mx-auto mt-8 max-w-3xl px-4 text-center text-sm font-medium text-gray-500">
            Dang tai thong tin don hang...
          </div>
        </div>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}
