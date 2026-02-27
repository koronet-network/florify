export interface CartItem {
  productId: string;
  vendorId: string;
  vendorName: string;
  canonicalName: string;
  price: number;
  quantity: number;
}

const CART_KEY = "florify_cart";

function emitCartUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("florify-cart-updated"));
}

function persistCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  emitCartUpdated();
}

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(CART_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as CartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addToCart(item: CartItem) {
  const cart = getCart();
  const existingIndex = cart.findIndex(
    (cartItem) => cartItem.productId === item.productId
  );

  if (existingIndex >= 0) {
    const existing = cart[existingIndex];
    cart[existingIndex] = {
      ...existing,
      quantity: existing.quantity + item.quantity,
    };
  } else {
    cart.push(item);
  }

  persistCart(cart);
}

export function updateQuantity(productId: string, quantity: number) {
  const cart = getCart();
  const next = cart
    .map((item) =>
      item.productId === productId
        ? { ...item, quantity: Math.max(0, Math.floor(quantity)) }
        : item
    )
    .filter((item) => item.quantity > 0);

  persistCart(next);
}

export function removeFromCart(productId: string) {
  const cart = getCart();
  const next = cart.filter((item) => item.productId !== productId);
  persistCart(next);
}

export function clearCart() {
  persistCart([]);
}

export function getCartTotal() {
  return getCart().reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
}

export function getCartCount() {
  return getCart().reduce((sum, item) => sum + item.quantity, 0);
}
