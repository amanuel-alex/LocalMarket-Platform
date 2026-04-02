"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { LayoutGrid, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { getStoredUser } from "@/lib/auth-storage";
import { normalizeRole } from "@/lib/roles";
import {
  createProduct,
  deleteProduct,
  fetchProducts,
  toastApiError,
  updateProduct,
  uploadProductImage,
  type ProductRow,
} from "@/lib/api";

const productFormSchema = z.object({
  title: z.string().min(1, "Required").max(200),
  description: z.string().max(10_000),
  price: z
    .string()
    .min(1, "Required")
    .refine((s) => !Number.isNaN(Number(s)), "Invalid number")
    .refine((s) => Number(s) > 0, "Must be positive"),
  category: z.string().min(1).max(120),
  quantity: z
    .string()
    .min(1, "Required")
    .refine((s) => !Number.isNaN(Number(s)), "Invalid number")
    .refine((s) => Number.isInteger(Number(s)), "Must be a whole number")
    .refine((s) => Number(s) >= 1, "Must be at least 1"),
  lat: z
    .string()
    .min(1, "Required")
    .refine((s) => !Number.isNaN(Number(s)), "Invalid latitude")
    .refine((s) => {
      const n = Number(s);
      return n >= -90 && n <= 90;
    }, "Latitude must be between -90 and 90"),
  lng: z
    .string()
    .min(1, "Required")
    .refine((s) => !Number.isNaN(Number(s)), "Invalid longitude")
    .refine((s) => {
      const n = Number(s);
      return n >= -180 && n <= 180;
    }, "Longitude must be between -180 and 180"),
  imageUrl: z
    .string()
    .max(2048)
    .optional()
    .refine(
      (s) => s === undefined || s === "" || /^https?:\/\//i.test(s.trim()),
      "Enter a valid image URL",
    ),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

type SortKey = "title-asc" | "title-desc" | "price-asc" | "price-desc" | "newest" | "oldest";

function ProductsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-full max-w-md rounded-xl" />
      <Skeleton className="h-72 w-full rounded-2xl" />
    </div>
  );
}

