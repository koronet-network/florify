"use client";

import Link from "next/link";

interface ProductCardProps {
  canonicalName: string;
  lowestPrice: number;
  vendorCount: number;
  category: string;
  color: string;
  stemPerBunch: number;
  unitPerBox: number;
  boxType: string;
}

const FLOWER_EMOJIS: Record<string, string> = {
  Roses: "🌹",
  Hydrangea: "💐",
  Sunflower: "🌻",
  Alstroemeria: "🌸",
  Gerbera: "🌼",
  Agapanthus: "💜",
  Tulips: "🌷",
  Peonies: "🌺",
  Ranunculus: "🪷",
  Greenery: "🌿",
  Marigold: "🌼",
  "Pom Button": "🌺",
  Amaranthus: "🌿",
  Orchids: "🪻",
};

export default function ProductCard({
  canonicalName,
  lowestPrice,
  vendorCount,
  category,
  color,
  stemPerBunch,
  unitPerBox,
  boxType,
}: ProductCardProps) {
  const emoji = FLOWER_EMOJIS[category] || "🌸";

  return (
    <Link
      href={`/marketplace/${encodeURIComponent(canonicalName)}`}
      className="group block overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:border-accent-400 hover:shadow-lg"
    >
      <div className="flex h-40 items-center justify-center bg-gradient-to-br from-primary-800 to-primary-900">
        <span className="text-6xl transition-transform group-hover:scale-110">{emoji}</span>
      </div>
      <div className="p-4">
        <h3 className="mb-1 text-sm font-bold text-gray-900 line-clamp-2">{canonicalName}</h3>
        <div className="mb-3 flex flex-wrap gap-1">
          <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{category}</span>
          <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{color}</span>
        </div>
        <div className="mb-3 grid grid-cols-3 gap-1 text-xs text-gray-500">
          <div>
            <span className="font-medium text-gray-700">Stem/Bun:</span>
            <br />{stemPerBunch}
          </div>
          <div>
            <span className="font-medium text-gray-700">Unit/Box:</span>
            <br />{unitPerBox}
          </div>
          <div>
            <span className="font-medium text-gray-700">Box:</span>
            <br />{boxType}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-accent-600">${lowestPrice.toFixed(2)}</span>
          <span className="rounded-full bg-accent-600/10 px-2.5 py-0.5 text-xs font-semibold text-accent-600">
            {vendorCount} vendor{vendorCount !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </Link>
  );
}
