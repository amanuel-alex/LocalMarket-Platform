"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
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

export function ProductsClient() {
  const user = getStoredUser();
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    if (!user || user.role !== "seller") return;
    setLoading(true);
    try {
      const res = await fetchProducts({ sellerId: user.id, limit: 100, page: 1 });
      setRows(res.products);
    } catch (e) {
      toast.error(toastApiError(e));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      title: "",
      description: "",
      price: "1",
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
      category: p.category,
      lat: String(p.location.lat),
      lng: String(p.location.lng),
      imageUrl: p.imageUrl ?? "",
    });
    setOpen(true);
  }

  async function onSubmit(values: ProductFormValues) {
    if (!user || user.role !== "seller") return;
    const price = Number(values.price);
    const lat = Number(values.lat);
    const lng = Number(values.lng);
    try {
      const imageUrl = values.imageUrl?.trim() || undefined;
      if (editing) {
        await updateProduct(editing.id, {
          title: values.title,
          description: values.description,
          price,
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

  async function onDelete(id: string) {
    if (!confirm("Delete this product?")) return;
    try {
      await deleteProduct(id);
      toast.success("Product deleted");
      await load();
    } catch (e) {
      toast.error(toastApiError(e));
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

  if (!user || user.role !== "seller") {
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
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground">Manage your catalog</p>
        </div>
        <Button onClick={openCreate} className="rounded-xl shadow-sm transition hover:shadow-md">
          <Plus className="mr-2 size-4" />
          Add product
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm"
      >
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="w-[120px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={4}>
                      <Skeleton className="h-10 w-full rounded-lg" />
                    </TableCell>
                  </TableRow>
                ))
              : rows.map((p) => (
                  <TableRow key={p.id} className="transition-colors hover:bg-muted/40">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="size-10 overflow-hidden rounded-lg bg-muted">
                          {p.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.imageUrl} alt="" className="size-full object-cover" />
                          ) : null}
                        </div>
                        <span className="font-medium">{p.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>{p.category}</TableCell>
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
                        onClick={() => void onDelete(p.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
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
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input type="text" inputMode="decimal" className="rounded-xl" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
              </div>
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
    </div>
  );
}
