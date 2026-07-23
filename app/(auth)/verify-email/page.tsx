"use client";

import { getApiErrorMessage, verifyEmail } from "@/lib/auth";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [status, setStatus] = useState<"loading" | "success" | "error">(token ? "loading" : "error");
  const [errorMessage, setErrorMessage] = useState(
    token ? "" : "Liên kết xác nhận email không hợp lệ hoặc thiếu token."
  );
  const hasRequested = useRef(false);

  useEffect(() => {
    if (!token || hasRequested.current) return;
    hasRequested.current = true;

    verifyEmail(token)
      .then(() => setStatus("success"))
      .catch((error) => {
        setStatus("error");
        setErrorMessage(getApiErrorMessage(error));
      });
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4F6F8] p-4">
      <div className="flex w-full max-w-5xl overflow-hidden rounded-lg bg-white shadow-xl">
        <div className="hidden w-1/2 flex-col justify-center bg-gradient-to-br from-[#EE4D2D] to-[#FFD400] p-12 text-white md:flex">
          <Link href="/" className="text-4xl font-extrabold tracking-tight">
            SOPE
          </Link>
          <h1 className="mt-8 text-4xl font-bold">Xác nhận email</h1>
          <p className="mt-4 text-base font-medium leading-relaxed text-white/90">
            Xác nhận địa chỉ email để bảo vệ tài khoản SOPE của bạn.
          </p>
        </div>

        <div className="flex w-full flex-col justify-center px-8 py-12 md:w-1/2 lg:px-12">
          <div className="mb-8 border-b border-gray-100 pb-4">
            <h2 className="text-2xl font-bold text-gray-800">Xác nhận tài khoản</h2>
          </div>

          {status === "loading" && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-600">
              Đang xác nhận email của bạn...
            </div>
          )}

          {status === "success" && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
              Email đã được xác nhận thành công. Bạn có thể tiếp tục sử dụng tài khoản.
            </div>
          )}

          {status === "error" && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {errorMessage}
            </div>
          )}

          <Link href="/login" className="mt-6 text-center text-sm font-semibold text-[#EE4D2D] hover:underline">
            Về trang đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F4F6F8] p-4 text-sm font-medium text-gray-500">
          Đang tải trang xác nhận email...
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
