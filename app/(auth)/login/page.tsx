"use client";

import GoogleSignInButton from "@/components/GoogleSignInButton";
import { getApiErrorMessage, isAdminAuth, login, saveAuth } from "@/lib/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    if (!username.trim() || !password) {
      setErrorMessage("Vui lòng nhập tên đăng nhập/email và mật khẩu.");
      return;
    }

    setIsSubmitting(true);
    try {
      const auth = await login(username.trim(), password);
      saveAuth(auth);
      router.push(isAdminAuth(auth) ? "/admin" : "/");
      router.refresh();
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = () => {
    router.push("/");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4F6F8] p-4">
      <div className="flex w-full max-w-5xl overflow-hidden rounded-lg bg-white shadow-xl">
        <div className="hidden w-1/2 flex-col justify-center bg-gradient-to-br from-[#EE4D2D] to-[#FFD400] p-12 text-white md:flex">
          <div className="mb-10">
            <Link href="/" className="text-4xl font-extrabold tracking-tight">
              SOPE
            </Link>
            <h1 className="mt-8 text-4xl font-bold">Chào mừng trở lại</h1>
            <p className="mt-4 text-base font-medium leading-relaxed text-white/90">
              Đăng nhập để tiếp tục mua sắm, theo dõi đơn hàng và sử dụng giỏ hàng của bạn.
            </p>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border border-white/30 bg-white/15 p-5 shadow-lg backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white text-lg font-black text-[#EE4D2D]">
                  S
                </div>
                <div>
                  <p className="text-sm font-bold">Tài khoản SOPE</p>
                  <p className="mt-1 text-sm text-white/80">Một đăng nhập cho mọi đơn hàng.</p>
                </div>
              </div>
            </div>
            <div className="ml-8 rounded-lg border border-white/20 bg-white/10 p-5">
              <p className="text-sm font-semibold text-white/90">Hỗ trợ đăng nhập bằng Google hoặc email/tên đăng nhập.</p>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col justify-center px-8 py-12 md:w-1/2 lg:px-12">
          <div className="mb-8 flex items-center gap-6 border-b border-gray-100 pb-1">
            <Link
              href="/login"
              className="-mb-[6px] border-b-2 border-[#EE4D2D] pb-3 text-2xl font-bold text-gray-800"
            >
              Đăng nhập
            </Link>
            <Link
              href="/register"
              className="pb-3 text-2xl font-bold text-gray-400 transition hover:text-gray-600"
            >
              Đăng ký
            </Link>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="mb-2 block text-sm font-semibold text-gray-700">
                Email hoặc tên đăng nhập
              </label>
              <input
                id="username"
                name="username"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Nhập email hoặc tên đăng nhập"
                autoComplete="username"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#EE4D2D] focus:ring-1 focus:ring-[#EE4D2D]"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-semibold text-gray-700">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={isPasswordVisible ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Nhập mật khẩu"
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-16 text-sm text-gray-900 outline-none transition focus:border-[#EE4D2D] focus:ring-1 focus:ring-[#EE4D2D]"
                />
                <button
                  type="button"
                  onClick={() => setIsPasswordVisible((current) => !current)}
                  className="absolute right-4 top-3 text-sm font-medium text-gray-500 hover:text-gray-800"
                >
                  {isPasswordVisible ? "Ẩn" : "Hiện"}
                </button>
              </div>
            </div>

            <div className="text-right">
              <Link href="/forgot-password" className="text-xs font-semibold text-[#EE4D2D] hover:underline">
                Quên mật khẩu?
              </Link>
            </div>

            {errorMessage && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-gradient-to-r from-[#EE4D2D] to-[#FF8C00] py-3.5 text-base font-bold text-white shadow-md transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>

          <div className="my-8 flex items-center">
            <div className="flex-1 border-t border-gray-200" />
            <span className="px-4 text-xs font-medium uppercase tracking-wider text-gray-400">
              Hoặc
            </span>
            <div className="flex-1 border-t border-gray-200" />
          </div>

          <GoogleSignInButton
            text="signin_with"
            onSuccess={handleGoogleSuccess}
            onError={setErrorMessage}
          />
        </div>
      </div>
    </div>
  );
}
