"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type AdminSidebarProps = {
  mobileOpen: boolean;
  onClose: () => void;
};

const mainItems = [
  { href: "/admin", label: "Tổng quan (Dashboard)", icon: "❖" },
  { href: "/admin/products", label: "Quản lý Sản phẩm", icon: "" },
  { href: "/admin/users", label: "Quản lý Tài khoản", icon: "" },
  { href: "/admin/orders", label: "Quản lý Đơn hàng", icon: "" },
];

const utilityItems = [
  { href: "/admin/inventory", label: "Quản lý Tồn kho" },
  { href: "/admin/coupons", label: "Quản lý Mã giảm giá" },
  { href: "/admin/shipping", label: "Quản lý Giao hàng" },
];

export default function AdminSidebar({
  mobileOpen,
  onClose,
}: AdminSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const linkClass = (active: boolean) =>
    active
      ? "flex items-center gap-3 rounded-xl bg-gradient-to-r from-[#EE4D2D] to-[#FFD400] px-4 py-3 font-bold text-white shadow-md"
      : "flex items-center gap-3 rounded-xl px-4 py-3 font-medium text-gray-400 transition-colors hover:bg-gray-800 hover:text-white";

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Đóng menu quản trị"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-[260px] flex-col bg-gray-900 text-white shadow-xl transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex h-[80px] shrink-0 items-center justify-between border-b border-gray-800 px-8">
          <Link
            href="/"
            onClick={onClose}
            className="group flex flex-col justify-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[#EE4D2D]"
            aria-label="Trở về trang chủ SOPE"
            title="Trở về trang chủ"
          >
            <h1 className="text-2xl font-extrabold tracking-widest text-white transition-colors group-hover:text-[#FFD400]">
              SOPE
            </h1>
            <span className="text-[10px] font-medium tracking-widest text-gray-400 transition-colors group-hover:text-gray-200">
              ADMIN PORTAL
            </span>
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white lg:hidden"
            aria-label="Đóng menu"
          >
            ×
          </button>
        </div>

        <div className="scrollbar-hide flex-1 space-y-8 overflow-y-auto px-4 py-6">
          <div>
            <p className="mb-3 px-4 text-xs font-bold uppercase text-gray-500">
              Main Menu
            </p>

            <ul className="space-y-1">
              {mainItems.map((item) => {
                const active = isActive(item.href);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={linkClass(active)}
                    >
                      <div className="flex items-center gap-3">
                        {item.icon ? (
                          <span
                            className={`flex h-5 w-5 items-center justify-center rounded-md ${
                              active ? "bg-white/20" : "border-2 border-current"
                            }`}
                          >
                            {item.icon}
                          </span>
                        ) : (
                          <span
                            className={`h-5 w-5 rounded-md ${
                              active ? "bg-white/20" : "border-2 border-current"
                            }`}
                          />
                        )}
                        {item.label}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <p className="mb-3 px-4 text-xs font-bold uppercase text-gray-500">
              Quản lý khác
            </p>

            <ul className="space-y-1">
              {utilityItems.map((item) => {
                const active = isActive(item.href);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={linkClass(active)}
                    >
                      <span
                        className={`h-5 w-5 rounded-md ${
                          active ? "bg-white/20" : "border-2 border-current"
                        }`}
                      />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </aside>
    </>
  );
}
