"use client";

import { useRouter } from "next/navigation";

interface ProductSortBarProps {
  currentSort: string;
  queryString: string;
}

const sortOptions = [
  { key: "popular", label: "Pho bien", sortBy: "id", sortDir: "asc" },
  { key: "newest", label: "Moi nhat", sortBy: "id", sortDir: "desc" },
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
      <span className="text-sm font-medium text-gray-600">Sap xep theo</span>
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
        <button
          type="button"
          disabled
          title="Chua co du lieu doanh so/luot ban de sap xep ban chay."
          className="cursor-not-allowed rounded border border-gray-200 bg-gray-50 px-4 py-1.5 text-sm font-medium text-gray-400"
        >
          Ban chay
        </button>
      </div>
    </div>
  );
}
