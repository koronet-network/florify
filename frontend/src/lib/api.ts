const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function getUser(): { userId: string; email: string; role: string; name: string; slug?: string } | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/";
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || res.statusText);
  }

  return res.json();
}

export const api = {
  login: (email: string, password: string) =>
    request<{ token: string; user: { userId: string; email: string; role: string; name: string; slug?: string } }>(
      "/api/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }) }
    ),

  getVendors: () =>
    request<Array<{ userId: string; name: string; email: string; slug?: string }>>(
      "/api/auth/vendors"
    ),

  getProducts: () =>
    request<Array<{
      canonicalName: string;
      lowestPrice: number;
      vendorCount: number;
      category: string;
      color: string;
      stemPerBunch: number;
      unitPerBox: number;
      boxType: string;
    }>>("/api/products"),

  getTrending: () =>
    request<Array<{
      canonicalName: string;
      totalSold: number;
      lowestPrice: number;
      vendorCount: number;
      category: string;
      color: string;
      stemPerBunch: number;
      unitPerBox: number;
      boxType: string;
    }>>("/api/products/trending"),

  getProductDetail: (canonicalName: string) =>
    request<{
      canonicalName: string;
      category: string;
      color: string;
      offers: Array<{
        productId: string;
        vendorId: string;
        vendorName: string;
        price: number;
        stemPerBunch: number;
        unitPerBox: number;
        boxType: string;
      }>;
    }>(`/api/products/${encodeURIComponent(canonicalName)}`),

  getVendorProducts: () =>
    request<Array<{
      productId: string;
      canonicalName: string;
      price: number;
      category: string;
      color: string;
      stemPerBunch: number;
      unitPerBox: number;
      boxType: string;
      createdAt: string;
    }>>("/api/vendor/products"),

  createProduct: (data: Record<string, unknown>) =>
    request("/api/vendor/products", { method: "POST", body: JSON.stringify(data) }),

  updateProduct: (id: string, data: Record<string, unknown>) =>
    request(`/api/vendor/products/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  deleteProduct: (id: string) =>
    request(`/api/vendor/products/${id}`, { method: "DELETE" }),

  getNotifications: (vendorId: string) =>
    request<Array<{
      canonicalName: string;
      yourPrice: number;
      marketAverage: number;
      lowestMarketPrice: number;
      percentAbove: number;
      difference: number;
      isRead: boolean;
    }>>(`/api/vendor/notifications/${vendorId}`),

  getUnreadNotificationCount: (vendorId: string) =>
    request<{ unreadCount: number }>(
      `/api/vendor/notifications/${vendorId}/unread-count`
    ),

  markNotificationRead: (canonicalName: string) =>
    request<{ success: true }>("/api/vendor/notifications/read", {
      method: "PUT",
      body: JSON.stringify({ canonicalName }),
    }),

  markAllNotificationsRead: () =>
    request<{ success: true; count: number }>("/api/vendor/notifications/read-all", {
      method: "PUT",
    }),

  createOrder: (items: Array<{
    productId: string;
    vendorId: string;
    vendorName: string;
    canonicalName: string;
    price: number;
    quantity: number;
  }>) =>
    request<{
      orderId: string;
      buyerId: string;
      buyerName: string;
      items: Array<{
        productId: string;
        vendorId: string;
        vendorName: string;
        canonicalName: string;
        price: number;
        quantity: number;
      }>;
      total: number;
      status: string;
      createdAt: string;
    }>("/api/orders", {
      method: "POST",
      body: JSON.stringify({ items }),
    }),

  getOrders: () =>
    request<Array<{
      orderId: string;
      buyerId: string;
      buyerName: string;
      items: Array<{
        productId: string;
        vendorId: string;
        vendorName: string;
        canonicalName: string;
        price: number;
        quantity: number;
      }>;
      total: number;
      status: string;
      createdAt: string;
    }>>("/api/orders"),
};
