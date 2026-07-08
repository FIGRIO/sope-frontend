"use client";

import { getApiErrorMessage, resetPassword } from "@/lib/auth";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setErrorMessage("");

    if (!token) {
      setErrorMessage("Liên kết đặt lại mật khẩu không hợp lệ.");
      return;
    }
    if (password.length < 6) {
      setErrorMessage("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Mật khẩu nhập lại không khớp.");
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(token, password, confirmPassword);
      setPassword("");
      setConfirmPassword("");
      setMessage("Mật khẩu đã được đặt lại. Bạn có thể đăng nhập bằng mật khẩu mới.");
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4F6F8] p-4">
      <div className="flex w-full max-w-5xl overflow-hidden rounded-lg bg-white shadow-xl">
        <div className="hidden w-1/2 flex-col justify-center bg-gradient-to-br from-[#EE4D2D] to-[#FFD400] p-12 text-white md:flex">
          <Link href="/" className="text-4xl font-extrabold tracking-tight">
            SOPE
          </Link>
          <h1 className="mt-8 text-4xl font-bold">Đặt lại mật khẩu</h1>
          <p className="mt-4 text-base font-medium leading-relaxed text-white/90">
            Tạo mật khẩu mới để bảo vệ tài khoản và tiếp tục mua sắm trên SOPE.
          </p>
        </div>

        <div className="flex w-full flex-col justify-center px-8 py-12 md:w-1/2 lg:px-12">
          <div className="mb-8 border-b border-gray-100 pb-4">
            <h2 className="text-2xl font-bold text-gray-800">Mật khẩu mới</h2>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              Liên kết đặt lại mật khẩu chỉ có hiệu lực trong thời gian ngắn.
            </p>
          </div>

          {!token && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              Liên kết đặt lại mật khẩu không hợp lệ hoặc thiếu token.
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-semibold text-gray-700">
                Mật khẩu mới
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-16 text-sm text-gray-900 outline-none transition focus:border-[#EE4D2D] focus:ring-1 focus:ring-[#EE4D2D]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-4 top-3 text-sm font-medium text-gray-500 hover:text-gray-800"
                >
                  {showPassword ? "Ẩn" : "Hiện"}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-2 block text-sm font-semibold text-gray-700">
                Nhập lại mật khẩu
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                autoComplete="new-password"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#EE4D2D] focus:ring-1 focus:ring-[#EE4D2D]"
              />
            </div>

            {errorMessage && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {errorMessage}
              </div>
            )}

            {message && (
              <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !token}
              className="w-full rounded-lg bg-gradient-to-r from-[#EE4D2D] to-[#FF8C00] py-3.5 text-base font-bold text-white shadow-md transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Đang đặt lại..." : "Đặt lại mật khẩu"}
            </button>
          </form>

          <Link href="/login" className="mt-6 text-center text-sm font-semibold text-[#EE4D2D] hover:underline">
            Về trang đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F4F6F8] p-4 text-sm font-medium text-gray-500">
          Đang tải trang đặt lại mật khẩu...
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
