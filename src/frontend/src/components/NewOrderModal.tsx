import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAllProducts, useCreateOrder } from "../hooks/useQueries";

export function NewOrderModal() {
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");

  const { mutateAsync, isPending } = useCreateOrder();
  const { data: products = [] } = useAllProducts();

  const selectedProduct = products.find((_, i) => String(i + 1) === productId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !quantity) {
      toast.error("Please fill all fields");
      return;
    }
    const qty = Number.parseInt(quantity);
    if (qty <= 0) {
      toast.error("Quantity must be positive");
      return;
    }
    try {
      await mutateAsync({
        productId: BigInt(productId),
        quantity: BigInt(qty),
      });
      toast.success("Order created successfully");
      setOpen(false);
      setProductId("");
      setQuantity("");
    } catch {
      toast.error("Failed to create order");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
          data-ocid="order.open_modal_button"
        >
          <ShoppingCart className="w-4 h-4" />
          New Order
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" data-ocid="order.dialog">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">
            Create New Order
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="o-product">Select Product</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger data-ocid="order.product.select">
                <SelectValue placeholder="Choose a product…" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p, i) => (
                  <SelectItem key={p.sku} value={String(i + 1)}>
                    {p.name}{" "}
                    <span className="text-muted-foreground font-mono text-xs ml-1">
                      ({p.sku})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedProduct && (
            <div className="rounded bg-accent/40 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Stock available: </span>
              <span className="font-mono-nums font-semibold">
                {String(selectedProduct.stock)}
              </span>
              <span className="ml-3 text-muted-foreground">Unit price: </span>
              <span className="font-mono-nums font-semibold">
                ${String(selectedProduct.price)}
              </span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="o-qty">Quantity</Label>
            <Input
              id="o-qty"
              type="number"
              min="1"
              placeholder="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              data-ocid="order.quantity.input"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              data-ocid="order.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              data-ocid="order.submit_button"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {isPending ? "Creating…" : "Create Order"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
