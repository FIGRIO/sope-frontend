"use client";

import { addToCart } from "@/lib/shop";
import { useRouter } from "next/navigation";
import { MouseEvent, useState } from "react";

type ProductAddToCartButtonProps = {
  productId: number | string;
};

export default function ProductAddToCartButton({ productId }: ProductAddToCartButtonProps) {
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);
  const [message, setMessage] = useState("");

  const handleAdd = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const id = Number(productId);
    if (!Number.isFinite(id)) {
      setMessage("Khong the them san pham nay.");
      return;
    }

    setIsAdding(true);
    setMessage("");
    try {
      await addToCart(id, 1);
      setMessage("Da them vao gio.");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Khong the them vao gio.";
      setMessage(errorMessage);
      if (errorMessage.toLowerCase().includes("dang nhap")) {
        router.push("/login");
      }
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={handleAdd}
        disabled={isAdding}
        className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-[#EE4D2D] bg-white px-3 text-sm font-bold text-[#EE4D2D] transition hover:bg-[#EE4D2D] hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        {isAdding ? "Dang them..." : "Them vao gio"}
      </button>
      <p className="mt-1 min-h-4 text-xs font-medium text-gray-500">{message}</p>
    </div>
  );
}
