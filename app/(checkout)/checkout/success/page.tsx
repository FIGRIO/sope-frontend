"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import CartHeader from "@/components/CartHeader";
import {
  formatVnd,
  getOrderById,
  getPayment,
  retryPayment,
  type OrderResponse,
  type PaymentResponse,
  type PaymentStatus,
} from "@/lib/shop";

const POLLABLE = new Set<PaymentStatus>(["PENDING", "PROCESSING"]);

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const paymentId = parsePositiveId(searchParams.get("paymentId"));
  const orderId = parsePositiveId(searchParams.get("orderId"));
  const safeError = searchParams.get("error");
  const missingIdentifierError = safeError === "payment_not_found"
    ? "Không tìm thấy giao dịch thanh toán."
    : "Thiếu mã giao dịch hoặc đơn hàng.";
  const [payment, setPayment] = useState<PaymentResponse | null>(null);
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(paymentId || orderId));
  const [isRetrying, setIsRetrying] = useState(false);
  const [error, setError] = useState(paymentId || orderId ? "" : missingIdentifierError);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function loadPayment() {
      if (!paymentId) return;
      try {
        const data = await getPayment(paymentId);
        if (!active) return;
        setPayment(data);
        setError("");
        if (POLLABLE.has(data.status)) {
          timer = setTimeout(loadPayment, 3000);
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Không thể tải giao dịch.");
      } finally {
        if (active) setIsLoading(false);
      }
    }

    async function loadOrder() {
      if (!orderId) return;
      try {
        const data = await getOrderById(orderId);
        if (active) setOrder(data);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Không thể tải đơn hàng.");
      } finally {
        if (active) setIsLoading(false);
      }
    }

    if (paymentId) void loadPayment();
    else if (orderId) void loadOrder();
    else return undefined;

    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [orderId, paymentId]);

  const handleRetry = async () => {
    if (!payment?.canRetry || isRetrying) return;
    setIsRetrying(true);
    setError("");
    try {
      const next = await retryPayment(payment.paymentId);
      const url = next.paymentUrl || next.payUrl;
      if (url) window.location.assign(url);
      else setPayment(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tạo lại giao dịch.");
    } finally {
      setIsRetrying(false);
    }
  };

  const presentation = payment ? statusPresentation(payment.status) : null;
  const detailOrderId = payment?.orderId ?? order?.id;

  return (
    <div className="min-h-screen bg-[#F4F6F8] pb-20">
      <CartHeader title="Kết quả thanh toán" currentStep={3} />
      <main className="mx-auto mt-8 max-w-4xl px-4 sm:px-6 lg:px-8">
        <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
          {isLoading ? (
            <ResultNotice tone="blue" title="Đang xác minh giao dịch" message="SOPE đang lấy trạng thái đã xác minh từ backend..." />
          ) : error ? (
            <ResultNotice tone="red" title="Không thể hiển thị kết quả" message={error} />
          ) : payment && presentation ? (
            <>
              <ResultNotice tone={presentation.tone} title={presentation.title} message={payment.responseMessage || presentation.message} />
              <div className="mt-7 grid gap-3 rounded-xl border border-gray-100 bg-gray-50 p-5 text-sm sm:grid-cols-2">
                <Detail label="Mã đơn hàng" value={payment.orderCode} />
                <Detail label="Payment ID" value={String(payment.paymentId)} />
                <Detail label="Số tiền" value={formatVnd(payment.amount)} highlight />
                <Detail label="Nhà cung cấp" value={payment.provider} />
                <Detail label="Trạng thái Payment" value={payment.status} />
                <Detail label="Trạng thái Order" value={payment.orderStatus} />
                <Detail label="Thời gian tạo" value={formatDate(payment.createdAt)} />
                <Detail label="Thời gian thanh toán" value={formatDate(payment.paidAt)} />
                <Detail label="Xác minh chữ ký" value={payment.signatureVerified ? "Hợp lệ" : "Chưa có callback/IPN hợp lệ"} />
                <Detail label="Provider Order ID" value={payment.providerOrderId} />
                <Detail label="Provider Request ID" value={payment.providerRequestId} />
                <Detail label="Mã giao dịch provider" value={payment.providerTransactionId} />
                <Detail label={payment.provider === "VNPAY" ? "vnp_ResponseCode" : "resultCode"} value={payment.responseCode} />
                <Detail label="Trạng thái provider" value={payment.transactionStatus} />
                {payment.provider === "VNPAY" && <Detail label="Ngân hàng" value={payment.bankCode} />}
                {payment.provider === "VNPAY" && <Detail label="Loại thẻ" value={payment.cardType} />}
                <Detail label="Thời gian provider" value={payment.payDate} />
              </div>

              {payment.qrCodeUrl && POLLABLE.has(payment.status) && (
                <div className="mt-6 rounded-xl border border-purple-100 bg-purple-50 p-5 text-center">
                  <p className="mb-4 text-sm font-bold text-purple-800">Mã QR do MoMo cung cấp</p>
                  <img src={payment.qrCodeUrl} alt="MoMo payment QR" className="mx-auto max-h-64 rounded-lg bg-white p-2" />
                </div>
              )}

              {POLLABLE.has(payment.status) && (
                <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Giao dịch chưa được xác nhận bởi IPN. Trang sẽ tự cập nhật sau mỗi 3 giây.
                </div>
              )}

              <div className="mt-7 flex flex-wrap justify-center gap-3">
                {payment.deeplink && POLLABLE.has(payment.status) && (
                  <a href={payment.deeplink} className="rounded-lg bg-purple-600 px-5 py-3 text-sm font-bold text-white hover:bg-purple-700">Mở ứng dụng MoMo</a>
                )}
                {(payment.payUrl || payment.paymentUrl) && POLLABLE.has(payment.status) && (
                  <a href={payment.payUrl || payment.paymentUrl || "#"} className="rounded-lg border border-[#EE4D2D] px-5 py-3 text-sm font-bold text-[#EE4D2D] hover:bg-orange-50">Mở cổng thanh toán</a>
                )}
                {payment.canRetry && (
                  <button type="button" disabled={isRetrying} onClick={handleRetry} className="rounded-lg bg-[#EE4D2D] px-5 py-3 text-sm font-bold text-white disabled:opacity-60">
                    {isRetrying ? "Đang tạo giao dịch..." : "Thử thanh toán lại"}
                  </button>
                )}
                {detailOrderId && <Link href={`/orders/${detailOrderId}`} className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50">Xem chi tiết đơn hàng</Link>}
                <Link href="/" className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50">Về trang chủ</Link>
              </div>
            </>
          ) : order ? (
            <>
              <ResultNotice tone="green" title="Đã tạo đơn hàng COD" message="Đơn hàng đã được ghi nhận. Bạn sẽ thanh toán khi nhận hàng." />
              <div className="mt-7 grid gap-3 rounded-xl border border-gray-100 bg-gray-50 p-5 text-sm sm:grid-cols-2">
                <Detail label="Mã đơn hàng" value={order.orderCode} />
                <Detail label="Phương thức" value={order.paymentMethod} />
                <Detail label="Tổng thanh toán" value={formatVnd(order.totalAmount)} highlight />
                <Detail label="Trạng thái đơn" value={order.status} />
              </div>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Link href={`/orders/${order.id}`} className="rounded-lg bg-[#EE4D2D] px-5 py-3 text-sm font-bold text-white">Xem chi tiết đơn hàng</Link>
                <Link href="/" className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-bold text-gray-700">Về trang chủ</Link>
              </div>
            </>
          ) : null}
        </section>
      </main>
    </div>
  );
}

function ResultNotice({ tone, title, message }: { tone: "green" | "blue" | "amber" | "red"; title: string; message: string }) {
  const colors = {
    green: "border-green-200 bg-green-50 text-green-800",
    blue: "border-blue-200 bg-blue-50 text-blue-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    red: "border-red-200 bg-red-50 text-red-800",
  }[tone];
  return <div className={`rounded-xl border p-6 text-center ${colors}`}><h1 className="text-2xl font-extrabold">{title}</h1><p className="mx-auto mt-2 max-w-2xl text-sm leading-6">{message}</p></div>;
}

function Detail({ label, value, highlight = false }: { label: string; value?: string | null; highlight?: boolean }) {
  return <div className="flex items-start justify-between gap-4 border-b border-gray-200 py-2"><span className="text-gray-500">{label}</span><span className={`break-all text-right font-bold ${highlight ? "text-[#EE4D2D]" : "text-gray-900"}`}>{value || "—"}</span></div>;
}

function parsePositiveId(raw: string | null) {
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? value : null;
}

function formatDate(raw?: string | null) {
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? raw : new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "medium" }).format(date);
}

function statusPresentation(status: PaymentStatus) {
  switch (status) {
    case "SUCCESS": return { tone: "green" as const, title: "Thanh toán thành công", message: "Giao dịch đã được backend xác minh." };
    case "FAILED": return { tone: "red" as const, title: "Giao dịch thất bại", message: "Cổng thanh toán không xác nhận giao dịch." };
    case "CANCELLED": return { tone: "amber" as const, title: "Giao dịch đã hủy", message: "Bạn đã hủy giao dịch tại cổng thanh toán." };
    case "EXPIRED": return { tone: "amber" as const, title: "Giao dịch hết hạn", message: "Hãy tạo một lần thanh toán mới nếu vẫn muốn tiếp tục." };
    case "REFUNDED": return { tone: "blue" as const, title: "Giao dịch đã hoàn tiền", message: "Khoản thanh toán đã được hoàn." };
    default: return { tone: "blue" as const, title: "Đang xác minh giao dịch", message: "SOPE đang chờ IPN từ cổng thanh toán." };
  }
}

export default function CheckoutSuccessPage() {
  return <Suspense fallback={<div className="p-10 text-center">Đang tải kết quả...</div>}><CheckoutSuccessContent /></Suspense>;
}
