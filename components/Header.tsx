"use client";

import { clearAuth, getStoredAuth, type AuthResponse } from "@/lib/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const [auth, setAuth] = useState<AuthResponse | null>(() => getStoredAuth());
  const router = useRouter();

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?name=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    clearAuth();
    window.google?.accounts.id.disableAutoSelect();
    setAuth(null);
    router.push("/login");
    router.refresh();
  };

  const displayName = auth?.fullName || auth?.username || auth?.email;

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-[#EE4D2D] to-[#FFD400] shadow-md">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
          <div className="flex items-center justify-between gap-4 lg:contents">
            <Link
              href="/"
              className="shrink-0 text-3xl font-extrabold tracking-tight text-white"
            >
              SOPE
            </Link>

            <div className="flex shrink-0 items-center gap-4 text-white lg:order-3">
              <Link href="/cart" className="relative transition hover:text-gray-100">
                <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-[#EE4D2D] shadow">
                  3
                </span>
              </Link>

              {auth ? (
                <div className="flex min-w-0 items-center gap-3 border-l border-white/40 pl-4 text-sm font-medium">
                  {auth.avatarUrl ? (
                    <div
                      role="img"
                      aria-label={displayName || "User"}
                      className="h-8 w-8 shrink-0 rounded-full border border-white/60 object-cover"
                      style={{
                        backgroundImage: `url(${auth.avatarUrl})`,
                        backgroundPosition: "center",
                        backgroundSize: "cover",
                      }}
                    />
                  ) : (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-xs font-black text-[#EE4D2D]">
                      {(displayName || "U").slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <span className="hidden max-w-[140px] truncate sm:inline">{displayName}</span>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="shrink-0 transition hover:underline"
                  >
                    Đăng xuất
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 border-l border-white/40 pl-4 text-sm font-medium">
                  <Link href="/register" className="transition hover:underline">
                    Đăng ký
                  </Link>
                  <span className="opacity-60">|</span>
                  <Link href="/login" className="transition hover:underline">
                    Đăng nhập
                  </Link>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSearch} className="relative flex w-full items-center lg:order-2 lg:max-w-3xl lg:flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Tìm kiếm sản phẩm, thương hiệu..."
              className="w-full rounded-full border-none bg-white px-6 py-2.5 pr-12 text-sm text-gray-800 shadow-inner outline-none focus:ring-2 focus:ring-orange-300"
            />
            <button
              type="submit"
              className="absolute right-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#EE4D2D] text-white transition hover:bg-orange-600"
              aria-label="Tìm kiếm"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
