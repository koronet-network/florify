"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { api, getUser } from "@/lib/api";
import { CartItem, clearCart, getCart } from "@/lib/cart";

interface FormErrors {
  cardholderName?: string;
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
}

function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiryDate(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
}

function isValidExpiry(value: string) {
  const match = value.match(/^(\d{2})\/(\d{2})$/);
  if (!match) return false;

  const month = Number(match[1]);
  const year = Number(match[2]);
  if (!Number.isInteger(month) || month < 1 || month > 12) return false;

  const now = new Date();
  const currentYear = now.getFullYear() % 100;
  const currentMonth = now.getMonth() + 1;

  return year > currentYear || (year === currentYear && month >= currentMonth);
}

export default function CheckoutPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const [cardholderName, setCardholderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");

  useEffect(() => {
    const user = getUser();
    if (!user || user.role !== "buyer") {
      router.replace("/");
      return;
    }

    if (orderId) {
      setIsReady(true);
      return;
    }

    const cartItems = getCart();
    if (cartItems.length === 0) {
      router.replace("/marketplace/cart");
      return;
    }

    setItems(cartItems);
    setIsReady(true);
  }, [router, orderId]);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  function validateForm() {
    const nextErrors: FormErrors = {};
    const cardDigits = cardNumber.replace(/\s/g, "");
    const cvvDigits = cvv.replace(/\D/g, "");

    if (!cardholderName.trim()) {
      nextErrors.cardholderName = "Cardholder name is required.";
    }
    if (cardDigits.length !== 16) {
      nextErrors.cardNumber = "Card number must contain 16 digits.";
    }
    if (!isValidExpiry(expiryDate)) {
      nextErrors.expiryDate = "Enter a valid future expiry date (MM/YY).";
    }
    if (cvvDigits.length !== 3) {
      nextErrors.cvv = "CVV must contain 3 digits.";
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handlePlaceOrder() {
    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    setError("");
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      const order = await api.createOrder(items);
      clearCart();
      setItems([]);
      setOrderId(order.orderId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isReady) {
    return (
      <div className="min-h-screen">
        <Navbar />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-8">
        {orderId ? (
          <div className="mx-auto max-w-xl rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
            <h1 className="text-2xl font-bold text-green-800">Order confirmed</h1>
            <p className="mt-3 text-sm text-green-700">
              Your order <span className="font-semibold">{orderId}</span> has been placed.
            </p>
            <Link
              href="/marketplace"
              className="mt-6 inline-flex rounded-lg bg-accent-600 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-700"
            >
              Back to Marketplace
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h1 className="text-xl font-bold text-gray-900">Checkout</h1>
              <p className="mt-1 text-sm text-gray-500">
                Payment is mocked locally and card data is not sent to the server.
              </p>

              {error && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="mt-5 space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    value={cardholderName}
                    onChange={(event) => setCardholderName(event.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-300/40"
                    placeholder="Jane Buyer"
                  />
                  {formErrors.cardholderName && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.cardholderName}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Card Number
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="cc-number"
                    value={cardNumber}
                    onChange={(event) => setCardNumber(formatCardNumber(event.target.value))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm tracking-wider focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-300/40"
                    placeholder="4242 4242 4242 4242"
                    maxLength={19}
                  />
                  {formErrors.cardNumber && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.cardNumber}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="cc-exp"
                      value={expiryDate}
                      onChange={(event) => setExpiryDate(formatExpiryDate(event.target.value))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-300/40"
                      placeholder="MM/YY"
                      maxLength={5}
                    />
                    {formErrors.expiryDate && (
                      <p className="mt-1 text-xs text-red-600">{formErrors.expiryDate}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">CVV</label>
                    <input
                      type="password"
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      value={cvv}
                      onChange={(event) => setCvv(event.target.value.replace(/\D/g, "").slice(0, 3))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-300/40"
                      placeholder="123"
                      maxLength={3}
                    />
                    {formErrors.cvv && (
                      <p className="mt-1 text-xs text-red-600">{formErrors.cvv}</p>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={isSubmitting}
                className="mt-6 w-full rounded-lg bg-accent-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-700 disabled:opacity-50"
              >
                {isSubmitting ? "Placing order..." : "Place Order"}
              </button>
            </section>

            <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">Order Summary</h2>
              <div className="mt-4 space-y-3">
                {items.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-start justify-between gap-2 border-b border-gray-100 pb-3 text-sm"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{item.canonicalName}</p>
                      <p className="text-xs text-gray-500">
                        {item.vendorName} - Qty {item.quantity}
                      </p>
                    </div>
                    <p className="font-semibold text-gray-800">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
                <span className="text-sm text-gray-600">Total</span>
                <span className="text-xl font-bold text-accent-600">${total.toFixed(2)}</span>
              </div>
              <Link
                href="/marketplace/cart"
                className="mt-4 inline-flex text-sm font-medium text-accent-600 hover:text-accent-700"
              >
                Back to cart
              </Link>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
