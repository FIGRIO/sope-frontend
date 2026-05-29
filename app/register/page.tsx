'use client';

import Link from "next/link";
import { useState } from "react";

export default function RegisterPage() {
    // Quản lý trạng thái hiển thị cho 2 ô mật khẩu riêng biệt
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#F4F6F8] p-4">
            {/* Khung Card chính */}
            <div className="flex w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-xl">

                {/* === NỬA TRÁI: Banner Gradient (Dùng chung style với Login) === */}
                <div className="relative hidden w-1/2 flex-col justify-center overflow-hidden bg-gradient-to-br from-[#EE4D2D] to-[#FFD400] p-12 text-white md:flex">

                    <div className="z-10 mb-10">
                        <h1 className="mb-4 text-4xl font-bold">Bắt đầu hành trình</h1>
                        <p className="text-base font-medium text-white/90 leading-relaxed">
                            Tạo tài khoản Sope ngay hôm nay để nhận ngay các voucher ưu đãi dành riêng cho thành viên mới.
                        </p>
                    </div>

                    {/* Hình minh họa (UI Skeleton) */}
                    <div className="z-10 flex flex-col gap-5">
                        <div className="w-4/5 rounded-2xl bg-white/20 p-5 shadow-lg backdrop-blur-sm border border-white/30">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                                    <div className="h-4 w-4 rounded-full bg-[#EE4D2D]"></div>
                                </div>
                                <div className="flex w-full flex-col gap-3">
                                    <div className="h-3 w-full rounded-full bg-white"></div>
                                    <div className="h-3 w-1/2 rounded-full bg-white/60"></div>
                                </div>
                            </div>
                        </div>
                        <div className="ml-8 w-2/3 rounded-2xl bg-white/10 p-5 shadow-lg backdrop-blur-sm border border-white/20">
                            <div className="flex flex-col gap-3">
                                <div className="h-3 w-3/4 rounded-full bg-white/80"></div>
                                <div className="h-3 w-1/2 rounded-full bg-white/40"></div>
                            </div>
                        </div>
                    </div>

                    <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-white/10 blur-3xl"></div>
                    <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl"></div>
                </div>

                {/* === NỬA PHẢI: Form Đăng ký === */}
                <div className="flex w-full flex-col justify-center px-8 py-10 md:w-1/2 lg:px-12">

                    {/* Header & Chuyển Tab */}
                    <div className="mb-6 flex items-center gap-6 border-b border-gray-100 pb-1">
                        <Link href="/login" className="pb-3 text-2xl font-bold text-gray-400 transition hover:text-gray-600">
                            Đăng nhập
                        </Link>
                        <Link href="/register" className="border-b-2 border-[#EE4D2D] pb-3 -mb-[6px] text-2xl font-bold text-gray-800">
                            Đăng ký
                        </Link>
                    </div>

                    <form className="space-y-4">
                        {/* Ô Họ và Tên */}
                        <div>
                            <label className="mb-1 block text-sm font-semibold text-gray-700">Họ và Tên</label>
                            <input
                                type="text"
                                placeholder="Nhập họ và tên..."
                                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-[#EE4D2D] focus:ring-1 focus:ring-[#EE4D2D]"
                            />
                        </div>

                        {/* Ô Email / SĐT */}
                        <div>
                            <label className="mb-1 block text-sm font-semibold text-gray-700">Email hoặc Số điện thoại</label>
                            <input
                                type="text"
                                placeholder="Nhập email hoặc số điện thoại..."
                                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-[#EE4D2D] focus:ring-1 focus:ring-[#EE4D2D]"
                            />
                        </div>

                        {/* Ô Mật khẩu */}
                        <div>
                            <label className="mb-1 block text-sm font-semibold text-gray-700">Mật khẩu</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-[#EE4D2D] focus:ring-1 focus:ring-[#EE4D2D]"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-2.5 text-sm font-medium text-gray-500 hover:text-gray-800"
                                >
                                    {showPassword ? "Ẩn" : "Hiện"}
                                </button>
                            </div>
                        </div>

                        {/* Ô Nhập lại Mật khẩu */}
                        <div>
                            <label className="mb-1 block text-sm font-semibold text-gray-700">Nhập lại mật khẩu</label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-[#EE4D2D] focus:ring-1 focus:ring-[#EE4D2D]"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-4 top-2.5 text-sm font-medium text-gray-500 hover:text-gray-800"
                                >
                                    {showConfirmPassword ? "Ẩn" : "Hiện"}
                                </button>
                            </div>
                        </div>

                        {/* Điều khoản */}
                        <div className="flex items-start gap-2 pt-2">
                            <input type="checkbox" className="mt-1 h-4 w-4 rounded border-gray-300 text-[#EE4D2D] focus:ring-[#EE4D2D]" />
                            <span className="text-xs text-gray-600 leading-tight">
                                Bằng việc đăng ký, bạn đã đồng ý với Sope về <br />
                                <Link href="/terms" className="font-semibold text-[#EE4D2D] hover:underline">Điều khoản dịch vụ</Link> & <Link href="/privacy" className="font-semibold text-[#EE4D2D] hover:underline">Chính sách bảo mật</Link>
                            </span>
                        </div>

                        {/* Nút Đăng ký */}
                        <button
                            type="submit"
                            className="mt-2 w-full rounded-lg bg-gradient-to-r from-[#EE4D2D] to-[#FF8C00] py-3 text-base font-bold text-white shadow-md transition hover:opacity-90"
                        >
                            ĐĂNG KÝ
                        </button>
                    </form>

                    {/* Đường kẻ chia cách */}
                    <div className="my-6 flex items-center">
                        <div className="flex-1 border-t border-gray-200"></div>
                        <span className="px-4 text-xs font-medium tracking-wider text-gray-400 uppercase">HOẶC</span>
                        <div className="flex-1 border-t border-gray-200"></div>
                    </div>

                    {/* Đăng ký bằng Mạng xã hội */}
                    <div className="flex gap-4">
                        <button className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-gray-300 py-2 transition hover:bg-gray-50">
                            <svg width="18" height="18" viewBox="0 0 18 18">
                                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4" />
                                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184L12.048 13.56c-.637.426-1.45.679-2.048.679-2.31 0-4.264-1.558-4.963-3.655H2.022v2.333C3.504 15.811 6.06 18 9 18z" fill="#34A853" />
                                <path d="M4.037 10.526A5.402 5.402 0 0 1 3.75 9c0-.526.089-1.037.287-1.526V5.141H2.022A8.986 8.986 0 0 0 0 9c0 1.458.347 2.834.962 4.041l3.075-2.515z" fill="#FBBC05" />
                                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0a8.986 8.986 0 0 0-7.978 4.974L4.037 7.485c.699-2.097 2.653-3.905 4.963-3.905z" fill="#EA4335" />
                            </svg>
                            <span className="text-sm font-semibold text-gray-700">Google</span>
                        </button>
                        <button className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-gray-300 py-2 transition hover:bg-gray-50">
                            <svg width="20" height="20" viewBox="0 0 20 20">
                                <path d="M20 10.002C20 4.478 15.523 0 10 0S0 4.478 0 10.002c0 4.99 3.656 9.126 8.437 9.879v-6.988h-2.54v-2.891h2.54V7.798c0-2.508 1.493-3.891 3.776-3.891 1.094 0 2.24.195 2.24.195v2.46h-1.26c-1.244 0-1.63.772-1.63 1.562v1.875h2.773l-.443 2.891h-2.33v6.988C16.343 19.128 20 4.992 20 10.002z" fill="#1877F2" />
                            </svg>
                            <span className="text-sm font-semibold text-gray-700">Facebook</span>
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}