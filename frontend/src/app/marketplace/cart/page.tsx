"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { getUser } from "@/lib/api";
import {
  CartItem,
  clearCart,
  getCart,
  getCartTotal,
  removeFromCart,
  updateQuantity,
} from "@/lib/cart";

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);

  function refreshCart() {
    setItems(getCart());
  }

  useEffect(() => {
    const user = getUser();
    if (!user || user.role !== "buyer") {
      router.replace("/");
      return;
    }

    refreshCart();

    const handler = () => refreshCart();
    window.addEventListener("florify-cart-updated", handler);
    return () => window.removeEventListener("florify-cart-updated", handler);
  }, [router]);

  const total = useMemo(() => getCartTotal(), [items]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
            <p className="text-sm text-gray-500">Review your selected floral offers</p>
          </div>
          <Link
            href="/marketplace"
            className="text-sm font-medium text-accent-600 hover:text-accent-700"
          >
            Continue shopping
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center text-gray-400">
            No items in cart yet.
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Vendor
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Unit Price
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Quantity
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Subtotal
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item) => (
                    <tr key={item.productId}>
                      <td className="px-4 py-4 text-sm font-medium text-gray-900">
                        {item.canonicalName}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">{item.vendorName}</td>
                      <td className="px-4 py-4 text-right text-sm text-gray-700">
                        ${item.price.toFixed(2)}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(event) =>
                            updateQuantity(item.productId, Number(event.target.value))
                          }
                          className="w-16 rounded-md border border-gray-300 px-2 py-1 text-center text-sm focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-300/40"
                        />
                      </td>
                      <td className="px-4 py-4 text-right text-sm font-semibold text-gray-900">
                        ${(item.price * item.quantity).toFixed(2)}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="rounded bg-red-50 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-2xl font-bold text-accent-600">${total.toFixed(2)}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    clearCart();
                    setItems([]);
                  }}
                  className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                >
                  Clear Cart
                </button>
                <button
                  onClick={() => router.push("/marketplace/checkout")}
                  className="rounded-lg bg-accent-600 px-6 py-2 text-sm font-semibold text-white hover:bg-accent-700 disabled:opacity-50"
                >
                  Proceed to Checkout
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
