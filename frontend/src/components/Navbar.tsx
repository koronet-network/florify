"use client";

import Link from "next/link";
import { api, getUser, logout } from "@/lib/api";
import { useEffect, useState } from "react";
import FlorifyIcon from "./FlorifyIcon";
import { getCartCount } from "@/lib/cart";

export default function Navbar() {
  const [user, setUser] = useState<{ userId: string; name: string; role: string; slug?: string } | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    setUser(getUser());
    setCartCount(getCartCount());

    const handleCartUpdate = () => setCartCount(getCartCount());
    window.addEventListener("florify-cart-updated", handleCartUpdate);
    return () => window.removeEventListener("florify-cart-updated", handleCartUpdate);
  }, []);

  useEffect(() => {
    if (!user || user.role !== "vendor") return;

    const refreshNotificationCount = () => {
      api
        .getUnreadNotificationCount(user.userId)
        .then((result) => setNotificationCount(result.unreadCount))
        .catch(() => setNotificationCount(0));
    };

    refreshNotificationCount();
    window.addEventListener("florify-notifications-updated", refreshNotificationCount);
    return () => {
      window.removeEventListener("florify-notifications-updated", refreshNotificationCount);
    };
  }, [user]);

  return (
    <nav className="sticky top-0 z-50 border-b border-primary-700 bg-primary-900 shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href={user?.role === "vendor" ? "/vendor/dashboard" : "/marketplace"} className="flex items-center gap-2">
          <FlorifyIcon className="h-8 w-8" />
          <span className="text-xl font-bold text-white">Florify</span>
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              {user.role === "buyer" ? (
                <>
                  <Link href="/marketplace" className="text-sm font-medium text-primary-200 hover:text-accent-400">
                    Marketplace
                  </Link>
                  <Link
                    href="/marketplace/cart"
                    className="relative inline-flex items-center text-primary-200 hover:text-accent-400"
                    aria-label="Shopping cart"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="9" cy="20" r="1.5" />
                      <circle cx="18" cy="20" r="1.5" />
                      <path d="M3 4h2l2.4 10.5a2 2 0 0 0 2 1.5h7.9a2 2 0 0 0 2-1.6L21 7H7" />
                    </svg>
                    {cartCount > 0 && (
                      <span className="absolute -right-2 -top-2 min-w-[18px] rounded-full bg-accent-600 px-1 py-0.5 text-center text-[10px] font-bold leading-none text-white">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/vendor/dashboard" className="text-sm font-medium text-primary-200 hover:text-accent-400">
                    Dashboard
                  </Link>
                  <Link
                    href="/vendor/notifications"
                    className="relative inline-flex items-center text-primary-200 hover:text-accent-400"
                    aria-label="Notifications"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5m6 0a3 3 0 1 1-6 0" />
                    </svg>
                    {notificationCount > 0 && (
                      <span className="absolute -right-2 -top-2 min-w-[18px] rounded-full bg-accent-600 px-1 py-0.5 text-center text-[10px] font-bold leading-none text-white">
                        {notificationCount}
                      </span>
                    )}
                  </Link>
                </>
              )}
              <span className="rounded-full bg-primary-700 px-3 py-1 text-xs font-semibold text-primary-100">
                {user.name} ({user.role})
              </span>
              <button
                onClick={logout}
                className="rounded-md bg-primary-700 px-3 py-1.5 text-sm font-medium text-primary-200 hover:bg-primary-600 hover:text-white"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              href="/"
              className="rounded-md bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-700"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
