import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart } from "lucide-react";
import { useMemo } from "react";
import { NewOrderModal } from "../components/NewOrderModal";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useAllOrders, useAllProducts } from "../hooks/useQueries";

export function Orders() {
  const { data: orders = [], isLoading } = useAllOrders();
  const { data: products = [] } = useAllProducts();
  const { identity } = useInternetIdentity();

  const productMap = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((p, i) => map.set(String(i + 1), p.name));
    return map;
  }, [products]);

  const sorted = useMemo(
    () => [...orders].sort((a, b) => Number(b.timestamp - a.timestamp)),
    [orders],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Orders</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {orders.length} total orders
          </p>
        </div>
        {identity && <NewOrderModal />}
      </div>

      {isLoading ? (
        <div className="space-y-2" data-ocid="orders.loading_state">
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-12 w-full" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div
          className="rounded-lg border border-dashed border-border py-16 text-center"
          data-ocid="orders.empty_state"
        >
          <ShoppingCart className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">
            No orders have been placed yet
          </p>
          {identity && (
            <div className="mt-4">
              <NewOrderModal />
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm" data-ocid="orders.table">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                  #
                </th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                  Product
                </th>
                <th className="text-right px-4 py-3 text-muted-foreground font-medium">
                  Qty
                </th>
                <th className="text-right px-4 py-3 text-muted-foreground font-medium">
                  Total
                </th>
                <th className="text-right px-4 py-3 text-muted-foreground font-medium">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((o, i) => (
                <tr
                  key={String(o.timestamp)}
                  className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors"
                  data-ocid={`orders.item.${i + 1}`}
                >
                  <td className="px-4 py-3 text-muted-foreground font-mono-nums text-xs">
                    #{String(i + 1).padStart(4, "0")}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {productMap.get(String(o.productId)) ??
                      `Product #${String(o.productId)}`}
                  </td>
                  <td className="px-4 py-3 text-right font-mono-nums">
                    <Badge variant="outline" className="text-xs">
                      {String(o.quantity)} units
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-mono-nums text-amber-400 font-semibold">
                    ${String(o.totalPrice)}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground text-xs">
                    {new Date(
                      Number(o.timestamp / 1_000_000n),
                    ).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
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
