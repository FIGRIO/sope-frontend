"use client";

import GoogleSignInButton from "@/components/GoogleSignInButton";
import { getApiErrorMessage, login, register, saveAuth } from "@/lib/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();

    if (!trimmedUsername || !trimmedEmail || !password) {
      setErrorMessage("Vui lòng nhập đầy đủ tên đăng nhập, email và mật khẩu.");
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
    if (!acceptedTerms) {
      setErrorMessage("Vui lòng đồng ý điều khoản trước khi đăng ký.");
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        username: trimmedUsername,
        email: trimmedEmail,
        password,
      });
      const auth = await login(trimmedUsername, password);
      saveAuth(auth);
      router.push("/");
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
            <h1 className="mt-8 text-4xl font-bold">Tạo tài khoản mới</h1>
            <p className="mt-4 text-base font-medium leading-relaxed text-white/90">
              Đăng ký để lưu giỏ hàng, đặt hàng nhanh hơn và đồng bộ tài khoản của bạn.
            </p>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border border-white/30 bg-white/15 p-5 shadow-lg backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white text-lg font-black text-[#EE4D2D]">
                  +
                </div>
                <div>
                  <p className="text-sm font-bold">Thành viên SOPE</p>
                  <p className="mt-1 text-sm text-white/80">Dùng email, username hoặc Google.</p>
                </div>
              </div>
            </div>
            <div className="ml-8 rounded-lg border border-white/20 bg-white/10 p-5">
              <p className="text-sm font-semibold text-white/90">Tài khoản Google sẽ được tạo tự động sau khi xác thực thành công.</p>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col justify-center px-8 py-10 md:w-1/2 lg:px-12">
          <div className="mb-6 flex items-center gap-6 border-b border-gray-100 pb-1">
            <Link
              href="/login"
              className="pb-3 text-2xl font-bold text-gray-400 transition hover:text-gray-600"
            >
              Đăng nhập
            </Link>
            <Link
              href="/register"
              className="-mb-[6px] border-b-2 border-[#EE4D2D] pb-3 text-2xl font-bold text-gray-800"
            >
              Đăng ký
            </Link>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="mb-1 block text-sm font-semibold text-gray-700">
                Tên đăng nhập
              </label>
              <input
                id="username"
                name="username"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Ví dụ: nguyenvana"
                autoComplete="username"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-[#EE4D2D] focus:ring-1 focus:ring-[#EE4D2D]"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-semibold text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@gmail.com"
                autoComplete="email"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-[#EE4D2D] focus:ring-1 focus:ring-[#EE4D2D]"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-semibold text-gray-700">
                Mật khẩu
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
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-16 text-sm text-gray-900 outline-none transition focus:border-[#EE4D2D] focus:ring-1 focus:ring-[#EE4D2D]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-4 top-2.5 text-sm font-medium text-gray-500 hover:text-gray-800"
                >
                  {showPassword ? "Ẩn" : "Hiện"}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-1 block text-sm font-semibold text-gray-700">
                Nhập lại mật khẩu
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Nhập lại mật khẩu"
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-16 text-sm text-gray-900 outline-none transition focus:border-[#EE4D2D] focus:ring-1 focus:ring-[#EE4D2D]"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  className="absolute right-4 top-2.5 text-sm font-medium text-gray-500 hover:text-gray-800"
                >
                  {showConfirmPassword ? "Ẩn" : "Hiện"}
                </button>
              </div>
            </div>

            <label className="flex items-start gap-2 pt-2 text-xs leading-tight text-gray-600">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(event) => setAcceptedTerms(event.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#EE4D2D] focus:ring-[#EE4D2D]"
              />
              <span>
                Bằng việc đăng ký, bạn đồng ý với{" "}
                <Link href="/terms" className="font-semibold text-[#EE4D2D] hover:underline">
                  Điều khoản dịch vụ
                </Link>{" "}
                và{" "}
                <Link href="/privacy" className="font-semibold text-[#EE4D2D] hover:underline">
                  Chính sách bảo mật
                </Link>
                .
              </span>
            </label>

            {errorMessage && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full rounded-lg bg-gradient-to-r from-[#EE4D2D] to-[#FF8C00] py-3 text-base font-bold text-white shadow-md transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Đang tạo tài khoản..." : "Đăng ký"}
            </button>
          </form>

          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-gray-200" />
            <span className="px-4 text-xs font-medium uppercase tracking-wider text-gray-400">
              Hoặc
            </span>
            <div className="flex-1 border-t border-gray-200" />
          </div>

          <GoogleSignInButton
            text="signup_with"
            onSuccess={handleGoogleSuccess}
            onError={setErrorMessage}
          />
        </div>
      </div>
    </div>
  );
}
