"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import { addToCart } from "@/lib/cart";

interface Offer {
  productId: string;
  vendorId: string;
  vendorName: string;
  price: number;
  stemPerBunch: number;
  unitPerBox: number;
  boxType: string;
}

interface ProductDetail {
  canonicalName: string;
  category: string;
  color: string;
  offers: Offer[];
}

export default function ProductDetailPage() {
  const params = useParams();
  const canonicalName = decodeURIComponent(params.canonicalName as string);
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [cartMessage, setCartMessage] = useState("");

  useEffect(() => {
    api
      .getProductDetail(canonicalName)
      .then(setProduct)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [canonicalName]);

  function updateQuantity(productId: string, quantity: number) {
    setQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(1, Math.floor(quantity) || 1),
    }));
  }

  function handleAddToCart(offer: Offer) {
    const quantity = quantities[offer.productId] || 1;
    addToCart({
      productId: offer.productId,
      vendorId: offer.vendorId,
      vendorName: offer.vendorName,
      canonicalName,
      price: offer.price,
      quantity,
    });
    setCartMessage(`${quantity} item(s) added to cart`);
    setTimeout(() => setCartMessage(""), 1800);
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Link href="/marketplace" className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-accent-600 hover:text-accent-700">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Marketplace
        </Link>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-500 border-t-transparent" />
          </div>
        ) : error ? (
          <div className="rounded-xl bg-red-50 p-6 text-center text-red-600">{error}</div>
        ) : product ? (
          <>
            <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
              <div className="flex items-start gap-6">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-800 to-primary-900">
                  <span className="text-5xl">🌸</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{product.canonicalName}</h1>
                  <div className="mt-2 flex gap-2">
                    <span className="rounded-full bg-accent-600/10 px-3 py-1 text-sm font-medium text-accent-600">
                      {product.category}
                    </span>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">
                      {product.color}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-gray-500">
                    {product.offers.length} vendor{product.offers.length !== 1 ? "s" : ""} offering this product
                  </p>
                </div>
              </div>
            </div>

            <h2 className="mb-4 text-lg font-semibold text-gray-800">Vendor Offers</h2>
            {cartMessage && (
              <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
                {cartMessage}
              </div>
            )}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">#</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Vendor</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Price</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Stem/Bun</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Unit/Box</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Box</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Qty</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {product.offers.map((offer, i) => (
                    <tr key={offer.productId} className={i === 0 ? "bg-accent-600/5" : "hover:bg-gray-50"}>
                      <td className="px-6 py-4 text-sm text-gray-400">{i + 1}</td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-gray-900">{offer.vendorName}</span>
                        {i === 0 && (
                          <span className="ml-2 rounded-full bg-accent-600/10 px-2 py-0.5 text-xs font-semibold text-accent-600">
                            Best Price
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                        ${offer.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-600">{offer.stemPerBunch}</td>
                      <td className="px-6 py-4 text-right text-sm text-gray-600">{offer.unitPerBox}</td>
                      <td className="px-6 py-4 text-right text-sm text-gray-600">{offer.boxType}</td>
                      <td className="px-6 py-4 text-center">
                        <input
                          type="number"
                          min={1}
                          value={quantities[offer.productId] || 1}
                          onChange={(event) =>
                            updateQuantity(
                              offer.productId,
                              Number(event.target.value)
                            )
                          }
                          className="w-16 rounded-md border border-gray-300 px-2 py-1 text-center text-sm focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-300/40"
                        />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleAddToCart(offer)}
                          className="rounded-md bg-accent-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-700"
                        >
                          Buy
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
