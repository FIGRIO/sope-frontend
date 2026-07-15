import { Metadata } from 'next';
import { API_BASE_URL } from '@/lib/auth';
import ProductClient from './ProductClient';

interface Product {
    id: string | number;
    name: string;
    mainThumbnail?: string;
    images?: string[];
    shortDescription?: string;
    description?: string;
}

export async function generateMetadata({
    params
}: {
    params: Promise<{ id: string }> | { id: string };
}): Promise<Metadata> {
    try {
        const resolvedParams = await params;
        const id = resolvedParams?.id;
        
        const res = await fetch(`${API_BASE_URL}/api/products/${id}`, {
            next: { revalidate: 60 }
        });
        
        if (!res.ok) {
            throw new Error("Failed to fetch product");
        }
        
        const product: Product = await res.json();
        
        const title = `${product.name} | SOPE`;
        const description = product.shortDescription || 
            (product.description ? product.description.substring(0, 150) : '');
        const image = product.mainThumbnail || (product.images && product.images[0]) || '';
        
        return {
            title,
            description,
            openGraph: {
                title,
                description,
                images: image ? [{ url: image }] : [],
            },
            twitter: {
                card: 'summary_large_image',
                title,
                description,
                images: image ? [image] : [],
            }
        };
    } catch (error) {
        return {
            title: "Chi tiết sản phẩm | SOPE",
        };
    }
}

export default function ProductDetailPage() {
    return <ProductClient />;
}
