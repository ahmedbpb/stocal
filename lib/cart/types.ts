export type CartItem = {
  id: string;
  quantity: number;
  selectedSize: string | null;
  selectedColor: string | null;
  product: {
    id: string;
    title: string;
    price: number;
    imageUrl: string | null;
    productStatus: string;
    stockQuantity: number;
  };
};

export const CART_UPDATED_EVENT = "stocal:cart-updated";

export function notifyCartUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CART_UPDATED_EVENT));
  }
}
