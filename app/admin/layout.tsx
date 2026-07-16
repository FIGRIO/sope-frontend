"use client";

import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopBar from "@/components/admin/AdminTopBar";
import {
  clearAuth,
  getStoredAuth,
  isAdminAuth,
  type AuthResponse,
} from "@/lib/auth";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [auth, setAuth] = useState<AuthResponse | null>(null);
  const [checking, setChecking] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    void Promise.resolve().then(() => {
      const storedAuth = getStoredAuth();
      if (!storedAuth?.accessToken) {
        router.replace("/login");
        return;
      }
      if (!isAdminAuth(storedAuth)) {
        router.replace("/");
        return;
      }
      setAuth(storedAuth);
      setChecking(false);
    });
  }, [router]);

  const handleLogout = () => {
    clearAuth();
    router.replace("/login");
    router.refresh();
  };

  if (checking || !auth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F6F8] text-sm font-semibold text-gray-500">
        Đang kiểm tra quyền quản trị...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6F8]">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 2500,
          style: {
            fontSize: "14px",
            fontWeight: 600,
          },
        }}
      />

      <AdminSidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <div className="min-h-screen lg:ml-[260px]">
        <AdminTopBar
          auth={auth}
          onLogout={handleLogout}
          onOpenMenu={() => setMobileOpen(true)}
        />

        {children}
      </div>
    </div>
  );
}
