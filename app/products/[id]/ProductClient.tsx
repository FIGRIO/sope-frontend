"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Header from "@/components/Header";
import ReviewModal from "@/components/ReviewModal";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { API_BASE_URL, getAccessToken } from "@/lib/auth";
import { parseJsonResponse } from "@/lib/api-response";
import { addToCart } from "@/lib/shop";
import {
  checkIsInWishlist,
  toggleWishlist,
  WISHLIST_UPDATED_EVENT,
} from "@/lib/wishlist";

type ReviewResponse = {
  id: number;
  productId: number;
  userId: number;
  username: string;
  rating: number;
  comment?: string | null;
  createdAt?: string | null;
};

type ProductReviewsResponse = {
  productId: number;
  averageRating: number;
  totalReviews: number;
  items: ReviewResponse[];
};

type AvailableCoupon = {
  code: string;
  description?: string | null;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  minOrderAmount?: number | null;
  maxDiscountAmount?: number | null;
  endAt?: string | null;
};

interface ProductVariant {
  id: number;
  sku: string;
  colorName: string;
  colorHex?: string;
  storageName: string;
  price?: number | null;
  oldPrice?: number | null;
  imageUrl?: string;
  stockQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  active: boolean;
  inStock: boolean;
}

interface Product {
  id: string | number;
  name: string;
  category?: string;
  brand?: string;
  sku?: string;
  price: number;
  oldPrice?: number;
  mainThumbnail?: string;
  images?: string[];
  shortDescription?: string;
  description?: string;
  specs?: Record<string, string>;
  variants?: ProductVariant[];
  availableQuantity?: number;
  inStock?: boolean;
  status?: "ACTIVE" | "INACTIVE" | "OUT_OF_STOCK";
}

interface ProductVariantApiResponse {
  id: number;
  sku: string;
  colorName?: string;
  colorHex?: string;
  storageName?: string;
  price?: number | null;
  oldPrice?: number | null;
  imageUrl?: string;
  stockQuantity?: number;
  reservedQuantity?: number;
  availableQuantity?: number;
  active?: boolean;
  inStock?: boolean;
  storage_name?: string;
  color_name?: string;
  color_hex?: string;
  old_price?: number;
  image_url?: string;
  stock_quantity?: number;
  reserved_quantity?: number;
  available_quantity?: number;
  in_stock?: boolean;
}

interface ProductApiResponse extends Omit<Product, "variants"> {
  old_price?: number;
  main_thumbnail?: string;
  short_description?: string;
  available_quantity?: number;
  in_stock?: boolean;
  variants?: ProductVariantApiResponse[];
}

interface RecentlyViewedProduct {
  id: string | number;
  name: string;
  price: number;
  image: string;
}

const formatPrice = (priceStr: string | number) => {
  if (!priceStr || priceStr === "Giá liên hệ") return "Giá liên hệ";
  let str = String(priceStr);
  if (str.endsWith(".0")) str = str.slice(0, -2);
  if (str.endsWith(".00")) str = str.slice(0, -3);
  const numericString = str.replace(/[^\d]/g, "");
  if (!numericString) return str;
  const num = parseInt(numericString, 10);
  return num.toLocaleString("vi-VN") + "₫";
};

const normalizeOption = (value?: string | null) => value?.trim() || "";

