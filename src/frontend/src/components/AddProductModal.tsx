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
import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAddProduct } from "../hooks/useQueries";

export function AddProductModal() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    sku: "",
    category: "",
    price: "",
    stock: "",
  });

  const { mutateAsync, isPending } = useAddProduct();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !form.name ||
      !form.sku ||
      !form.category ||
      !form.price ||
      !form.stock
    ) {
      toast.error("Please fill all fields");
      return;
    }
    try {
      await mutateAsync({
        name: form.name,
        sku: form.sku,
        category: form.category,
        price: BigInt(Math.round(Number.parseFloat(form.price))),
        stock: BigInt(Math.round(Number.parseFloat(form.stock))),
      });
      toast.success("Product added successfully");
      setOpen(false);
      setForm({ name: "", sku: "", category: "", price: "", stock: "" });
    } catch {
      toast.error("Failed to add product");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
          data-ocid="product.open_modal_button"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" data-ocid="product.dialog">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">
            Add New Product
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="p-name">Product Name</Label>
            <Input
              id="p-name"
              placeholder="Premium Wireless Headphones"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              data-ocid="product.name.input"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-sku">SKU</Label>
            <Input
              id="p-sku"
              placeholder="PWH-001"
              value={form.sku}
              onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))}
              className="font-mono"
              data-ocid="product.sku.input"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-cat">Category</Label>
            <Input
              id="p-cat"
              placeholder="Electronics"
              value={form.category}
              onChange={(e) =>
                setForm((p) => ({ ...p, category: e.target.value }))
              }
              data-ocid="product.category.input"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="p-price">Price</Label>
              <Input
                id="p-price"
                type="number"
                min="0"
                step="1"
                placeholder="2999"
                value={form.price}
                onChange={(e) =>
                  setForm((p) => ({ ...p, price: e.target.value }))
                }
                data-ocid="product.price.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-stock">Stock Qty</Label>
              <Input
                id="p-stock"
                type="number"
                min="0"
                step="1"
                placeholder="100"
                value={form.stock}
                onChange={(e) =>
                  setForm((p) => ({ ...p, stock: e.target.value }))
                }
                data-ocid="product.stock.input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              data-ocid="product.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              data-ocid="product.submit_button"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {isPending ? "Adding…" : "Add Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
