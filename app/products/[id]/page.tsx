import { Metadata } from "next";
import { API_BASE_URL } from "@/lib/auth";
import ProductClient from "./ProductClient";

interface Product {
  id: string | number;
  name: string;
  price?: number;
  oldPrice?: number;
  mainThumbnail?: string;
  images?: string[];
  shortDescription?: string;
  description?: string;
  brand?: string;
  sku?: string;
  category?: string;
  inStock?: boolean;
  availableQuantity?: number;
  status?: "ACTIVE" | "INACTIVE" | "OUT_OF_STOCK";
}

// Dùng cache fetch của Next.js (revalidate: 60) để chia sẻ kết quả
// giữa generateMetadata và ProductDetailPage trong cùng 1 request
async function getProduct(id: string): Promise<Product | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/products/${id}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  try {
    const resolvedParams = await params;
    const product = await getProduct(resolvedParams.id);

    if (!product) {
      return { title: "Chi tiết sản phẩm | SOPE" };
    }

    const title = `${product.name} | SOPE`;
    const description =
      product.shortDescription ||
      (product.description ? product.description.substring(0, 150) : "");
    const image =
      product.mainThumbnail || (product.images && product.images[0]) || "";

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: image ? [{ url: image }] : [],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: image ? [image] : [],
      },
    };
  } catch {
    return {
      title: "Chi tiết sản phẩm | SOPE",
    };
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const product = await getProduct(resolvedParams.id);

  // --- JSON-LD Structured Data (Schema.org Product) ---
  const jsonLd = product
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        image:
          product.mainThumbnail ||
          (product.images && product.images[0]) ||
          undefined,
        description:
          product.shortDescription ||
          (product.description
            ? product.description.substring(0, 300)
            : undefined),
        sku: product.sku || undefined,
        brand: product.brand
          ? {
              "@type": "Brand",
              name: product.brand,
            }
          : undefined,
        category: product.category || undefined,
        offers: product.price
          ? {
              "@type": "Offer",
              url: `https://sope.com/products/${product.id}`,
              priceCurrency: "VND",
              price: product.price,
              availability:
                product.inStock === false ||
                product.status === "OUT_OF_STOCK" ||
                product.availableQuantity === 0
                  ? "https://schema.org/OutOfStock"
                  : "https://schema.org/InStock",
            }
          : undefined,
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProductClient />
    </>
  );
}
