"use client";

interface FilterSidebarProps {
  categories: string[];
  colors: string[];
  selectedCategories: Set<string>;
  selectedColors: Set<string>;
  onToggleCategory: (cat: string) => void;
  onToggleColor: (color: string) => void;
  onClearAll: () => void;
}

export default function FilterSidebar({
  categories,
  colors,
  selectedCategories,
  selectedColors,
  onToggleCategory,
  onToggleColor,
  onClearAll,
}: FilterSidebarProps) {
  const hasFilters = selectedCategories.size > 0 || selectedColors.size > 0;

  return (
    <aside className="w-full shrink-0 md:w-64">
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Filters</h3>
          {hasFilters && (
            <button onClick={onClearAll} className="text-xs font-medium text-accent-600 hover:text-accent-700">
              Clear all
            </button>
          )}
        </div>

        <div className="mb-6">
          <h4 className="mb-3 text-sm font-semibold text-gray-700">Categories</h4>
          <div className="space-y-2">
            {categories.map((cat) => (
              <label key={cat} className="flex cursor-pointer items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
                <input
                  type="checkbox"
                  checked={selectedCategories.has(cat)}
                  onChange={() => onToggleCategory(cat)}
                  className="h-4 w-4 rounded border-gray-300 text-accent-600 focus:ring-accent-500"
                />
                {cat}
              </label>
            ))}
          </div>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-gray-700">Color</h4>
          <div className="space-y-2">
            {colors.map((color) => (
              <label key={color} className="flex cursor-pointer items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
                <input
                  type="checkbox"
                  checked={selectedColors.has(color)}
                  onChange={() => onToggleColor(color)}
                  className="h-4 w-4 rounded border-gray-300 text-accent-600 focus:ring-accent-500"
                />
                {color}
              </label>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
