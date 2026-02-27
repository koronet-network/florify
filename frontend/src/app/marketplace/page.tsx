"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { api, getUser } from "@/lib/api";
import Navbar from "@/components/Navbar";
import FilterSidebar from "@/components/FilterSidebar";
import ProductCard from "@/components/ProductCard";

interface Product {
  canonicalName: string;
  lowestPrice: number;
  vendorCount: number;
  category: string;
  color: string;
  stemPerBunch: number;
  unitPerBox: number;
  boxType: string;
}

interface TrendingProduct extends Product {
  totalSold: number;
}

export default function MarketplacePage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [trending, setTrending] = useState<TrendingProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedColors, setSelectedColors] = useState<Set<string>>(new Set());

  useEffect(() => {
    const user = getUser();
    if (!user || user.role !== "buyer") {
      router.replace("/");
      return;
    }

    async function loadMarketplace() {
      try {
        const [allProducts, trendingProducts] = await Promise.all([
          api.getProducts(),
          api.getTrending().catch(() => []),
        ]);
        setProducts(allProducts);
        setTrending(trendingProducts);
      } finally {
        setLoading(false);
      }
    }

    loadMarketplace();
  }, [router]);

  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category))].sort(),
    [products]
  );
  const colors = useMemo(
    () => [...new Set(products.map((p) => p.color))].sort(),
    [products]
  );

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (search && !p.canonicalName.toLowerCase().includes(search.toLowerCase())) return false;
      if (selectedCategories.size > 0 && !selectedCategories.has(p.category)) return false;
      if (selectedColors.size > 0 && !selectedColors.has(p.color)) return false;
      return true;
    });
  }, [products, search, selectedCategories, selectedColors]);

  function toggleCategory(cat: string) {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  }

  function toggleColor(color: string) {
    setSelectedColors((prev) => {
      const next = new Set(prev);
      next.has(color) ? next.delete(color) : next.add(color);
      return next;
    });
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-6 overflow-hidden">
        <div className="mb-6">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search flowers..."
              className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm shadow-sm transition focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-300/40"
            />
          </div>
        </div>

        <div className="flex flex-col gap-6 md:flex-row max-w-full overflow-hidden">
          <FilterSidebar
            categories={categories}
            colors={colors}
            selectedCategories={selectedCategories}
            selectedColors={selectedColors}
            onToggleCategory={toggleCategory}
            onToggleColor={toggleColor}
            onClearAll={() => {
              setSelectedCategories(new Set());
              setSelectedColors(new Set());
            }}
          />

          <main className="flex-1 min-w-0">
            {!loading && trending.length > 0 && (
              <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <h2 className="mb-3 text-base font-semibold text-gray-900">🔥 Trending Now</h2>
                <div className="overflow-x-auto pb-1">
                  <div className="flex min-w-max gap-4">
                    {trending.map((p) => (
                      <div key={p.canonicalName} className="relative w-[290px]">
                        <span className="absolute right-3 top-3 z-10 rounded-full bg-accent-600 px-2.5 py-1 text-xs font-semibold text-white shadow">
                          {p.totalSold > 0 ? `${p.totalSold} sold` : "Popular"}
                        </span>
                        <ProductCard {...p} />
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            <div className="mb-4 flex items-center justify-between">
              <h1 className="text-lg font-semibold text-gray-800">All Products</h1>
              <span className="text-sm text-gray-500">{filtered.length} Results Found</span>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-500 border-t-transparent" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 py-20 text-center text-gray-400">
                No products found matching your filters.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((p) => (
                  <ProductCard key={p.canonicalName} {...p} />
                ))}
              </div>
            )}
          </main>
        </div>

        <footer className="mt-12 border-t border-gray-200 py-6 text-center text-sm text-gray-400">
          Florify &mdash; The freshest flowers, delivered to you.
        </footer>
      </div>
    </div>
  );
}
