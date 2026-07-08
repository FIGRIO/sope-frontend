"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import CartHeader from "@/components/CartHeader";
import { formatVnd, simulateBankTransfer } from "@/lib/shop";
import type { PaymentMethod } from "@/lib/shop";

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const orderCode = searchParams.get("orderCode") ?? "";
  const method = (searchParams.get("method") ?? "COD") as PaymentMethod;
  const paymentUrl = searchParams.get("paymentUrl") ?? "";
  const paymentId = Number(searchParams.get("paymentId") ?? 0);
  const total = Number(searchParams.get("total") ?? 0);
  const isOnlinePayment = method !== "COD";
  const canSimulatePayment = isOnlinePayment && Number.isFinite(paymentId) && paymentId > 0;
  const [paymentStatus, setPaymentStatus] = useState(isOnlinePayment ? "PENDING" : "CREATED");
  const [transactionId, setTransactionId] = useState("");
  const [paymentMessage, setPaymentMessage] = useState("");
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);

  const handleSimulateTransfer = async () => {
    if (!canSimulatePayment || paymentStatus === "SUCCESS") return;

    setIsConfirmingPayment(true);
    setPaymentMessage("");
    try {
      const payment = await simulateBankTransfer(paymentId);
      setPaymentStatus(payment.status);
      setTransactionId(payment.transactionId ?? "");
      setPaymentMessage("Đã ghi nhận thanh toán và cập nhật doanh thu cho admin.");
    } catch (err) {
      setPaymentMessage(err instanceof Error ? err.message : "Không thể xác nhận thanh toán.");
    } finally {
      setIsConfirmingPayment(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] pb-20">
      <CartHeader title="Hoàn tất đơn hàng" currentStep={3} />

      <main className="mx-auto mt-8 max-w-3xl px-4 sm:px-6 lg:px-8">
        <section className="rounded-xl border border-gray-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-3xl font-black text-green-600">
            OK
          </div>

          <h1 className="text-2xl font-extrabold text-gray-900">Đặt hàng thành công</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-gray-600">
            Đơn hàng của bạn đã được tạo. Nếu chọn VNPAY hoặc MoMo, hãy hoàn tất bước chuyển
            khoản giả lập để hệ thống lưu lịch sử thanh toán.
          </p>

          <div className="mt-7 rounded-lg border border-gray-100 bg-gray-50 p-5 text-left">
            <div className="flex items-center justify-between gap-4 py-2 text-sm">
              <span className="font-medium text-gray-500">Mã đơn hàng</span>
              <span className="font-bold text-gray-900">{orderCode || "Đang cập nhật"}</span>
            </div>
            <div className="flex items-center justify-between gap-4 py-2 text-sm">
              <span className="font-medium text-gray-500">Phương thức</span>
              <span className="font-bold text-gray-900">{method}</span>
            </div>
            {total > 0 && (
              <div className="flex items-center justify-between gap-4 py-2 text-sm">
                <span className="font-medium text-gray-500">Tổng thanh toán</span>
                <span className="font-bold text-[#EE4D2D]">{formatVnd(total)}</span>
              </div>
            )}
            {isOnlinePayment && (
              <div className="flex items-center justify-between gap-4 py-2 text-sm">
                <span className="font-medium text-gray-500">Trạng thái thanh toán</span>
                <span className={paymentStatus === "SUCCESS" ? "font-bold text-green-600" : "font-bold text-amber-600"}>
                  {paymentStatus}
                </span>
              </div>
            )}
            {transactionId && (
              <div className="flex items-center justify-between gap-4 py-2 text-sm">
                <span className="font-medium text-gray-500">Mã giao dịch</span>
                <span className="break-all text-right font-bold text-gray-900">{transactionId}</span>
              </div>
            )}
          </div>

          {isOnlinePayment && (
            <div className="mt-5 rounded-xl border border-orange-100 bg-orange-50 p-5 text-left">
              <h2 className="text-sm font-extrabold uppercase tracking-wide text-[#EE4D2D]">
                Chuyển khoản giả lập qua {method}
              </h2>
              <div className="mt-4 space-y-3 text-sm text-gray-700">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-medium text-gray-500">Ngân hàng</span>
                  <span className="font-bold text-gray-900">SOPE Demo Bank</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="font-medium text-gray-500">Số tài khoản</span>
                  <span className="font-bold text-gray-900">9704 0000 0000 8888</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="font-medium text-gray-500">Người nhận</span>
                  <span className="font-bold text-gray-900">SOPE E-COMMERCE</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="font-medium text-gray-500">Nội dung</span>
                  <span className="font-bold text-gray-900">{orderCode || "Mã đơn hàng"}</span>
                </div>
              </div>
              <p className="mt-4 text-xs leading-5 text-gray-500">
                Đây là bước mô phỏng cho đồ án: bấm nút bên dưới sẽ tạo mã giao dịch demo, lưu lịch
                sử thanh toán và cập nhật đơn hàng thành PAID.
              </p>
              {paymentMessage && (
                <div
                  className={`mt-4 rounded-lg px-4 py-3 text-sm font-semibold ${
                    paymentStatus === "SUCCESS"
                      ? "border border-green-200 bg-green-50 text-green-700"
                      : "border border-red-200 bg-red-50 text-red-700"
                  }`}
                >
                  {paymentMessage}
                </div>
              )}
              <button
                type="button"
                onClick={handleSimulateTransfer}
                disabled={!canSimulatePayment || isConfirmingPayment || paymentStatus === "SUCCESS"}
                className="mt-5 w-full rounded-lg bg-[#EE4D2D] px-6 py-3 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isConfirmingPayment
                  ? "ĐANG XÁC NHẬN..."
                  : paymentStatus === "SUCCESS"
                    ? "ĐÃ THANH TOÁN"
                    : "TÔI ĐÃ CHUYỂN KHOẢN"}
              </button>
              {!canSimulatePayment && (
                <p className="mt-3 text-xs font-semibold text-red-600">
                  Không tìm thấy mã giao dịch để xác nhận. Vui lòng tạo lại thanh toán.
                </p>
              )}
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            {isOnlinePayment && paymentUrl.length > 0 && (
              <a
                href={paymentUrl}
                className="rounded-lg border border-[#EE4D2D] bg-white px-6 py-3 text-sm font-bold text-[#EE4D2D] transition hover:bg-orange-50"
              >
                Mở cổng thanh toán sandbox
              </a>
            )}
            <Link
              href="/"
              className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
            >
              Về trang chính
            </Link>
            <Link
              href="/products"
              className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
            >
              Tiếp tục mua sắm
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
          <CartHeader title="Hoàn tất đơn hàng" currentStep={3} />
          <div className="mx-auto mt-8 max-w-3xl px-4 text-center text-sm font-medium text-gray-500">
            Đang tải thông tin đơn hàng...
          </div>
        </div>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}
