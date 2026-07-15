export const WISHLIST_UPDATED_EVENT = "sope:wishlist-updated";

export interface WishlistItem {
    id: string | number;
    name: string;
    price: number;
    image: string;
}

export function getWishlist(): WishlistItem[] {
    if (typeof window === "undefined") return [];
    try {
        const data = localStorage.getItem("sope_wishlist");
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

export function toggleWishlist(item: WishlistItem): boolean {
    const list = getWishlist();
    const index = list.findIndex((i) => String(i.id) === String(item.id));
    let isAdded = false;

    if (index > -1) {
        // Nếu đã có -> Xóa khỏi danh sách
        list.splice(index, 1);
    } else {
        // Nếu chưa có -> Thêm vào đầu danh sách
        list.unshift(item);
        isAdded = true;
    }

    localStorage.setItem("sope_wishlist", JSON.stringify(list));
    window.dispatchEvent(new Event(WISHLIST_UPDATED_EVENT));
    return isAdded;
}

export function checkIsInWishlist(id: string | number): boolean {
    const list = getWishlist();
    return list.some((i) => String(i.id) === String(id));
}