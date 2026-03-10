import { Skeleton } from "@/components/ui/skeleton";
import { Box, Tag } from "lucide-react";
import { useMemo } from "react";
import { useAllProducts, useCategories } from "../hooks/useQueries";

export function Categories() {
  const { data: categories = [], isLoading } = useCategories();
  const { data: products = [] } = useAllProducts();

  const categoryStats = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of products) {
      map.set(p.category, (map.get(p.category) ?? 0) + 1);
    }
    return map;
  }, [products]);

  const colorPalette = [
    "border-amber-500/30 bg-amber-500/5 text-amber-300",
    "border-blue-500/30 bg-blue-500/5 text-blue-300",
    "border-green-500/30 bg-green-500/5 text-green-300",
    "border-purple-500/30 bg-purple-500/5 text-purple-300",
    "border-rose-500/30 bg-rose-500/5 text-rose-300",
    "border-cyan-500/30 bg-cyan-500/5 text-cyan-300",
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Categories</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {categories.length} product categories
        </p>
      </div>

      {isLoading ? (
        <div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          data-ocid="categories.loading_state"
        >
          {[1, 2, 3, 4].map((n) => (
            <Skeleton key={n} className="h-28 rounded-lg" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div
          className="rounded-lg border border-dashed border-border py-16 text-center"
          data-ocid="categories.empty_state"
        >
          <Tag className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No categories yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Categories are created when you add products
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((cat, i) => {
            const colorClass = colorPalette[i % colorPalette.length];
            const count = categoryStats.get(cat) ?? 0;
            return (
              <div
                key={cat}
                className={`rounded-lg border p-5 flex flex-col gap-3 ${colorClass} transition-all hover:scale-[1.02]`}
                data-ocid={`categories.item.${i + 1}`}
              >
                <Tag className="w-5 h-5" />
                <div>
                  <div className="font-display font-semibold text-base">
                    {cat}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Box className="w-3 h-3 opacity-60" />
                    <span className="text-xs opacity-70">
                      {count} {count === 1 ? "product" : "products"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
