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
  storages: FilterOption[];
  selectedCategory: string;
  selectedBrand: string;
  selectedStorage: string;
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
  storages,
  selectedCategory,
  selectedBrand,
  selectedStorage,
  selectedMinPrice,
  selectedMaxPrice,
  priceMin,
  priceMax,
  queryName,
}: ProductFilterSidebarProps) {
  const router = useRouter();
  const [minPrice, setMinPrice] = useState(selectedMinPrice || priceMin);
  const [maxPrice, setMaxPrice] = useState(selectedMaxPrice || priceMax);
  const hasFilters = Boolean(
    selectedCategory ||
      selectedBrand ||
      selectedStorage ||
      queryName ||
      selectedMinPrice ||
      selectedMaxPrice
  );

  const normalizedPrice = useMemo(() => {
    const low = Math.min(minPrice, maxPrice);
    const high = Math.max(minPrice, maxPrice);
    return { low, high };
  }, [minPrice, maxPrice]);

  const pushFilters = (updates: Record<string, string | number | null>) => {
    const params = new URLSearchParams();
    if (queryName) params.set("name", queryName);
    if (selectedCategory) params.set("category", selectedCategory);
    if (selectedBrand) params.set("brand", selectedBrand);
    if (selectedStorage) params.set("storage", selectedStorage);
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
        Bo loc tim kiem
        {hasFilters && (
          <button
            type="button"
            onClick={() => router.push(queryName ? `/products?name=${encodeURIComponent(queryName)}` : "/products")}
            className="text-xs font-medium normal-case text-blue-500 hover:underline"
          >
            Xoa loc
          </button>
        )}
      </h2>

      <FilterGroup
        title="Loai thiet bi"
        options={categories}
        selectedValue={selectedCategory}
        onSelect={(value) =>
          pushFilters({
            category: selectedCategory === value ? null : value,
            brand: null,
            storage: selectedStorage,
          })
        }
      />

      {brands.length > 0 && (
        <FilterGroup
          title="Hang"
          options={brands}
          selectedValue={selectedBrand}
          onSelect={(value) => pushFilters({ brand: selectedBrand === value ? null : value })}
        />
      )}

      <div className="mb-8">
        <h3 className="mb-4 text-xs font-bold text-gray-800">Muc gia</h3>
        <div className="space-y-4 rounded-lg border border-gray-100 bg-gray-50 p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-600">
            <span>{formatVndShort(normalizedPrice.low)}</span>
            <span>{formatVndShort(normalizedPrice.high)}</span>
          </div>
          <input
            type="range"
            min={priceMin}
            max={priceMax}
            step={500000}
            value={minPrice}
            onChange={(event) => setMinPrice(Number(event.target.value))}
            className="w-full accent-[#EE4D2D]"
          />
          <input
            type="range"
            min={priceMin}
            max={priceMax}
            step={500000}
            value={maxPrice}
            onChange={(event) => setMaxPrice(Number(event.target.value))}
            className="w-full accent-[#EE4D2D]"
          />
          <button
            type="button"
            onClick={() =>
              pushFilters({
                minPrice: normalizedPrice.low <= priceMin ? null : normalizedPrice.low,
                maxPrice: normalizedPrice.high >= priceMax ? null : normalizedPrice.high,
              })
            }
            className="w-full rounded bg-[#EE4D2D] px-3 py-2 text-xs font-bold text-white transition hover:bg-orange-600"
          >
            Ap dung khoang gia
          </button>
        </div>
      </div>

      {storages.length > 0 && (
        <div>
          <h3 className="mb-4 text-xs font-bold text-gray-800">Dung luong luu tru</h3>
          <div className="flex flex-wrap gap-2">
            {storages.map((option) => {
              const isActive = selectedStorage === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => pushFilters({ storage: isActive ? null : option.value })}
                  className={`rounded border px-3 py-1.5 text-[11px] font-medium transition-colors ${
                    isActive
                      ? "border-[#EE4D2D] bg-orange-50 text-[#EE4D2D]"
                      : "border-gray-200 bg-white text-gray-600 hover:border-[#EE4D2D]/50 hover:bg-orange-50/30 hover:text-[#EE4D2D]"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
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
