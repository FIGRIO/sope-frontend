/* eslint-disable @next/next/no-img-element */
"use client";

import type { AuthResponse } from "@/lib/auth";

type AdminTopBarProps = {
  auth: AuthResponse;
  onLogout: () => void;
  onOpenMenu: () => void;
};

export default function AdminTopBar({
  auth,
  onLogout,
  onOpenMenu,
}: AdminTopBarProps) {
  const displayName = auth.fullName || auth.username || "Admin";

  return (
    <header className="sticky top-0 z-40 flex h-[80px] items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenMenu}
          className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 lg:hidden"
          aria-label="Mở menu quản trị"
        >
          ☰
        </button>

        <div className="hidden w-[400px] max-w-full sm:block">
          <div className="relative flex h-10 w-full items-center overflow-hidden rounded-full bg-gray-100 transition-shadow focus-within:shadow-lg">
            <div className="grid h-full w-12 place-items-center text-gray-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            <input
              className="peer h-full w-full bg-transparent pr-2 text-sm text-gray-700 outline-none"
              type="text"
              id="admin-search"
              placeholder="Tìm kiếm đơn hàng, tên khách hàng..."
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 sm:gap-6">
        <button
          type="button"
          className="relative p-2 text-gray-400 transition-colors hover:text-[#EE4D2D]"
          aria-label="Thông báo"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          <span className="absolute right-2 top-1 h-2 w-2 rounded-full border border-white bg-red-500" />
        </button>

        <div className="flex items-center gap-3 border-l border-gray-200 pl-4 sm:pl-6">
          <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-white bg-gray-200 shadow-sm">
            {auth.avatarUrl ? (
              <img
                src={auth.avatarUrl}
                alt={displayName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[#EE4D2D] text-sm font-black text-white">
                {displayName.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>

          <div className="hidden flex-col sm:flex">
            <span className="max-w-[180px] truncate text-sm font-bold text-gray-700">
              {displayName}
            </span>
            <button
              type="button"
              onClick={onLogout}
              className="text-left text-xs font-semibold text-[#EE4D2D] hover:underline"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
