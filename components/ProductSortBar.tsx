"use client";

import { useRouter } from "next/navigation";

interface ProductSortBarProps {
  currentSort: string;
  queryString: string;
}

const sortOptions = [
  { key: "price-asc", label: "Giá tăng dần", sortBy: "price", sortDir: "asc" },
  { key: "price-desc", label: "Giá giảm dần", sortBy: "price", sortDir: "desc" },
  { key: "popular", label: "Phổ biến", sortBy: "ratingStars", sortDir: "desc" },
];

export default function ProductSortBar({ currentSort, queryString }: ProductSortBarProps) {
  const router = useRouter();

  const applySort = (option: (typeof sortOptions)[number]) => {
    const params = new URLSearchParams(queryString);
    params.set("sort", option.key);
    params.set("sortBy", option.sortBy);
    params.set("sortDir", option.sortDir);
    params.delete("page");
    router.push(`/products?${params.toString()}`);
  };

  return (
    <div className="mb-6 flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-3 px-4 shadow-sm">
      <span className="text-sm font-medium text-gray-600">Sắp xếp theo</span>
      <div className="flex flex-wrap gap-2">
        {sortOptions.map((option) => {
          const isActive = currentSort === option.key;
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => applySort(option)}
              className={
                isActive
                  ? "rounded bg-[#EE4D2D] px-4 py-1.5 text-sm font-bold text-white shadow-sm"
                  : "rounded border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 hover:text-[#EE4D2D]"
              }
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
