"use client";

import {
  getAdminUsers,
  lockAdminUser,
  unlockAdminUser,
  updateAdminUserRole,
  type AdminUserResponse,
  type AdminUserRole,
} from "@/lib/admin-users";
import { getStoredAuth, type AuthResponse } from "@/lib/auth";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

type RoleFilter = "ALL" | "ROLE_ADMIN" | "ROLE_USER";
type StatusFilter = "ALL" | "ACTIVE" | "LOCKED";

const roleLabels: Record<AdminUserRole, string> = {
  ROLE_ADMIN: "Quản trị viên",
  ROLE_USER: "Người dùng",
};

const roleClasses: Record<AdminUserRole, string> = {
  ROLE_ADMIN: "bg-purple-100 text-purple-700",
  ROLE_USER: "bg-blue-100 text-blue-700",
};

function normalizeText(value?: string | null) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function isSameAdmin(user: AdminUserResponse, auth: AuthResponse | null) {
  if (!auth) return false;

  const sameUsername =
    auth.username &&
    normalizeText(user.username) === normalizeText(auth.username);

  const sameEmail =
    auth.email &&
    normalizeText(user.email) === normalizeText(auth.email);

  return Boolean(sameUsername || sameEmail);
}

function getInitials(user: AdminUserResponse) {
  return (user.username || user.email || "U").slice(0, 1).toUpperCase();
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserResponse[]>([]);
  const [currentAuth, setCurrentAuth] = useState<AuthResponse | null>(null);
  const [keyword, setKeyword] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [busyKey, setBusyKey] = useState("");
  const [detailUser, setDetailUser] = useState<AdminUserResponse | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setPageError("");

    try {
      const data = await getAdminUsers();
      setUsers(data);
    } catch (error) {
      setUsers([]);
      setPageError(
        error instanceof Error
          ? error.message
          : "Không thể tải danh sách tài khoản.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setCurrentAuth(getStoredAuth());
    void loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    const normalizedKeyword = normalizeText(keyword);

    return users.filter((user) => {
      const matchesKeyword =
        !normalizedKeyword ||
        normalizeText(user.username).includes(normalizedKeyword) ||
        normalizeText(user.email).includes(normalizedKeyword);

      const matchesRole = roleFilter === "ALL" || user.role === roleFilter;

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && user.enabled) ||
        (statusFilter === "LOCKED" && !user.enabled);

      return matchesKeyword && matchesRole && matchesStatus;
    });
  }, [keyword, roleFilter, statusFilter, users]);

  const totalPages = Math.max(Math.ceil(filteredUsers.length / pageSize), 1);
  const safePage = Math.min(page, totalPages - 1);

  const pagedUsers = useMemo(() => {
    const start = safePage * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, pageSize, safePage]);

  useEffect(() => {
    if (page >= totalPages) {
      setPage(totalPages - 1);
    }
  }, [page, totalPages]);

  const visiblePages = useMemo(() => {
    const pages: number[] = [];
    const start = Math.max(0, Math.min(safePage - 2, totalPages - 5));
    const end = Math.min(totalPages, start + 5);

    for (let index = start; index < end; index += 1) {
      pages.push(index);
    }

    return pages;
  }, [safePage, totalPages]);

  const stats = useMemo(() => {
    const total = users.length;
    const admins = users.filter((user) => user.role === "ROLE_ADMIN").length;
    const active = users.filter((user) => user.enabled).length;
    const locked = total - active;

    return { total, admins, active, locked };
  }, [users]);

  const clearFilters = () => {
    setKeyword("");
    setRoleFilter("ALL");
    setStatusFilter("ALL");
    setPage(0);
  };

  const patchUserInState = (updatedUser: AdminUserResponse) => {
    setUsers((items) =>
      items.map((item) => (item.id === updatedUser.id ? updatedUser : item)),
    );

    setDetailUser((current) =>
      current?.id === updatedUser.id ? updatedUser : current,
    );
  };

  const handleChangeRole = async (
    user: AdminUserResponse,
    nextRole: AdminUserRole,
  ) => {
    if (user.role === nextRole) return;

    if (isSameAdmin(user, currentAuth)) {
      toast.error("Bạn không thể tự thay đổi quyền của chính mình.");
      return;
    }

    const confirmed = window.confirm(
      `Bạn có chắc muốn chuyển tài khoản “${user.username || user.email}” thành ${
        roleLabels[nextRole]
      } không?`,
    );

    if (!confirmed) return;

    const key = `role-${user.id}`;
    setBusyKey(key);

    try {
      const updatedUser = await updateAdminUserRole(user.id, nextRole);
      patchUserInState(updatedUser);
      toast.success("Đã cập nhật quyền tài khoản.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể cập nhật quyền.",
      );
    } finally {
      setBusyKey("");
    }
  };

  const handleToggleLock = async (user: AdminUserResponse) => {
    if (isSameAdmin(user, currentAuth)) {
      toast.error("Bạn không thể tự khóa tài khoản của chính mình.");
      return;
    }

    const actionLabel = user.enabled ? "khóa" : "mở khóa";

    const confirmed = window.confirm(
      `Bạn có chắc muốn ${actionLabel} tài khoản “${
        user.username || user.email
      }” không?`,
    );

    if (!confirmed) return;

    const key = `status-${user.id}`;
    setBusyKey(key);

    try {
      const updatedUser = user.enabled
        ? await lockAdminUser(user.id)
        : await unlockAdminUser(user.id);

      patchUserInState(updatedUser);
      toast.success(user.enabled ? "Đã khóa tài khoản." : "Đã mở khóa tài khoản.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : user.enabled
            ? "Không thể khóa tài khoản."
            : "Không thể mở khóa tài khoản.",
      );
    } finally {
      setBusyKey("");
    }
  };

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#EE4D2D]">
              Danh mục quản trị
            </p>
            <h1 className="mt-1 text-2xl font-extrabold text-gray-900">
              Quản lý Tài khoản
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Theo dõi tài khoản, phân quyền Admin/User và khóa hoặc mở khóa
              người dùng trong hệ thống.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadUsers()}
            disabled={loading}
            className="rounded-xl bg-[#EE4D2D] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#d94326] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Đang tải..." : "Làm mới dữ liệu"}
          </button>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Tổng tài khoản" value={stats.total} note="Toàn hệ thống" />
          <StatCard label="Đang hoạt động" value={stats.active} note="Có thể đăng nhập" />
          <StatCard label="Bị khóa" value={stats.locked} note="Đã tạm dừng" />
          <StatCard label="Quản trị viên" value={stats.admins} note="Tài khoản Admin" />
        </div>

        <section className="mb-6 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <input
              value={keyword}
              onChange={(event) => {
                setKeyword(event.target.value);
                setPage(0);
              }}
              className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#EE4D2D] xl:col-span-2"
              placeholder="Tìm theo username hoặc email..."
            />

            <select
              value={roleFilter}
              onChange={(event) => {
                setRoleFilter(event.target.value as RoleFilter);
                setPage(0);
              }}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#EE4D2D]"
            >
              <option value="ALL">Tất cả quyền</option>
              <option value="ROLE_ADMIN">Quản trị viên</option>
              <option value="ROLE_USER">Người dùng</option>
            </select>

            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as StatusFilter);
                setPage(0);
              }}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#EE4D2D]"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="LOCKED">Bị khóa</option>
            </select>

            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(0);
              }}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#EE4D2D]"
            >
              <option value={10}>10 dòng</option>
              <option value={20}>20 dòng</option>
              <option value={50}>50 dòng</option>
            </select>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500">
              Đang hiển thị{" "}
              <strong className="text-gray-800">{filteredUsers.length}</strong>{" "}
              / {users.length} tài khoản.
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="w-fit rounded-lg border border-gray-200 px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50"
            >
              Xóa bộ lọc
            </button>
          </div>
        </section>

        {pageError && (
          <div className="mb-4 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
            <span>{pageError}</span>
            <button
              type="button"
              onClick={() => void loadUsers()}
              className="rounded-lg border border-red-200 bg-white px-3 py-2 font-bold hover:bg-red-100"
            >
              Thử lại
            </button>
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[980px] w-full border-collapse text-left">
              <thead>
                <tr className="bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-500">
                  <th className="px-5 py-4">Tài khoản</th>
                  <th className="px-5 py-4">Email</th>
                  <th className="px-5 py-4 text-center">Quyền</th>
                  <th className="px-5 py-4 text-center">Trạng thái</th>
                  <th className="px-5 py-4 text-right">Thao tác</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index}>
                      <td colSpan={5} className="px-5 py-4">
                        <div className="h-12 animate-pulse rounded-lg bg-gray-100" />
                      </td>
                    </tr>
                  ))
                ) : pagedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-16 text-center">
                      <div className="text-4xl text-gray-300">◯</div>
                      <p className="mt-3 font-bold text-gray-700">
                        Không tìm thấy tài khoản
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        Hãy thay đổi từ khóa hoặc bộ lọc đang sử dụng.
                      </p>
                    </td>
                  </tr>
                ) : (
                  pagedUsers.map((user) => {
                    const isSelf = isSameAdmin(user, currentAuth);
                    const disabled = Boolean(busyKey) || isSelf;

                    return (
                      <tr
                        key={user.id}
                        className="transition-colors hover:bg-gray-50/70"
                      >
                        <td className="px-5 py-4">
                          <div className="flex min-w-[260px] items-center gap-3">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#EE4D2D] text-sm font-black text-white shadow-sm">
                              {getInitials(user)}
                            </div>

                            <div className="min-w-0">
                              <p
                                className="max-w-[280px] truncate font-bold text-gray-900"
                                title={user.username}
                              >
                                {user.username || "Chưa có username"}
                              </p>
                              <p className="mt-1 text-xs text-gray-500">
                                ID #{user.id}
                                {isSelf ? " · Bạn" : ""}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="font-medium text-gray-700">
                            {user.email || "—"}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-center">
                          <select
                            value={user.role}
                            disabled={disabled || busyKey === `role-${user.id}`}
                            onChange={(event) =>
                              void handleChangeRole(
                                user,
                                event.target.value as AdminUserRole,
                              )
                            }
                            className={`rounded-full border-0 px-3 py-1.5 text-xs font-bold outline-none disabled:cursor-not-allowed disabled:opacity-50 ${roleClasses[user.role]}`}
                          >
                            <option value="ROLE_USER">Người dùng</option>
                            <option value="ROLE_ADMIN">Quản trị viên</option>
                          </select>
                        </td>

                        <td className="px-5 py-4 text-center">
                          <span
                            className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                              user.enabled
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {user.enabled ? "Đang hoạt động" : "Bị khóa"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setDetailUser(user)}
                              className="rounded-lg px-2.5 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100"
                            >
                              Xem
                            </button>

                            <button
                              type="button"
                              disabled={disabled || busyKey === `status-${user.id}`}
                              onClick={() => void handleToggleLock(user)}
                              className={`rounded-lg px-2.5 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50 ${
                                user.enabled
                                  ? "text-red-600 hover:bg-red-50"
                                  : "text-green-700 hover:bg-green-50"
                              }`}
                              title={
                                isSelf
                                  ? "Không thể tự khóa tài khoản của chính mình"
                                  : undefined
                              }
                            >
                              {user.enabled ? "Khóa" : "Mở khóa"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {!loading && filteredUsers.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-500">
                Trang <strong>{safePage + 1}</strong> / {totalPages}
              </p>

              <div className="flex flex-wrap items-center gap-1">
                <button
                  type="button"
                  disabled={safePage === 0}
                  onClick={() => setPage((value) => Math.max(0, value - 1))}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Trước
                </button>

                {visiblePages.map((pageIndex) => (
                  <button
                    key={pageIndex}
                    type="button"
                    onClick={() => setPage(pageIndex)}
                    className={`h-9 w-9 rounded-lg text-sm font-bold ${
                      pageIndex === safePage
                        ? "bg-[#EE4D2D] text-white"
                        : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {pageIndex + 1}
                  </button>
                ))}

                <button
                  type="button"
                  disabled={safePage >= totalPages - 1}
                  onClick={() =>
                    setPage((value) => Math.min(totalPages - 1, value + 1))
                  }
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {detailUser && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-6 py-4">
              <div>
                <h2 className="text-lg font-extrabold text-gray-900">
                  Chi tiết tài khoản
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  Thông tin cơ bản được backend trả về.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailUser(null)}
                className="rounded-lg p-2 text-xl text-gray-400 hover:bg-gray-200 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#EE4D2D] text-xl font-black text-white">
                  {getInitials(detailUser)}
                </div>

                <div className="min-w-0">
                  <h3 className="truncate text-xl font-extrabold text-gray-900">
                    {detailUser.username || "Chưa có username"}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {detailUser.email || "Chưa có email"}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Info label="ID" value={`#${detailUser.id}`} />
                <Info label="Username" value={detailUser.username || "—"} />
                <Info label="Email" value={detailUser.email || "—"} />
                <Info label="Quyền" value={roleLabels[detailUser.role]} />
                <Info
                  label="Trạng thái"
                  value={detailUser.enabled ? "Đang hoạt động" : "Bị khóa"}
                />
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setDetailUser(null)}
                  className="rounded-xl bg-gray-100 px-5 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-200"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function StatCard({
  label,
  value,
  note,
}: {
  label: string;
  value: number;
  note: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="absolute right-0 top-0 -mr-4 -mt-4 h-20 w-20 rounded-bl-full bg-gradient-to-br from-gray-50 to-gray-100" />
      <p className="relative z-10 text-sm font-medium text-gray-500">{label}</p>
      <p className="relative z-10 mt-2 text-3xl font-extrabold text-gray-900">
        {new Intl.NumberFormat("vi-VN").format(value)}
      </p>
      <p className="relative z-10 mt-2 text-xs font-bold text-[#EE4D2D]">
        {note}
      </p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-50 p-3">
      <p className="text-xs font-semibold text-gray-500">{label}</p>
      <p className="mt-1 break-words font-bold text-gray-800">{value}</p>
    </div>
  );
}
