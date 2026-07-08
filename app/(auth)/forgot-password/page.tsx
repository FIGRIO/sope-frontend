"use client";

import { getApiErrorMessage, requestPasswordReset } from "@/lib/auth";
import Link from "next/link";
import { FormEvent, useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [resetLink, setResetLink] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setResetLink("");
    setErrorMessage("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage("Vui long nhap email tai khoan.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await requestPasswordReset(trimmedEmail);
      setMessage("Neu email ton tai, lien ket dat lai mat khau da duoc tao.");
      setResetLink(response.resetLink ?? "");
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
          <h1 className="mt-8 text-4xl font-bold">Khoi phuc tai khoan</h1>
          <p className="mt-4 text-base font-medium leading-relaxed text-white/90">
            Nhap email da dang ky de tao lien ket dat lai mat khau cho tai khoan SOPE.
          </p>
        </div>

        <div className="flex w-full flex-col justify-center px-8 py-12 md:w-1/2 lg:px-12">
          <div className="mb-8 border-b border-gray-100 pb-4">
            <h2 className="text-2xl font-bold text-gray-800">Quen mat khau</h2>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              Chung toi se tao lien ket dat lai mat khau neu email ton tai trong he thong.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-semibold text-gray-700">
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
                <p>{message}</p>
                {resetLink && (
                  <Link href={resetLink} className="mt-2 block font-bold text-[#EE4D2D] hover:underline">
                    Mo trang dat lai mat khau
                  </Link>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-gradient-to-r from-[#EE4D2D] to-[#FF8C00] py-3.5 text-base font-bold text-white shadow-md transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Dang tao lien ket..." : "Tao lien ket dat lai mat khau"}
            </button>
          </form>

          <Link href="/login" className="mt-6 text-center text-sm font-semibold text-[#EE4D2D] hover:underline">
            Quay lai dang nhap
          </Link>
        </div>
      </div>
    </div>
  );
}