function ProductsClientInner() {
  const user = getStoredUser();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProductRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [searchInput, setSearchInput] = useState(() => searchParams.get("q") ?? "");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("newest");

  const sellerId = user?.id;
  const isSeller = normalizeRole(user?.role) === "seller";

  useEffect(() => {
    const q = searchParams.get("q") ?? "";
    setSearchInput(q);
  }, [searchParams]);

  const load = useCallback(async () => {
    if (!sellerId || !isSeller) return;
    setLoading(true);
    try {
      const res = await fetchProducts({ sellerId, limit: 100, page: 1 });
      setRows(res.products);
    } catch (e) {
      toast.error(toastApiError(e));
    } finally {
      setLoading(false);
    }
  }, [sellerId, isSeller]);

  useEffect(() => {
    void load();
  }, [load]);

  const categories = useMemo(() => {
    const s = new Set(rows.map((r) => r.category).filter(Boolean));
    return [...s].sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const filteredSorted = useMemo(() => {
    let list = [...rows];
    const q = searchInput.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q),
      );
    }
    if (categoryFilter !== "all") {
      list = list.filter((p) => p.category === categoryFilter);
    }
    list.sort((a, b) => {
      switch (sortKey) {
        case "title-asc":
          return a.title.localeCompare(b.title);
        case "title-desc":
          return b.title.localeCompare(a.title);
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        default:
          return 0;
      }
    });
    return list;
  }, [rows, searchInput, categoryFilter, sortKey]);

  function commitSearchToUrl() {
    const params = new URLSearchParams(searchParams.toString());
    const v = searchInput.trim();
    if (v) params.set("q", v);
    else params.delete("q");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      title: "",
      description: "",
      price: "1",
      quantity: "100",
      category: "",
      lat: "9.03",
      lng: "38.75",
      imageUrl: "",
    },
  });

  function openCreate() {
    setEditing(null);
    form.reset({
      title: "",
      description: "",
      price: "1",
      quantity: "100",
      category: "",
      lat: "9.03",
      lng: "38.75",
      imageUrl: "",
    });
    setOpen(true);
  }

  function openEdit(p: ProductRow) {
    setEditing(p);
    form.reset({
      title: p.title,
      description: p.description,
      price: String(p.price),
      quantity: String(p.quantity),
      category: p.category,
      lat: String(p.location.lat),
      lng: String(p.location.lng),
      imageUrl: p.imageUrl ?? "",
    });
    setOpen(true);
  }

  async function onSubmit(values: ProductFormValues) {
    if (!user || normalizeRole(user.role) !== "seller") return;
    const price = Number(values.price);
    const quantity = Number(values.quantity);
    const lat = Number(values.lat);
    const lng = Number(values.lng);
    try {
      const imageUrl = values.imageUrl?.trim() || undefined;
      if (editing) {
        await updateProduct(editing.id, {
          title: values.title,
          description: values.description,
          price,
          quantity,
          category: values.category,
          location: { lat, lng },
          imageUrl: imageUrl ?? null,
        });
        toast.success("Product updated");
      } else {
        await createProduct({
          title: values.title,
          description: values.description,
          price,
          quantity,
          category: values.category,
          location: { lat, lng },
          imageUrl,
        });
        toast.success("Product created");
      }
      setOpen(false);
      await load();
    } catch (e) {
      toast.error(toastApiError(e));
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProduct(deleteTarget.id);
      toast.success("Product deleted");
      setDeleteTarget(null);
      await load();
    } catch (e) {
      toast.error(toastApiError(e));
    } finally {
      setDeleting(false);
    }
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadProductImage(file);
      form.setValue("imageUrl", url);
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(toastApiError(err));
    } finally {
      setUploading(false);
    }
  }

  if (!user || normalizeRole(user.role) !== "seller") {
    return (
      <p className="text-sm text-muted-foreground">
        Product management is available for <strong>seller</strong> accounts. Contact an admin to update your
        role.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-violet-600">EthioLocal</p>
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground">Manage your catalog, pricing, and images</p>
        </div>
        <Button onClick={openCreate} className="rounded-xl shadow-sm transition hover:shadow-md">
          <Plus className="mr-2 size-4" />
          Add product
        </Button>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-end">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onBlur={() => commitSearchToUrl()}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitSearchToUrl();
              }
            }}
            placeholder="Search title, category…"
            className="h-10 rounded-xl border-border/80 pl-9"
            aria-label="Search products"
          />
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-10 w-[160px] rounded-xl">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
            <SelectTrigger className="h-10 w-[180px] rounded-xl">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="title-asc">Title A–Z</SelectItem>
              <SelectItem value="title-desc">Title Z–A</SelectItem>
              <SelectItem value="price-asc">Price low → high</SelectItem>
              <SelectItem value="price-desc">Price high → low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm"
      >
        {!loading && rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-muted shadow-inner">
              <LayoutGrid className="size-7 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">No products yet</p>
            <p className="max-w-sm text-xs text-muted-foreground">
              Add your first listing to appear on EthioLocal. You can upload images and set ETB pricing in the
              form.
            </p>
            <Button type="button" className="rounded-xl" onClick={openCreate}>
              <Plus className="mr-2 size-4" />
              Add product
            </Button>
          </div>
        ) : !loading && filteredSorted.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">
            No products match your filters. Try clearing search or category.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="w-[120px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={5}>
                        <Skeleton className="h-10 w-full rounded-lg" />
                      </TableCell>
                    </TableRow>
                  ))
                : filteredSorted.map((p) => (
                    <TableRow key={p.id} className="transition-colors hover:bg-muted/40">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="size-10 overflow-hidden rounded-lg bg-muted shadow-inner">
                            {p.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={p.imageUrl} alt="" className="size-full object-cover" />
                            ) : null}
                          </div>
                          <span className="font-medium">{p.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>{p.category}</TableCell>
                      <TableCell className="text-right text-muted-foreground text-xs">
                        {p.availableStock} avail · {p.quantity} cap
                        {p.isSoldOut ? " · sold out" : ""}
                      </TableCell>
                      <TableCell className="text-right">ETB {p.price.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="rounded-lg"
                          onClick={() => openEdit(p)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="rounded-lg text-destructive"
                          onClick={() => setDeleteTarget(p)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        )}
      </motion.div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit product" : "New product"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input className="rounded-xl" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea className="rounded-xl" rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (ETB)</FormLabel>
                      <FormControl>
                        <Input type="text" inputMode="decimal" className="rounded-xl" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock quantity</FormLabel>
                      <FormControl>
                        <Input type="text" inputMode="numeric" className="rounded-xl" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input className="rounded-xl" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="lat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Latitude</FormLabel>
                      <FormControl>
                        <Input type="text" inputMode="decimal" className="rounded-xl" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lng"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Longitude</FormLabel>
                      <FormControl>
                        <Input type="text" inputMode="decimal" className="rounded-xl" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image</FormLabel>
                    <FormControl>
                      <Input className="rounded-xl" placeholder="https://…" {...field} />
                    </FormControl>
                    <Input
                      type="file"
                      accept="image/*"
                      className="mt-2 cursor-pointer rounded-xl text-sm"
                      disabled={uploading}
                      onChange={(e) => void onFileChange(e)}
                    />
                    <p className="text-xs text-muted-foreground">Upload sets Cloudinary URL when configured.</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" className="rounded-xl" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="rounded-xl" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Saving…" : "Save"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteTarget !== null} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete product?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This removes <strong>{deleteTarget?.title}</strong> from your catalog. Buyers will no longer see it.
            This cannot be undone from the dashboard.
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="rounded-xl"
              disabled={deleting}
              onClick={() => void confirmDelete()}
            >
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function ProductsClient() {
  return (
    <Suspense fallback={<ProductsSkeleton />}>
      <ProductsClientInner />
    </Suspense>
  );
}
