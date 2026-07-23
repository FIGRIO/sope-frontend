/* eslint-disable @next/next/no-img-element */
"use client";

import {
  type ChangeEvent,
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { useWebSocket } from "@/hooks/useWebSocket";
import {
  API_BASE_URL,
  getAccessToken,
  type AuthResponse,
} from "@/lib/auth";
import { parseJsonResponse } from "@/lib/api-response";
import {
  dispatchAdminOrderCreated,
  type RealtimeNotification,
} from "@/lib/order-notifications";

type AdminTopBarProps = {
  auth: AuthResponse;
  onLogout: () => void;
  onOpenMenu: () => void;
};

type ProductSearchItem = {
  id: number;
  name: string;
  sku?: string | null;
  brand?: string | null;
  category?: string | null;
  mainThumbnail?: string | null;
  imgUrl?: string | null;
};

type UserSearchItem = {
  id: number;
  username: string;
  email: string;
  role?: string | null;
  enabled?: boolean;
};

type SearchResults = {
  products: ProductSearchItem[];
  users: UserSearchItem[];
};

const EMPTY_RESULTS: SearchResults = {
  products: [],
  users: [],
};

function normalizeText(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function parseProducts(payload: unknown): ProductSearchItem[] {
  if (Array.isArray(payload)) {
    return payload as ProductSearchItem[];
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const record = payload as Record<string, unknown>;

  if (Array.isArray(record.content)) {
    return record.content as ProductSearchItem[];
  }

  if (record.data && typeof record.data === "object") {
    const data = record.data as Record<string, unknown>;

    if (Array.isArray(data.content)) {
      return data.content as ProductSearchItem[];
    }

    if (Array.isArray(record.data)) {
      return record.data as ProductSearchItem[];
    }
  }

  return [];
}

function parseUsers(payload: unknown): UserSearchItem[] {
  if (Array.isArray(payload)) {
    return payload as UserSearchItem[];
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const record = payload as Record<string, unknown>;

  if (Array.isArray(record.data)) {
    return record.data as UserSearchItem[];
  }

  if (Array.isArray(record.content)) {
    return record.content as UserSearchItem[];
  }

  return [];
}

async function readResponseError(response: Response) {
  const fallback = `Không thể tìm kiếm. Mã lỗi ${response.status}.`;
  const text = await response.text();

  if (!text) return fallback;

  try {
    const payload = JSON.parse(text) as { message?: string; error?: string };
    return payload.message || payload.error || fallback;
  } catch {
    return text;
  }
}

export default function AdminTopBar({
  auth,
  onLogout,
  onOpenMenu,
}: AdminTopBarProps) {
  const router = useRouter();
  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const notificationContainerRef = useRef<HTMLDivElement | null>(null);
  const usersCacheRef = useRef<UserSearchItem[] | null>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>(EMPTY_RESULTS);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const displayName = auth.fullName || auth.username || "Admin";
  const normalizedQuery = useMemo(() => normalizeText(query), [query]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(target)
      ) {
        setShowResults(false);
      }
      if (
        notificationContainerRef.current &&
        !notificationContainerRef.current.contains(target)
      ) {
        setShowNotifications(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowResults(false);
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleAdminOrderNotification = useCallback(
    (notification: RealtimeNotification) => {
      setNotifications((current) => [notification, ...current].slice(0, 10));
      setUnreadNotifications((current) => current + 1);
      dispatchAdminOrderCreated(notification);
      toast.success(notification.message || "Có đơn hàng mới cần duyệt.", {
        duration: 5000,
      });
    },
    [],
  );

  const websocketHandlers = useMemo(
    () => ({ onAdminOrder: handleAdminOrderNotification }),
    [handleAdminOrderNotification],
  );

  const { isConnected: isNotificationConnected } = useWebSocket(
    auth.accessToken,
    "",
    websocketHandlers,
  );

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 2) {
      void Promise.resolve().then(() => {
        setResults(EMPTY_RESULTS);
        setSearchError("");
        setSearching(false);
      });
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setSearching(true);
      setSearchError("");

      try {
        const token = getAccessToken();
        if (!token) {
          throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        }

        const productParams = new URLSearchParams({
          keyword: trimmedQuery,
          page: "0",
          size: "6",
          sortBy: "id",
          sortDir: "desc",
        });

        const productRequest = fetch(
          `${API_BASE_URL}/api/products?${productParams.toString()}`,
          {
            signal: controller.signal,
            headers: {
              Accept: "application/json",
            },
          },
        ).then(async (response) => {
          if (!response.ok) {
            throw new Error(await readResponseError(response));
          }

          return parseProducts(
            await parseJsonResponse<unknown>(response),
          ).slice(0, 6);
        });

        const userRequest = usersCacheRef.current
          ? Promise.resolve(usersCacheRef.current)
          : fetch(`${API_BASE_URL}/api/admin/users`, {
              signal: controller.signal,
              credentials: "include",
              headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
              },
            }).then(async (response) => {
              if (!response.ok) {
                throw new Error(await readResponseError(response));
              }

              const users = parseUsers(
                await parseJsonResponse<unknown>(response),
              );
              usersCacheRef.current = users;
              return users;
            });

        const [products, allUsers] = await Promise.all([
          productRequest,
          userRequest,
        ]);

        if (controller.signal.aborted) return;

        const users = allUsers
          .filter((user) => {
            const searchableValue = normalizeText(
              `${user.username} ${user.email} ${user.id}`,
            );
            return searchableValue.includes(normalizedQuery);
          })
          .slice(0, 6);

        setResults({ products, users });
        setShowResults(true);
      } catch (error) {
        if (controller.signal.aborted) return;

        setResults(EMPTY_RESULTS);
        setSearchError(
          error instanceof Error
            ? error.message
            : "Không thể tìm kiếm sản phẩm và người dùng.",
        );
        setShowResults(true);
      } finally {
        if (!controller.signal.aborted) {
          setSearching(false);
        }
      }
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [normalizedQuery, query]);

  const openProduct = (product: ProductSearchItem) => {
    setShowResults(false);
    setQuery("");
    router.push(`/products/${product.id}`);
  };

  const openUserManagement = (user: UserSearchItem) => {
    setShowResults(false);
    router.push(`/admin/users?keyword=${encodeURIComponent(user.username)}`);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!query.trim()) return;

    if (results.products.length === 1 && results.users.length === 0) {
      openProduct(results.products[0]);
      return;
    }

    if (results.users.length === 1 && results.products.length === 0) {
      openUserManagement(results.users[0]);
      return;
    }

    setShowResults(true);
  };

  const hasResults =
    results.products.length > 0 || results.users.length > 0;

  return (
    <header className="sticky top-0 z-40 flex min-h-[80px] items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3 sm:px-6 lg:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          onClick={onOpenMenu}
          className="shrink-0 rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 lg:hidden"
          aria-label="Mở menu quản trị"
        >
          ☰
        </button>

        <div
          ref={searchContainerRef}
          className="relative hidden w-full max-w-[620px] sm:block"
        >
          <form
            className="relative flex h-11 w-full items-center overflow-hidden rounded-full border border-transparent bg-gray-100 transition focus-within:border-[#EE4D2D]/30 focus-within:bg-white focus-within:shadow-lg"
            onSubmit={handleSubmit}
          >
            <div className="grid h-full w-12 shrink-0 place-items-center text-gray-400">
              {searching ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-[#EE4D2D]" />
              ) : (
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
              )}
            </div>

            <input
              className="h-full w-full bg-transparent pr-10 text-sm text-gray-700 outline-none placeholder:text-gray-400"
              type="search"
              id="admin-search"
              value={query}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setQuery(event.target.value)
              }
              onFocus={() => {
                if (query.trim().length >= 2) setShowResults(true);
              }}
              placeholder="Tìm sản phẩm, username hoặc email..."
              autoComplete="off"
              aria-label="Tìm kiếm sản phẩm và người dùng"
            />

            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setResults(EMPTY_RESULTS);
                  setSearchError("");
                  setShowResults(false);
                }}
                className="absolute right-3 grid h-7 w-7 place-items-center rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-700"
                aria-label="Xóa nội dung tìm kiếm"
              >
                ×
              </button>
            )}
          </form>

          {showResults && query.trim().length >= 2 && (
            <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-50 max-h-[70vh] overflow-y-auto rounded-2xl border border-gray-200 bg-white p-2 shadow-2xl">
              {searchError ? (
                <div className="rounded-xl bg-red-50 px-4 py-4 text-sm text-red-700">
                  {searchError}
                </div>
              ) : searching && !hasResults ? (
                <div className="px-4 py-8 text-center text-sm text-gray-500">
                  Đang tìm kiếm...
                </div>
              ) : !hasResults ? (
                <div className="px-4 py-8 text-center">
                  <p className="font-semibold text-gray-700">
                    Không tìm thấy kết quả
                  </p>
                  <p className="mt-1 text-sm text-gray-400">
                    Thử tìm bằng tên sản phẩm, SKU, username hoặc email.
                  </p>
                </div>
              ) : (
                <>
                  {results.products.length > 0 && (
                    <section>
                      <div className="flex items-center justify-between px-3 py-2">
                        <h2 className="text-xs font-black uppercase tracking-wider text-gray-500">
                          Sản phẩm
                        </h2>
                        <button
                          type="button"
                          onClick={() => {
                            setShowResults(false);
                            router.push(
                              `/admin/products?keyword=${encodeURIComponent(
                                query.trim(),
                              )}`,
                            );
                          }}
                          className="text-xs font-bold text-[#EE4D2D] hover:underline"
                        >
                          Quản lý sản phẩm
                        </button>
                      </div>

                      <div className="space-y-1">
                        {results.products.map((product) => {
                          const imageUrl =
                            product.mainThumbnail || product.imgUrl || "";

                          return (
                            <button
                              key={`product-${product.id}`}
                              type="button"
                              onClick={() => openProduct(product)}
                              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-orange-50"
                            >
                              <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                                {imageUrl ? (
                                  <img
                                    src={imageUrl}
                                    alt={product.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="grid h-full w-full place-items-center text-sm font-black text-gray-400">
                                    P
                                  </div>
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-bold text-gray-800">
                                  {product.name}
                                </p>
                                <p className="truncate text-xs text-gray-500">
                                  {[
                                    product.sku && `SKU: ${product.sku}`,
                                    product.brand,
                                    product.category,
                                  ]
                                    .filter(Boolean)
                                    .join(" · ") || `Mã sản phẩm #${product.id}`}
                                </p>
                              </div>

                              <span className="text-gray-300">›</span>
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  )}

                  {results.products.length > 0 && results.users.length > 0 && (
                    <div className="my-2 border-t border-gray-100" />
                  )}

                  {results.users.length > 0 && (
                    <section>
                      <div className="flex items-center justify-between px-3 py-2">
                        <h2 className="text-xs font-black uppercase tracking-wider text-gray-500">
                          Người dùng
                        </h2>
                        <button
                          type="button"
                          onClick={() => {
                            setShowResults(false);
                            router.push(
                              `/admin/users?keyword=${encodeURIComponent(
                                query.trim(),
                              )}`,
                            );
                          }}
                          className="text-xs font-bold text-[#EE4D2D] hover:underline"
                        >
                          Quản lý tài khoản
                        </button>
                      </div>

                      <div className="space-y-1">
                        {results.users.map((user) => (
                          <button
                            key={`user-${user.id}`}
                            type="button"
                            onClick={() => openUserManagement(user)}
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-orange-50"
                          >
                            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#EE4D2D] text-sm font-black text-white">
                              {(user.username || user.email || "U")
                                .slice(0, 1)
                                .toUpperCase()}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="truncate text-sm font-bold text-gray-800">
                                  {user.username || `Tài khoản #${user.id}`}
                                </p>
                                <span
                                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                    user.enabled === false
                                      ? "bg-red-100 text-red-600"
                                      : "bg-emerald-100 text-emerald-700"
                                  }`}
                                >
                                  {user.enabled === false ? "Đã khóa" : "Hoạt động"}
                                </span>
                              </div>
                              <p className="truncate text-xs text-gray-500">
                                {user.email}
                                {user.role
                                  ? ` · ${
                                      user.role === "ROLE_ADMIN"
                                        ? "Quản trị viên"
                                        : "Người dùng"
                                    }`
                                  : ""}
                              </p>
                            </div>

                            <span className="text-gray-300">›</span>
                          </button>
                        ))}
                      </div>
                    </section>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <div ref={notificationContainerRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setShowNotifications((current) => !current);
              setUnreadNotifications(0);
            }}
            className="relative grid h-10 w-10 place-items-center rounded-full border border-gray-200 bg-white text-gray-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-[#EE4D2D]"
            aria-label="Thông báo đơn hàng"
            aria-expanded={showNotifications}
            title={
              isNotificationConnected
                ? "Đang nhận thông báo đơn hàng realtime"
                : "Đang kết nối lại thông báo"
            }
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0a3 3 0 01-6 0"
              />
            </svg>
            {unreadNotifications > 0 ? (
              <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white">
                {Math.min(unreadNotifications, 99)}
              </span>
            ) : null}
            <span
              className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white ${
                isNotificationConnected ? "bg-emerald-500" : "bg-amber-400"
              }`}
            />
          </button>

          {showNotifications ? (
            <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <div>
                  <p className="font-bold text-gray-900">Thông báo đơn hàng</p>
                  <p className="text-xs text-gray-500">
                    {isNotificationConnected ? "Realtime đang kết nối" : "Đang kết nối lại..."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => router.push("/admin/orders")}
                  className="text-xs font-bold text-[#EE4D2D] hover:underline"
                >
                  Xem đơn
                </button>
              </div>

              {notifications.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-gray-500">
                  Chưa có đơn mới trong phiên làm việc này.
                </div>
              ) : (
                <div className="max-h-96 divide-y divide-gray-100 overflow-y-auto">
                  {notifications.map((notification, index) => (
                    <button
                      key={`${notification.referenceId ?? "notification"}-${notification.timestamp ?? index}`}
                      type="button"
                      onClick={() => {
                        setShowNotifications(false);
                        router.push("/admin/orders");
                      }}
                      className="w-full px-4 py-3 text-left transition hover:bg-orange-50"
                    >
                      <p className="text-sm font-bold text-gray-900">{notification.title}</p>
                      <p className="mt-1 text-xs leading-5 text-gray-600">{notification.message}</p>
                      <p className="mt-1 text-[11px] text-gray-400">
                        {formatNotificationTime(notification.timestamp)}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
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

function formatNotificationTime(value?: string | null) {
  if (!value) return "Vừa xong";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Vừa xong";

  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}
