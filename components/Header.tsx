"use client";

import { API_BASE_URL, clearAuth, getStoredAuth, type AuthResponse } from "@/lib/auth";
import { CART_UPDATED_EVENT, getCart } from "@/lib/shop";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";

type SearchSuggestion = {
  id: number;
  name: string;
  price?: number;
  category?: string;
  brand?: string;
  mainThumbnail?: string;
  images?: string[];
};

const formatSuggestionPrice = (price?: number) => {
  if (!price) return "";
  return price.toLocaleString("vi-VN") + "đ";
};

export default function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const [auth, setAuth] = useState<AuthResponse | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  const refreshCartCount = async () => {
    if (!getStoredAuth()?.accessToken) {
      setCartCount(0);
      return;
    }

    try {
      const cart = await getCart();
      setCartCount(cart.totalItems ?? 0);
    } catch {
      setCartCount(0);
    }
  };

  useEffect(() => {
    const refresh = () => {
      setAuth(getStoredAuth());
      void refreshCartCount();
    };

    refresh();
    window.addEventListener(CART_UPDATED_EVENT, refresh);
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, refresh);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  useEffect(() => {
    const keyword = searchQuery.trim();
    if (keyword.length < 2) {
      setSuggestions([]);
      setIsSuggesting(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsSuggesting(true);
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/products?keyword=${encodeURIComponent(keyword)}&size=6`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          setSuggestions([]);
          return;
        }

        const payload = await response.json();
        const products = Array.isArray(payload) ? payload : payload.content ?? [];
        setSuggestions(rankSearchSuggestions(products, keyword).slice(0, 6));
      } catch {
        if (!controller.signal.aborted) {
          setSuggestions([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsSuggesting(false);
        }
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      router.push(`/products?name=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    clearAuth();
    window.google?.accounts.id.disableAutoSelect();
    setAuth(null);
    setCartCount(0);
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
                {cartCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-xs font-bold text-[#EE4D2D] shadow">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
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

          <form
            onSubmit={handleSearch}
            className="relative flex w-full items-center lg:order-2 lg:max-w-3xl lg:flex-1"
            onFocus={() => {
              if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
              setShowSuggestions(true);
            }}
            onBlur={() => {
              blurTimerRef.current = setTimeout(() => setShowSuggestions(false), 140);
            }}
          >
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
            {showSuggestions && searchQuery.trim().length >= 2 && (
              <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-lg border border-gray-100 bg-white text-gray-800 shadow-xl">
                <div className="border-b border-gray-100 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Goi y tim kiem
                </div>

                {isSuggesting ? (
                  <div className="px-4 py-4 text-sm font-medium text-gray-500">Dang tim san pham phu hop...</div>
                ) : suggestions.length > 0 ? (
                  <div className="max-h-[360px] overflow-y-auto">
                    {suggestions.map((product) => {
                      const imageUrl = product.mainThumbnail || product.images?.[0] || "";

                      return (
                        <Link
                          key={product.id}
                          href={`/products/${product.id}`}
                          className="flex items-center gap-3 px-4 py-3 transition hover:bg-orange-50"
                          onClick={() => setShowSuggestions(false)}
                        >
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded border border-gray-100 bg-gray-50 text-[10px] text-gray-400">
                            {imageUrl ? (
                              <img src={imageUrl} alt={product.name} className="h-full w-full object-contain p-1" />
                            ) : (
                              "IMG"
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="line-clamp-1 text-sm font-semibold text-gray-800">{product.name}</div>
                            <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                              {product.category && <span className="capitalize">{product.category}</span>}
                              {product.brand && <span>{product.brand}</span>}
                            </div>
                          </div>
                          {product.price ? (
                            <div className="shrink-0 text-sm font-bold text-[#EE4D2D]">
                              {formatSuggestionPrice(product.price)}
                            </div>
                          ) : null}
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-4 py-4 text-sm font-medium text-gray-500">Chua tim thay san pham phu hop.</div>
                )}

                <button
                  type="submit"
                  className="flex w-full items-center justify-between border-t border-gray-100 px-4 py-3 text-left text-sm font-semibold text-[#EE4D2D] transition hover:bg-orange-50"
                >
                  <span>Xem tat ca ket qua cho "{searchQuery.trim()}"</span>
                  <span>{'>'}</span>
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </header>
  );
}

function rankSearchSuggestions(products: SearchSuggestion[], keyword: string) {
  const normalizedKeyword = normalizeSearchText(keyword);

  return [...products].sort((a, b) => {
    return getSuggestionScore(b, normalizedKeyword) - getSuggestionScore(a, normalizedKeyword);
  });
}

function getSuggestionScore(product: SearchSuggestion, normalizedKeyword: string) {
  const name = normalizeSearchText(product.name);
  const category = normalizeSearchText(product.category ?? "");
  const brand = normalizeSearchText(product.brand ?? "");
  let score = 0;

  if (name.startsWith(normalizedKeyword)) score += 40;
  if (name.includes(normalizedKeyword)) score += 24;
  if (brand.includes(normalizedKeyword)) score += 12;
  if (category.includes(normalizedKeyword)) score += 8;
  if (product.mainThumbnail || product.images?.length) score += 2;

  return score;
}

function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}
