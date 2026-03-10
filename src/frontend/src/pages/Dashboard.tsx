import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  Package,
  ShoppingCart,
  Tag,
  TrendingUp,
} from "lucide-react";
import { useMemo } from "react";
import {
  useAllOrders,
  useAllProducts,
  useCategories,
} from "../hooks/useQueries";

function StatCard({
  title,
  value,
  icon: Icon,
  accent,
  loading,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  accent?: boolean;
  loading?: boolean;
}) {
  return (
    <div className="stat-card rounded-lg p-5 flex items-start gap-4 animate-fade-up">
      <div
        className={`rounded-md p-2.5 ${
          accent
            ? "bg-amber-500/20 text-amber-400"
            : "bg-muted/60 text-muted-foreground"
        }`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider">
          {title}
        </p>
        {loading ? (
          <Skeleton
            className="h-7 w-16 mt-1"
            data-ocid="dashboard.stats.loading_state"
          />
        ) : (
          <p className="font-display font-bold text-2xl mt-0.5 font-mono-nums">
            {value}
          </p>
        )}
      </div>
    </div>
  );
}

export function Dashboard() {
  const { data: products = [], isLoading: pLoading } = useAllProducts();
  const { data: orders = [], isLoading: oLoading } = useAllOrders();
  const { data: categories = [], isLoading: cLoading } = useCategories();

  const lowStock = useMemo(
    () => products.filter((p) => Number(p.stock) < 10),
    [products],
  );

  const recentOrders = useMemo(
    () =>
      [...orders].sort((a, b) => Number(b.timestamp - a.timestamp)).slice(0, 8),
    [orders],
  );

  const productMap = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((p, i) => map.set(String(i + 1), p.name));
    return map;
  }, [products]);

  const isLoading = pLoading || oLoading || cLoading;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Overview of your store operations
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Products"
          value={products.length}
          icon={Package}
          accent
          loading={isLoading}
        />
        <StatCard
          title="Categories"
          value={categories.length}
          icon={Tag}
          loading={isLoading}
        />
        <StatCard
          title="Low Stock"
          value={lowStock.length}
          icon={AlertTriangle}
          accent={lowStock.length > 0}
          loading={isLoading}
        />
        <StatCard
          title="Total Orders"
          value={orders.length}
          icon={ShoppingCart}
          loading={isLoading}
        />
      </div>

      {/* Low Stock Alerts */}
      {!isLoading && lowStock.length > 0 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h2 className="font-semibold text-sm text-amber-400">
              Low Stock Alerts
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStock.map((p, i) => (
              <div
                key={p.sku}
                className="flex items-center gap-2 rounded bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 text-sm"
                data-ocid={`dashboard.low_stock.item.${i + 1}`}
              >
                <span className="font-medium">{p.name}</span>
                <Badge
                  variant="outline"
                  className="text-amber-400 border-amber-500/40 text-xs"
                >
                  {String(p.stock)} left
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-display font-semibold">Recent Orders</h2>
        </div>

        {isLoading ? (
          <div className="space-y-2" data-ocid="dashboard.orders.loading_state">
            {[1, 2, 3].map((n) => (
              <Skeleton key={n} className="h-12 w-full rounded-md" />
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <div
            className="rounded-lg border border-dashed border-border py-12 text-center"
            data-ocid="dashboard.orders.empty_state"
          >
            <ShoppingCart className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">No orders yet</p>
          </div>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">
                    Product
                  </th>
                  <th className="text-right px-4 py-2.5 text-muted-foreground font-medium">
                    Qty
                  </th>
                  <th className="text-right px-4 py-2.5 text-muted-foreground font-medium">
                    Total
                  </th>
                  <th className="text-right px-4 py-2.5 text-muted-foreground font-medium">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o, i) => (
                  <tr
                    key={String(o.timestamp)}
                    className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors"
                    data-ocid={`dashboard.orders.item.${i + 1}`}
                  >
                    <td className="px-4 py-2.5">
                      {productMap.get(String(o.productId)) ??
                        `Product #${String(o.productId)}`}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono-nums">
                      {String(o.quantity)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono-nums text-amber-400">
                      ${String(o.totalPrice)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-muted-foreground">
                      {new Date(
                        Number(o.timestamp / 1_000_000n),
                      ).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