const formatReviewDate = (value?: string | null) => {
  if (!value) return "Gần đây";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const describeCoupon = (coupon: AvailableCoupon) => {
  const discount =
    coupon.discountType === "PERCENTAGE"
      ? `Giảm ${Number(coupon.discountValue).toLocaleString("vi-VN")}%`
      : `Giảm ${formatPrice(Number(coupon.discountValue))}`;
  const conditions: string[] = [];
  if (coupon.minOrderAmount) {
    conditions.push(`đơn từ ${formatPrice(coupon.minOrderAmount)}`);
  }
  if (coupon.maxDiscountAmount && coupon.discountType === "PERCENTAGE") {
    conditions.push(`tối đa ${formatPrice(coupon.maxDiscountAmount)}`);
  }
  return conditions.length > 0
    ? `${discount} · ${conditions.join(" · ")}`
    : discount;
};

async function readPublicApiError(response: Response) {
  const fallback = `Yêu cầu thất bại (${response.status}).`;
  const text = await response.text();
  if (!text) return fallback;
  try {
    const payload = JSON.parse(text) as { message?: string; error?: string };
    return payload.message || payload.error || fallback;
  } catch {
    return text;
  }
}

const SimilarProducts = ({ productId }: { productId: string | number }) => {
  const [similar, setSimilar] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!productId) return;
    let isMounted = true;
    const controller = new AbortController();

    const fetchRecommendations = async () => {
      setSimilar([]);
      setIsLoading(true);
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/recommendations/content-similar/${productId}`,
          { signal: controller.signal },
        );
        if (!res.ok) {
          return;
        }
        const data = await parseJsonResponse<unknown>(res);
        if (isMounted) {
          setSimilar(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (isMounted) {
          console.warn(
            "Không thể tải sản phẩm tương tự:",
            err instanceof Error ? err.message : "Lỗi không xác định",
          );
          setSimilar([]);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void fetchRecommendations();
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [productId]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6 mt-6">
        <div className="h-6 w-1/3 bg-gray-200 animate-pulse rounded-md mb-6"></div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((item) => (
            <div
              key={item}
              className="h-48 w-full bg-gray-100 animate-pulse rounded-lg"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  if (similar.length === 0) return null;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6 mt-6">
      <h2 className="text-lg font-bold mb-6 text-gray-800 uppercase tracking-wide flex items-center gap-2">
        <span className="text-[#EE4D2D]">✨</span> Sản phẩm có cấu hình tương tự
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {similar.map((prod) => (
          <Link
            href={`/products/${prod.id}`}
            key={prod.id}
            className="group relative flex cursor-pointer flex-col overflow-hidden rounded-lg border border-gray-100 hover:border-[#EE4D2D]/50 hover:shadow-md bg-white transition-all duration-300 hover:-translate-y-1"
          >
            <div className="aspect-square w-full bg-gray-50 relative overflow-hidden flex items-center justify-center p-4">
              {prod.mainThumbnail ? (
                <Image
                  src={prod.mainThumbnail}
                  alt={prod.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 20vw"
                  className="object-contain rounded-lg transition-transform duration-300 group-hover:scale-105"
                />
              ) : prod.images && prod.images.length > 0 ? (
                <Image
                  src={prod.images[0]}
                  alt={prod.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 20vw"
                  className="object-contain rounded-lg transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <span className="text-gray-300 text-sm">Hình sản phẩm</span>
              )}
            </div>
            <div className="flex flex-1 flex-col justify-between p-4">
              <h3 className="mb-2 line-clamp-2 text-[13px] font-medium text-gray-700 transition-colors group-hover:text-[#EE4D2D] leading-relaxed">
                {prod.name}
              </h3>
              <div className="mt-auto">
                <span className="text-sm font-bold text-[#D0021C]">
                  {formatPrice(prod.price)}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default function ProductClient() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id;

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [productLoadError, setProductLoadError] = useState("");
  const [isProductNotFound, setIsProductNotFound] = useState(false);

  const [isSpecsModalOpen, setIsSpecsModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [mainImage, setMainImage] = useState("");
  const [isArticleExpanded, setIsArticleExpanded] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [cartMessage, setCartMessage] = useState("");

  const [selectedStorage, setSelectedStorage] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [isReviewsLoading, setIsReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState("");

  const [availableCoupons, setAvailableCoupons] = useState<AvailableCoupon[]>(
    [],
  );
  const [isCouponsLoading, setIsCouponsLoading] = useState(true);
  const [couponError, setCouponError] = useState("");
  const [copiedCouponCode, setCopiedCouponCode] = useState("");

  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    if (!productId) return;
    void Promise.resolve().then(() => {
      setIsWishlisted(checkIsInWishlist(productId as string));
    });

    const handleWishlistChange = () => {
      setIsWishlisted(checkIsInWishlist(productId as string));
    };
    window.addEventListener(WISHLIST_UPDATED_EVENT, handleWishlistChange);
    return () =>
      window.removeEventListener(WISHLIST_UPDATED_EVENT, handleWishlistChange);
  }, [productId]);
  // ------------------------------------

  useEffect(() => {
    if (!productId) return;
    const controller = new AbortController();

    const loadProduct = async () => {
      setIsLoading(true);
      setProductLoadError("");
      setIsProductNotFound(false);
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/products/${productId}`,
          {
            signal: controller.signal,
          },
        );
        if (response.status === 404) {
          setProduct(null);
          setIsProductNotFound(true);
          return;
        }
        if (!response.ok) {
          throw new Error(await readPublicApiError(response));
        }

        const rawData = await parseJsonResponse<ProductApiResponse>(response);
        const mappedVariants: ProductVariant[] = (rawData.variants ?? [])
          .map((variant) => ({
            id: variant.id,
            sku: variant.sku,
            colorName: normalizeOption(variant.colorName ?? variant.color_name),
            colorHex:
              normalizeOption(variant.colorHex ?? variant.color_hex) ||
              undefined,
            storageName: normalizeOption(
              variant.storageName ?? variant.storage_name,
            ),
            price: variant.price ?? null,
            oldPrice: variant.oldPrice ?? variant.old_price ?? null,
            imageUrl: variant.imageUrl ?? variant.image_url,
            stockQuantity: variant.stockQuantity ?? variant.stock_quantity ?? 0,
            reservedQuantity:
              variant.reservedQuantity ?? variant.reserved_quantity ?? 0,
            availableQuantity:
              variant.availableQuantity ?? variant.available_quantity ?? 0,
            active: variant.active ?? true,
            inStock: variant.inStock ?? variant.in_stock ?? false,
          }))
          .filter((variant) => variant.active);

        const data: Product = {
          ...rawData,
          oldPrice: rawData.oldPrice ?? rawData.old_price,
          mainThumbnail: rawData.mainThumbnail ?? rawData.main_thumbnail,
          shortDescription:
            rawData.shortDescription ?? rawData.short_description,
          availableQuantity:
            rawData.availableQuantity ?? rawData.available_quantity,
          inStock: rawData.inStock ?? rawData.in_stock,
          variants: mappedVariants,
        };

        const initialVariant =
          mappedVariants.find(
            (variant) => variant.inStock && variant.availableQuantity > 0,
          ) ??
          mappedVariants[0] ??
          null;

        setProduct(data);
        setSelectedStorage(initialVariant?.storageName || null);
        setSelectedColor(initialVariant?.colorName || null);
        setMainImage(
          initialVariant?.imageUrl ||
            data.mainThumbnail ||
            data.images?.[0] ||
            "",
        );

        try {
          const stored = localStorage.getItem("sope_recently_viewed");
          let list = stored
            ? (JSON.parse(stored) as RecentlyViewedProduct[])
            : [];
          list = list.filter((item) => item.id !== data.id);
          list.unshift({
            id: data.id,
            name: data.name,
            price: initialVariant?.price ?? data.price,
            image:
              initialVariant?.imageUrl ||
              data.mainThumbnail ||
              data.images?.[0] ||
              "",
          });
          localStorage.setItem(
            "sope_recently_viewed",
            JSON.stringify(list.slice(0, 10)),
          );
        } catch (storageError) {
          console.warn("Không thể lưu lịch sử xem", storageError);
        }
      } catch (loadError) {
        if (
          loadError instanceof DOMException &&
          loadError.name === "AbortError"
        )
          return;
        console.warn(
          "Không thể tải dữ liệu sản phẩm:",
          loadError instanceof Error ? loadError.message : "Lỗi không xác định",
        );
        setProduct(null);
        setIsProductNotFound(false);
        setProductLoadError(
          loadError instanceof TypeError
            ? "Không thể kết nối tới máy chủ. Vui lòng kiểm tra kết nối mạng hoặc cấu hình CORS rồi thử lại."
            : loadError instanceof Error
              ? loadError.message
              : "Không thể tải sản phẩm. Vui lòng thử lại.",
        );
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    void loadProduct();
    return () => controller.abort();
  }, [productId]);

  useEffect(() => {
    const numericProductId = Number(productId);
    if (!Number.isFinite(numericProductId)) return;
    const controller = new AbortController();

    const loadReviews = async () => {
      setIsReviewsLoading(true);
      setReviewsError("");
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/products/${numericProductId}/reviews`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error(await readPublicApiError(response));
        const payload = await parseJsonResponse<ProductReviewsResponse>(response);
        setReviews(Array.isArray(payload.items) ? payload.items : []);
        setAverageRating(Number(payload.averageRating) || 0);
      } catch (loadError) {
        if (
          loadError instanceof DOMException &&
          loadError.name === "AbortError"
        )
          return;
        setReviews([]);
        setAverageRating(0);
        setReviewsError(
          loadError instanceof Error
            ? loadError.message
            : "Không thể tải đánh giá.",
        );
      } finally {
        if (!controller.signal.aborted) setIsReviewsLoading(false);
      }
    };

    const loadCoupons = async () => {
      setIsCouponsLoading(true);
      setCouponError("");
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/coupons/available?productId=${numericProductId}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error(await readPublicApiError(response));
        const payload = await parseJsonResponse<AvailableCoupon[]>(response);
        setAvailableCoupons(Array.isArray(payload) ? payload : []);
      } catch (loadError) {
        if (
          loadError instanceof DOMException &&
          loadError.name === "AbortError"
        )
          return;
        setAvailableCoupons([]);
        setCouponError(
          loadError instanceof Error
            ? loadError.message
            : "Không thể tải mã giảm giá.",
        );
      } finally {
        if (!controller.signal.aborted) setIsCouponsLoading(false);
      }
    };

    void Promise.all([loadReviews(), loadCoupons()]);
    return () => controller.abort();
  }, [productId]);

  const typedVariants = useMemo(
    () => (product?.variants ?? []).filter((variant) => variant.active),
    [product],
  );

  const storageOptions = useMemo(
    () =>
      Array.from(
        new Set(
          typedVariants.map((variant) => variant.storageName).filter(Boolean),
        ),
      ),
    [typedVariants],
  );

  const colorOptions = useMemo(
    () =>
      Array.from(
        new Set(
          typedVariants.map((variant) => variant.colorName).filter(Boolean),
        ),
      ),
    [typedVariants],
  );

  const activeVariant = useMemo(() => {
    if (typedVariants.length === 0) return null;
    return (
      typedVariants.find((variant) => {
        const matchStorage =
          storageOptions.length === 0 ||
          variant.storageName === selectedStorage;
        const matchColor =
          colorOptions.length === 0 || variant.colorName === selectedColor;
        return matchStorage && matchColor;
      }) ?? null
    );
  }, [
    typedVariants,
    storageOptions.length,
    colorOptions.length,
    selectedStorage,
    selectedColor,
  ]);

  const handleStorageSelect = (storageName: string) => {
    const compatibleVariants = typedVariants.filter(
      (variant) => variant.storageName === storageName,
    );
    const keepCurrentColor = compatibleVariants.find(
      (variant) =>
        variant.colorName === selectedColor &&
        variant.inStock &&
        variant.availableQuantity > 0,
    );
    const preferredVariant =
      keepCurrentColor ??
      compatibleVariants.find(
        (variant) => variant.inStock && variant.availableQuantity > 0,
      ) ??
      compatibleVariants[0];

    setSelectedStorage(storageName);
    if (colorOptions.length > 0) {
      setSelectedColor(preferredVariant?.colorName || null);
    }
  };

  const handleColorSelect = (colorName: string) => {
    const compatibleVariants = typedVariants.filter(
      (variant) => variant.colorName === colorName,
    );
    const keepCurrentStorage = compatibleVariants.find(
      (variant) =>
        variant.storageName === selectedStorage &&
        variant.inStock &&
        variant.availableQuantity > 0,
    );
    const preferredVariant =
      keepCurrentStorage ??
      compatibleVariants.find(
        (variant) => variant.inStock && variant.availableQuantity > 0,
      ) ??
      compatibleVariants[0];

    setSelectedColor(colorName);
    if (storageOptions.length > 0) {
      setSelectedStorage(preferredVariant?.storageName || null);
    }
  };

  useEffect(() => {
    const imageUrl = activeVariant?.imageUrl;
    if (imageUrl) {
      void Promise.resolve().then(() => setMainImage(imageUrl));
    }
  }, [activeVariant]);

  if (isLoading) {
    return (
      <div className="bg-[#F4F6F8] min-h-screen">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-20 flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-[#EE4D2D] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 mt-4 font-medium">
            Đang tải thông tin sản phẩm...
          </p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="bg-[#F4F6F8] min-h-screen">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-20 flex flex-col items-center">
          <h1 className="text-2xl font-bold text-gray-800">
            {isProductNotFound
              ? "Không tìm thấy sản phẩm"
              : "Không thể tải sản phẩm"}
          </h1>
          <p className="text-gray-500 mt-2">
            {isProductNotFound
              ? "Sản phẩm này không tồn tại hoặc đã bị xóa."
              : productLoadError ||
                "Máy chủ chưa phản hồi. Vui lòng tải lại trang sau ít phút."}
          </p>
        </div>
      </div>
    );
  }

  const handleAddToCart = async (goToCart = false) => {
    const id = Number(product.id);
    if (!Number.isFinite(id)) return;

    const variantIdToAdd = activeVariant ? activeVariant.id : undefined;

    if (typedVariants.length > 0) {
      if (!activeVariant) {
        setCartMessage("Vui lòng chọn đầy đủ phân loại.");
        return;
      }
      if (!activeVariant.inStock || activeVariant.availableQuantity <= 0) {
        setCartMessage("Phiên bản này hiện đang hết hàng.");
        return;
      }
    } else if (
      product.inStock === false ||
      product.status === "OUT_OF_STOCK" ||
      (product.availableQuantity != null && product.availableQuantity <= 0)
    ) {
      setCartMessage("Sản phẩm hiện đang hết hàng.");
      return;
    }

    setIsAddingToCart(true);
    setCartMessage("");
    try {
      await addToCart(id, 1, variantIdToAdd);
      setCartMessage("Đã thêm sản phẩm vào giỏ hàng.");
      if (goToCart) {
        router.push("/cart");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể thêm vào giỏ hàng.";
      setCartMessage(message);
      if (message.toLowerCase().includes("dang nhap")) {
        router.push("/login");
      }
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleToggleWishlist = () => {
    const result = toggleWishlist({
      id: product.id,
      name: product.name,
      price: activeVariant?.price ?? product.price,
      image:
        activeVariant?.imageUrl ||
        product.mainThumbnail ||
        product.images?.[0] ||
        "",
    });
    setIsWishlisted(result);
  };

  const handleOpenReview = () => {
    if (!getAccessToken()) {
      router.push("/login");
      return;
    }
    setIsReviewModalOpen(true);
  };

  const handleReviewSubmitted = (savedReview: ReviewResponse) => {
    setReviewsError("");
    setReviews((currentReviews) => {
      const nextReviews = [
        savedReview,
        ...currentReviews.filter((review) => review.id !== savedReview.id),
      ];
      const nextAverage =
        nextReviews.length > 0
          ? nextReviews.reduce((total, review) => total + review.rating, 0) /
            nextReviews.length
          : 0;
      setAverageRating(Math.round(nextAverage * 10) / 10);
      return nextReviews;
    });
  };

  const handleCopyCoupon = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCouponCode(code);
      window.setTimeout(() => setCopiedCouponCode(""), 1800);
    } catch {
      setCouponError(
        "Trình duyệt không cho phép sao chép tự động. Hãy chọn và sao chép mã thủ công.",
      );
    }
  };

  const reviewCount = reviews.length;
  const avgRating = averageRating;

  const cpu =
    product.specs?.["Chip xử lý (CPU)"] ||
    product.specs?.["Vi xử lý (CPU)"] ||
    product.specs?.["Công nghệ CPU"] ||
    "Đang cập nhật CPU";
  const screenTech = product.specs?.["Công nghệ màn hình"] || "";
  const screenSize =
    product.specs?.["Màn hình rộng"] ||
    product.specs?.["Màn hình"] ||
    product.specs?.["Kích thước màn hình"] ||
    "";
  const cleanScreenSize = screenSize.split("-")[0].trim();
  const screenInfo =
    [cleanScreenSize, screenTech].filter(Boolean).join(", ") ||
    "Đang cập nhật màn hình";

  const currentDisplayPrice = activeVariant?.price ?? product.price;
  const currentOldPrice = activeVariant?.oldPrice ?? product.oldPrice;
  const displayCurrentPrice = formatPrice(currentDisplayPrice);
  let displayOriginalPrice = formatPrice(currentOldPrice || 0);

  let discountPercent = 0;
  if (
    currentDisplayPrice &&
    currentOldPrice &&
    currentOldPrice > currentDisplayPrice
  ) {
    discountPercent = Math.round(
      ((currentOldPrice - currentDisplayPrice) / currentOldPrice) * 100,
    );
  } else {
    displayOriginalPrice = "";
  }

  const categoryHref = product.category
    ? `/products?category=${encodeURIComponent(product.category)}`
    : "/products";
  const brandParams = new URLSearchParams();
  if (product.category) brandParams.set("category", product.category);
  if (product.brand) brandParams.set("brand", product.brand);
  const brandHref = brandParams.toString()
    ? `/products?${brandParams.toString()}`
    : categoryHref;

  const galleryImages = Array.from(
    new Set(
      [
        product.mainThumbnail,
        activeVariant?.imageUrl,
        ...typedVariants.map((variant) => variant.imageUrl),
        ...(product.images ?? []),
      ].filter((image): image is string => Boolean(image)),
    ),
  );

  const isOutOfStock =
    typedVariants.length > 0
      ? !activeVariant?.inStock || (activeVariant.availableQuantity ?? 0) <= 0
      : product.inStock === false ||
        product.status === "OUT_OF_STOCK" ||
        (product.availableQuantity != null && product.availableQuantity <= 0);

  const variantLabel = [activeVariant?.storageName, activeVariant?.colorName]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="bg-[#F4F6F8] min-h-screen pb-10">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-6">
        <nav className="text-sm font-medium text-gray-500 mb-6 flex items-center gap-2">
          <Link href="/" className="hover:text-[#EE4D2D] transition-colors">
            Trang chủ
          </Link>
          <span>{">"}</span>
          <Link
            href={categoryHref}
            className="hover:text-[#EE4D2D] transition-colors capitalize"
          >
            {product.category || "Sản phẩm"}
          </Link>
          {product.brand && (
            <>
              <span>{">"}</span>
              <Link
                href={brandHref}
                className="hover:text-[#EE4D2D] transition-colors"
              >
                {product.brand}
              </Link>
            </>
          )}
          <span>{">"}</span>
          <span className="text-[#EE4D2D] font-semibold">{product.name}</span>
        </nav>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-10 mb-6">
          <div className="w-full md:w-5/12 flex flex-col items-center">
            <div className="w-full bg-white border border-gray-100 rounded-xl mb-4 flex items-center justify-center overflow-hidden transition-all duration-300">
              {mainImage ? (
                <div className="relative aspect-square w-full">
                  <Image
                    src={mainImage}
                    alt={product.name}
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 40vw"
                    className="rounded-xl object-contain transition-transform duration-500 hover:scale-105"
                    onError={() => {
                      if (
                        product.mainThumbnail &&
                        mainImage !== product.mainThumbnail
                      ) {
                        setMainImage(product.mainThumbnail);
                      } else {
                        setMainImage("");
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="aspect-square w-full flex items-center justify-center bg-gray-50 rounded-xl">
                  <span className="text-gray-300 text-sm font-medium">
                    Không có ảnh
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-3 overflow-x-auto w-full pb-2 scrollbar-hide">
              {galleryImages.map((imgUrl: string, idx: number) => (
                <div
                  key={idx}
                  onClick={() => setMainImage(imgUrl)}
                  className={`w-16 h-16 shrink-0 rounded-lg border-2 cursor-pointer overflow-hidden bg-white relative
                                        ${mainImage === imgUrl ? "border-[#EE4D2D]" : "border-gray-200 hover:border-gray-300"}`}
                >
                  <Image
                    src={imgUrl}
                    alt={`Thumb ${idx}`}
                    fill
                    sizes="64px"
                    className="object-contain p-1"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="w-full md:w-7/12 flex flex-col">
            <h1 className="text-2xl font-bold text-gray-800 mb-2 leading-snug">
              {product.name}
            </h1>

            <div className="flex items-center gap-4 mb-4 text-sm text-gray-500 border-b border-gray-100 pb-4">
              <span className="text-gray-600">
                Thương hiệu:{" "}
                <span className="font-semibold text-[#EE4D2D]">
                  {product.brand}
                </span>
              </span>
              <span className="text-gray-300">|</span>
              <span>SKU: {activeVariant?.sku || product.sku}</span>
              <span className="text-gray-300">|</span>
              <div className="flex items-center gap-1">
                <span className="text-[#FFD400] text-sm">★</span>
                <span className="font-semibold text-gray-700">
                  {avgRating.toFixed(1)}
                </span>
                <span>({reviewCount} đánh giá)</span>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-end gap-3">
                <span className="text-3xl font-extrabold text-[#D0021C]">
                  {displayCurrentPrice}
                </span>
                {discountPercent > 0 && displayOriginalPrice && (
                  <>
                    <span className="text-base text-gray-400 line-through mb-1 hover:text-gray-600">
                      {displayOriginalPrice}
                    </span>
                    <span className="text-xs font-bold text-white bg-[#D0021C] px-1.5 py-0.5 rounded mb-1.5">
                      -{discountPercent}%
                    </span>
                  </>
                )}
              </div>
              {typedVariants.length > 0 && activeVariant ? (
                <p
                  className={`mt-2 text-sm font-medium ${isOutOfStock ? "text-red-500" : "text-green-600"}`}
                >
                  {isOutOfStock
                    ? "Đã hết hàng"
                    : `Còn ${activeVariant.availableQuantity} sản phẩm`}
                </p>
              ) : product.availableQuantity != null ? (
                <p
                  className={`mt-2 text-sm font-medium ${isOutOfStock ? "text-red-500" : "text-green-600"}`}
                >
                  {isOutOfStock
                    ? "Đã hết hàng"
                    : `Còn ${product.availableQuantity} sản phẩm`}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2 mb-5">
              <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">
                Chip: {cpu}
              </span>
              <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">
                Màn hình: {screenInfo}
              </span>
            </div>

            {storageOptions.length > 0 && (
              <div className="mb-5">
                <h3 className="mb-3 text-sm font-bold text-gray-800">
                  Phiên bản bộ nhớ:
                </h3>
                <div className="flex flex-wrap gap-3">
                  {storageOptions.map((storageName) => {
                    const variantsForStorage = typedVariants.filter(
                      (variant) => variant.storageName === storageName,
                    );
                    const isAvailable = variantsForStorage.some(
                      (variant) =>
                        variant.inStock && variant.availableQuantity > 0,
                    );
                    const isSelected = selectedStorage === storageName;
                    return (
                      <button
                        key={storageName}
                        type="button"
                        onClick={() => handleStorageSelect(storageName)}
                        disabled={!isAvailable}
                        className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                          isSelected
                            ? "border-[#EE4D2D] bg-orange-50 text-[#EE4D2D]"
                            : isAvailable
                              ? "border-gray-200 text-gray-600 hover:border-gray-400"
                              : "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 line-through"
                        }`}
                      >
                        {storageName}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {colorOptions.length > 0 && (
              <div className="mb-6">
                <h3 className="mb-3 text-sm font-bold text-gray-800">
                  Chọn màu sắc:
                </h3>
                <div className="flex flex-wrap gap-3">
                  {colorOptions.map((colorName) => {
                    const variantsForColor = typedVariants.filter(
                      (variant) => variant.colorName === colorName,
                    );
                    const isAvailable = variantsForColor.some(
                      (variant) =>
                        variant.inStock && variant.availableQuantity > 0,
                    );
                    const isSelected = selectedColor === colorName;
                    const colorHex = variantsForColor.find(
                      (variant) => variant.colorHex,
                    )?.colorHex;
                    return (
                      <button
                        key={colorName}
                        type="button"
                        onClick={() => handleColorSelect(colorName)}
                        disabled={!isAvailable}
                        className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                          isSelected
                            ? "border-[#EE4D2D] bg-orange-50 text-[#EE4D2D]"
                            : isAvailable
                              ? "border-gray-200 text-gray-600 hover:border-gray-400"
                              : "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 line-through"
                        }`}
                      >
                        {colorHex && (
                          <span
                            className="h-4 w-4 rounded-full border border-gray-300"
                            style={{ backgroundColor: colorHex }}
                            aria-hidden="true"
                          />
                        )}
                        {colorName}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {product.shortDescription && (
              <div className="mb-6 mt-auto rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                <h3 className="mb-2 text-sm font-bold text-blue-800">
                  Thông tin khuyến mãi:
                </h3>
                <p className="text-sm leading-relaxed text-gray-700">
                  {product.shortDescription}
                </p>
              </div>
            )}

            <div className="mb-6 rounded-xl border border-orange-100 bg-orange-50 p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-orange-800">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                  />
                </svg>
                Mã giảm giá dành cho sản phẩm
              </h3>

              {isCouponsLoading ? (
                <div className="h-16 animate-pulse rounded-lg bg-white/80" />
              ) : availableCoupons.length > 0 ? (
                <div className="space-y-2">
                  {availableCoupons.map((coupon) => (
                    <div
                      key={coupon.code}
                      className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-orange-200 bg-white p-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#EE4D2D]">
                          {coupon.code}
                        </p>
                        <p className="mt-0.5 text-xs leading-5 text-gray-600">
                          {coupon.description || describeCoupon(coupon)}
                        </p>
                        {coupon.description && (
                          <p className="text-xs leading-5 text-gray-500">
                            {describeCoupon(coupon)}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleCopyCoupon(coupon.code)}
                        className="shrink-0 rounded bg-[#EE4D2D] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-orange-600"
                      >
                        {copiedCouponCode === coupon.code
                          ? "Đã chép"
                          : "Sao chép"}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-lg bg-white px-3 py-4 text-sm text-gray-500">
                  Hiện chưa có mã giảm giá phù hợp với sản phẩm này.
                </p>
              )}

              {couponError && (
                <p className="mt-2 text-xs font-medium text-red-600">
                  {couponError}
                </p>
              )}
              <p className="mt-2 text-xs text-gray-500">
                Mã sẽ được kiểm tra lại theo giỏ hàng, thời hạn và giới hạn của
                tài khoản tại bước thanh toán.
              </p>
            </div>

            <div className="mb-5 flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50/80 p-3 text-sm text-blue-800">
              <svg
                className="h-5 w-5 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>
                Dự kiến giao hàng:{" "}
                <strong className="font-bold">
                  {isOutOfStock
                    ? "Không thể giao (Hết hàng)"
                    : "Tính theo địa chỉ ở bước thanh toán"}
                </strong>
              </span>
            </div>

            {/* --- NÚT BẤM (CÓ BỔ SUNG NÚT YÊU THÍCH) --- */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => handleAddToCart(true)}
                disabled={isAddingToCart || isOutOfStock}
                className={`flex-1 font-bold py-3.5 rounded-xl transition-colors shadow-sm text-lg text-white
                                    ${isOutOfStock ? "bg-gray-400 cursor-not-allowed" : "bg-[#EE4D2D] hover:bg-orange-600 disabled:opacity-70"}`}
              >
                CHỌN MUA
              </button>
              <button
                onClick={() => handleAddToCart(false)}
                disabled={isAddingToCart || isOutOfStock}
                className={`flex-1 flex items-center justify-center gap-2 border-2 font-bold py-3.5 rounded-xl transition-colors text-base
                                    ${isOutOfStock ? "border-gray-300 text-gray-400 cursor-not-allowed" : "border-[#EE4D2D] text-[#EE4D2D] hover:bg-orange-50 disabled:opacity-70"}`}
              >
                <svg
                  width="22"
                  height="22"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                {isAddingToCart ? "Đang thêm..." : "Thêm vào giỏ"}
              </button>

              {/* Nút Yêu Thích */}
              <button
                onClick={handleToggleWishlist}
                className={`w-14 shrink-0 flex items-center justify-center border-2 rounded-xl transition-colors ${
                  isWishlisted
                    ? "border-red-500 text-red-500 bg-red-50"
                    : "border-gray-300 text-gray-400 hover:border-red-500 hover:text-red-500 hover:bg-red-50"
                }`}
                aria-label="Yêu thích"
              >
                <svg
                  width="24"
                  height="24"
                  fill={isWishlisted ? "currentColor" : "none"}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </button>
            </div>
            {/* -------------------------------------- */}

            {cartMessage && (
              <p
                className={`mt-3 text-sm font-medium ${cartMessage.includes("hết hàng") || cartMessage.includes("Vui lòng") ? "text-red-500" : "text-green-600"}`}
              >
                {cartMessage}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 mb-6">
          <div className="w-full lg:w-4/12 bg-white rounded-xl p-6 shadow-sm border border-gray-100 h-fit">
            <h2 className="text-lg font-bold mb-5 text-gray-800 uppercase tracking-wide">
              Cấu hình nổi bật
            </h2>
            <ul className="flex flex-col text-sm text-gray-700">
              {product.specs &&
                Object.entries(product.specs)
                  .slice(0, 8)
                  .map(([key, value], idx) => (
                    <li
                      key={idx}
                      className={`flex justify-between py-3 ${idx !== 0 ? "border-t border-gray-100" : ""}`}
                    >
                      <span className="w-1/2 text-gray-500 pr-4">{key}</span>
                      <span className="w-1/2 font-medium">{String(value)}</span>
                    </li>
                  ))}
            </ul>
            <button
              onClick={() => setIsSpecsModalOpen(true)}
              className="w-full mt-5 py-2.5 text-sm font-medium text-blue-600 border border-blue-600 rounded-full hover:bg-blue-50 transition-colors"
            >
              Xem cấu hình chi tiết
            </button>
          </div>

          <div className="w-full lg:w-8/12 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold mb-5 text-gray-800 uppercase tracking-wide">
              Đặc điểm nổi bật
            </h2>
            <div className="text-sm text-gray-700 leading-loose">
              {isArticleExpanded ? (
                <div className="space-y-4 text-justify">
                  {(() => {
                    if (!product.description)
                      return <p>Đang cập nhật thông bài viết.</p>;

                    const lines = product.description
                      .split("\n")
                      .map((l: string) => l.trim())
                      .filter(Boolean);
                    const images = product.images || [];

                    const step = Math.max(
                      1,
                      Math.floor(lines.length / (images.length || 1)),
                    );
                    let imgIndex = 0;

                    return (
                      <>
                        {lines.map((line: string, idx: number) => {
                          const isSubHeading =
                            (line.length < 120 && line.includes("?")) ||
                            line.startsWith("Đặc điểm");

                          return (
                            <React.Fragment key={idx}>
                              {isSubHeading ? (
                                <h3 className="text-base font-bold text-gray-900 mt-6 mb-3 pt-2 block">
                                  {line}
                                </h3>
                              ) : (
                                <p className="text-sm text-gray-600 leading-relaxed mb-3">
                                  {line}
                                </p>
                              )}

                              {idx > 0 &&
                                idx % step === 0 &&
                                imgIndex < images.length && (
                                  <div className="my-6 flex justify-center bg-gray-50/50 rounded-xl border border-gray-100 overflow-hidden">
                                    <Image
                                      src={images[imgIndex++]}
                                      alt={`${product.name} - Hình minh họa ${imgIndex}`}
                                      width={672}
                                      height={672}
                                      sizes="(max-width: 768px) 100vw, 672px"
                                      className="w-full max-w-2xl h-auto rounded-lg object-contain shadow-sm"
                                    />
                                  </div>
                                )}
                            </React.Fragment>
                          );
                        })}
                        {imgIndex < images.length && (
                          <div className="flex flex-col gap-4 mt-6">
                            {images
                              .slice(imgIndex)
                              .map((imgUrl: string, idx: number) => (
                                <div
                                  key={idx}
                                  className="flex justify-center bg-gray-50/50 rounded-xl border border-gray-100 overflow-hidden"
                                >
                                  <Image
                                    src={imgUrl}
                                    alt={`${product.name} - Hình bổ sung ${idx + 1}`}
                                    width={672}
                                    height={672}
                                    sizes="(max-width: 768px) 100vw, 672px"
                                    className="w-full max-w-2xl h-auto rounded-lg object-contain shadow-sm"
                                  />
                                </div>
                              ))}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              ) : (
                <div className="relative">
                  <p className="text-justify text-sm text-gray-600 leading-relaxed">
                    {product.shortDescription || "Đang cập nhật thông tin."}
                  </p>
                  <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-center border-t border-gray-100 pt-4">
              <button
                onClick={() => setIsArticleExpanded(!isArticleExpanded)}
                className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 transition-colors px-4 py-2 rounded-full hover:bg-blue-50"
              >
                {isArticleExpanded ? "Thu gọn bài viết" : "Đọc thêm bài viết"}
                <svg
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  className={`transform transition-transform duration-300 ${isArticleExpanded ? "rotate-180" : ""}`}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold uppercase tracking-wide text-gray-800">
                Đánh giá khách hàng
                <span className="text-sm font-normal normal-case text-gray-500">
                  ({reviewCount} đánh giá)
                </span>
              </h2>
              <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                <div className="flex text-[#FFD400]">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={
                        star <= Math.round(avgRating) ? "" : "text-gray-300"
                      }
                    >
                      ★
                    </span>
                  ))}
                </div>
                <strong>{avgRating.toFixed(1)}/5</strong>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenReview}
              className="rounded-lg border border-[#EE4D2D] px-4 py-2.5 text-sm font-bold text-[#EE4D2D] transition hover:bg-orange-50"
            >
              Viết đánh giá
            </button>
          </div>

          {isReviewsLoading ? (
            <div className="space-y-4">
              {[1, 2].map((item) => (
                <div
                  key={item}
                  className="h-24 animate-pulse rounded-xl bg-gray-100"
                />
              ))}
            </div>
          ) : reviewsError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {reviewsError}
            </div>
          ) : reviews.length > 0 ? (
            <div className="flex flex-col gap-6">
              {reviews.map((review, index) => (
                <div
                  key={review.id}
                  className={`pb-6 ${index !== reviewCount - 1 ? "border-b border-gray-100" : ""}`}
                >
                  <div className="mb-2 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 font-bold uppercase text-gray-500">
                      {review.username?.charAt(0) || "U"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {review.username || "Người dùng"}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                        <div className="flex text-[#FFD400]">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={
                                star <= review.rating ? "" : "text-gray-300"
                              }
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <span>•</span>
                        <span>{formatReviewDate(review.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <p className="rounded-xl bg-gray-50 p-4 text-sm leading-relaxed text-gray-600">
                    {review.comment?.trim() ||
                      "Người dùng không để lại bình luận."}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-gray-50 py-10 text-center text-sm text-gray-500">
              <p>Chưa có đánh giá nào cho sản phẩm này.</p>
              <button
                type="button"
                onClick={handleOpenReview}
                className="mt-3 font-bold text-[#EE4D2D] hover:underline"
              >
                Hãy là người đánh giá đầu tiên
              </button>
            </div>
          )}
        </div>
        <SimilarProducts productId={productId as string} />
      </main>

      {isSpecsModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="absolute inset-0"
            onClick={() => setIsSpecsModalOpen(false)}
          ></div>
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl relative z-10 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                Thông số kỹ thuật chi tiết
              </h2>
              <button
                onClick={() => setIsSpecsModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <svg
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto p-6 space-y-1 custom-scrollbar">
              {product.specs ? (
                Object.entries(product.specs).map(([key, value], idx) => (
                  <div
                    key={idx}
                    className={`flex py-3.5 px-3 text-sm items-start rounded-lg ${idx % 2 === 0 ? "bg-gray-50" : "bg-white"}`}
                  >
                    <span className="w-5/12 text-gray-500 font-medium pr-4 shrink-0">
                      {key}
                    </span>
                    <span className="w-7/12 text-gray-800 font-semibold whitespace-pre-line text-left">
                      {String(value)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-10">
                  Không tìm thấy thông số kỹ thuật.
                </p>
              )}
            </div>
            <div className="p-4 border-t border-gray-100 flex justify-end bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => setIsSpecsModalOpen(false)}
                className="bg-gray-900 hover:bg-gray-800 text-white font-bold px-6 py-2 rounded-xl text-sm transition-colors shadow-sm"
              >
                Đóng lại
              </button>
            </div>
          </div>
        </div>
      )}

      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        productId={Number(product.id)}
        productName={product.name}
        productImage={
          activeVariant?.imageUrl ||
          product.mainThumbnail ||
          product.images?.[0]
        }
        variantLabel={variantLabel}
        onSubmitted={handleReviewSubmitted}
        onRequireLogin={() => router.push("/login")}
      />
    </div>
  );
}
