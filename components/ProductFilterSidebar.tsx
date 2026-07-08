"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type FilterOption = {
  label: string;
  value: string;
};

interface ProductFilterSidebarProps {
  categories: FilterOption[];
  brands: FilterOption[];
  selectedCategory: string;
  selectedBrand: string;
  selectedMinPrice: number;
  selectedMaxPrice: number;
  priceMin: number;
  priceMax: number;
  queryName: string;
}

const formatVndShort = (value: number) => {
  if (value >= 1_000_000) return `${Math.round(value / 1_000_000)}tr`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return String(value);
};

export default function ProductFilterSidebar({
  categories,
  brands,
  selectedCategory,
  selectedBrand,
  selectedMinPrice,
  selectedMaxPrice,
  priceMin,
  priceMax,
  queryName,
}: ProductFilterSidebarProps) {
  const router = useRouter();
  const [minPriceInput, setMinPriceInput] = useState(selectedMinPrice ? String(selectedMinPrice) : "");
  const [maxPriceInput, setMaxPriceInput] = useState(selectedMaxPrice ? String(selectedMaxPrice) : "");
  const hasFilters = Boolean(selectedCategory || selectedBrand || queryName || selectedMinPrice || selectedMaxPrice);

  const normalizedPrice = useMemo(() => {
    const minPrice = parsePriceInput(minPriceInput);
    const maxPrice = parsePriceInput(maxPriceInput);
    const low = minPrice && maxPrice ? Math.min(minPrice, maxPrice) : minPrice;
    const high = minPrice && maxPrice ? Math.max(minPrice, maxPrice) : maxPrice;
    return { low, high };
  }, [minPriceInput, maxPriceInput]);

  const pushFilters = (updates: Record<string, string | number | null>) => {
    const params = new URLSearchParams();
    if (queryName) params.set("name", queryName);
    if (selectedCategory) params.set("category", selectedCategory);
    if (selectedBrand) params.set("brand", selectedBrand);
    if (selectedMinPrice) params.set("minPrice", String(selectedMinPrice));
    if (selectedMaxPrice) params.set("maxPrice", String(selectedMaxPrice));

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "" || value === 0) {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });
    params.delete("page");

    router.push(params.toString() ? `/products?${params.toString()}` : "/products");
  };

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <h2 className="mb-6 flex items-center justify-between text-sm font-bold uppercase tracking-wide text-gray-800">
        Bộ lọc tìm kiếm
        {hasFilters && (
          <button
            type="button"
            onClick={() => router.push("/products")}
            className="text-xs font-medium normal-case text-blue-500 hover:underline"
          >
            Xóa lọc
          </button>
        )}
      </h2>

      <FilterGroup
        title="Loại thiết bị"
        options={categories}
        selectedValue={selectedCategory}
        onSelect={(value) =>
          pushFilters({
            category: selectedCategory === value ? null : value,
            brand: null,
          })
        }
      />

      {brands.length > 0 && (
        <FilterGroup
          title="Hãng"
          options={brands}
          selectedValue={selectedBrand}
          onSelect={(value) => pushFilters({ brand: selectedBrand === value ? null : value })}
        />
      )}

      <div className="mb-8">
        <h3 className="mb-4 text-xs font-bold text-gray-800">Mức giá</h3>
        <div className="space-y-4 rounded-lg border border-gray-100 bg-gray-50 p-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1 text-xs font-semibold text-gray-600">
              <span>Giá từ</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder={priceMin ? formatVndShort(priceMin) : "0"}
                value={minPriceInput}
                onChange={(event) => setMinPriceInput(event.target.value)}
                className="h-10 w-full rounded border border-gray-200 bg-white px-3 text-sm font-medium text-gray-800 outline-none transition focus:border-[#EE4D2D] focus:ring-2 focus:ring-orange-100"
              />
            </label>
            <label className="space-y-1 text-xs font-semibold text-gray-600">
              <span>Đến</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder={priceMax ? formatVndShort(priceMax) : "50tr"}
                value={maxPriceInput}
                onChange={(event) => setMaxPriceInput(event.target.value)}
                className="h-10 w-full rounded border border-gray-200 bg-white px-3 text-sm font-medium text-gray-800 outline-none transition focus:border-[#EE4D2D] focus:ring-2 focus:ring-orange-100"
              />
            </label>
          </div>
          <p className="text-[11px] font-medium text-gray-500">
            Gợi ý: {formatVndShort(priceMin)} - {formatVndShort(priceMax)}
          </p>
          <button
            type="button"
            onClick={() =>
              pushFilters({
                minPrice: normalizedPrice.low || null,
                maxPrice: normalizedPrice.high || null,
              })
            }
            className="w-full rounded bg-[#EE4D2D] px-3 py-2 text-xs font-bold text-white transition hover:bg-orange-600"
          >
            Áp dụng khoảng giá
          </button>
        </div>
      </div>
    </div>
  );
}

function parsePriceInput(value: string) {
  const normalized = value.trim().toLowerCase().replace(",", ".");
  const millionMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(tr|trieu|triệu|m|million)/);
  if (millionMatch) {
    const amount = Number(millionMatch[1]);
    return Number.isFinite(amount) && amount > 0 ? Math.round(amount * 1_000_000) : 0;
  }

  const thousandMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(k|nghin|nghìn)/);
  if (thousandMatch) {
    const amount = Number(thousandMatch[1]);
    return Number.isFinite(amount) && amount > 0 ? Math.round(amount * 1_000) : 0;
  }

  const parsed = Number(normalized.replace(/[^\d]/g, ""));
  if (Number.isFinite(parsed) && parsed > 0 && parsed < 1000) {
    return parsed * 1_000_000;
  }
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function FilterGroup({
  title,
  options,
  selectedValue,
  onSelect,
}: {
  title: string;
  options: FilterOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="mb-8">
      <h3 className="mb-4 text-xs font-bold text-gray-800">{title}</h3>
      <div className="flex flex-col gap-3 text-sm font-medium">
        {options.map((option) => {
          const isChecked = selectedValue === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelect(option.value)}
              className="group flex cursor-pointer items-center gap-3 text-left"
            >
              <span
                className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
                  isChecked ? "border-[#EE4D2D] bg-[#EE4D2D]" : "border-gray-300 bg-white group-hover:border-[#EE4D2D]"
                }`}
              >
                {isChecked && (
                  <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
              <span className={`${isChecked ? "text-[#EE4D2D]" : "text-gray-600 group-hover:text-[#EE4D2D]"} transition-colors`}>
                {option.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
