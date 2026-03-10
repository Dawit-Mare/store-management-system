import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { AddProductModal } from "../components/AddProductModal";
import { useAllProducts, useCategories, useIsAdmin } from "../hooks/useQueries";

export function Products() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const { data: products = [], isLoading } = useAllProducts();
  const { data: categories = [] } = useCategories();
  const { data: isAdmin } = useIsAdmin();

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        categoryFilter === "all" || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, categoryFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Products</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {products.length} total products
          </p>
        </div>
        {isAdmin && <AddProductModal />}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or SKU…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-ocid="products.search_input"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-44" data-ocid="products.category.select">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2" data-ocid="products.loading_state">
          {[1, 2, 3, 4].map((n) => (
            <Skeleton key={n} className="h-12 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="rounded-lg border border-dashed border-border py-16 text-center"
          data-ocid="products.empty_state"
        >
          <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">
            {search || categoryFilter !== "all"
              ? "No products match your filters"
              : "No products yet"}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm" data-ocid="products.table">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                  Product
                </th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                  SKU
                </th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                  Category
                </th>
                <th className="text-right px-4 py-3 text-muted-foreground font-medium">
                  Price
                </th>
                <th className="text-right px-4 py-3 text-muted-foreground font-medium">
                  Stock
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr
                  key={p.sku}
                  className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors"
                  data-ocid={`products.item.${i + 1}`}
                >
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3">
                    <code className="font-mono text-xs bg-muted/50 px-1.5 py-0.5 rounded text-muted-foreground">
                      {p.sku}
                    </code>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-xs">
                      {p.category}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-mono-nums">
                    ${String(p.price)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`font-mono-nums font-medium ${
                        Number(p.stock) < 10 ? "text-amber-400" : ""
                      }`}
                    >
                      {String(p.stock)}
                    </span>
                    {Number(p.stock) < 10 && (
                      <span className="ml-1 text-xs text-amber-400/70">
                        low
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
