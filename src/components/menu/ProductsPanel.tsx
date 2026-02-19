"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { Category, Product, ProductType, ProductVariant } from "@/types/entities";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Toast } from "@/components/ui/Toast";
import { slugify } from "@/lib/slug";
import { createProductWithImage, updateProductWithImage } from "@/lib/products";


type ProductPayload = {
  category_id: number;
  product_type_id: number;
  name: string;
  slug?: string;
  variants: { size: string; price: number }[];
};

export function ProductsPanel() {
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [types, setTypes] = useState<ProductType[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const [categoryId, setCategoryId] = useState<number>(0);
  const [typeId, setTypeId] = useState<number>(0);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [variants, setVariants] = useState<ProductVariant[]>([{ size: "regular", price: 0 }]);

  const [search, setSearch] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  async function loadAll() {
    setLoading(true);
    try {
      const [c, t, p] = await Promise.all([
        api.get<Category[]>("/categories"),
        api.get<ProductType[]>("/product-types"),
        api.get<any>("/products"), // paginated
      ]);

      setCategories(c);
      setTypes(t);
      setProducts(p.data ?? p); // if paginated => {data:[]}

      // default selection
      if (c.length && !categoryId) setCategoryId(c[0].id);
      if (t.length && !typeId) setTypeId(t[0].id);
    } catch (e: any) {
      setToast({ type: "error", message: e.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q)
    );
  }, [products, search]);

  function openCreate() {
    setEditing(null);
    setName("");
    setSlug("");
    setVariants([{ size: "regular", price: 0 }]);
    setImageFile(null); 

    // ensure selects have values
    if (categories.length) setCategoryId(categories[0].id);
    if (types.length) setTypeId(types[0].id);

    setOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setName(p.name);
    setSlug(p.slug);
    setCategoryId(p.category_id);
    setTypeId(p.product_type_id);
    setVariants(p.variants?.length ? p.variants.map(v => ({ size: v.size, price: Number(v.price) })) : [{ size: "regular", price: 0 }]);
    setImageFile(null);
    setOpen(true);
  }

  function addVariant() {
    setVariants((prev) => [...prev, { size: "", price: 0 }]);
  }

  function updateVariant(i: number, patch: Partial<ProductVariant>) {
    setVariants((prev) => prev.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));
  }

  function removeVariant(i: number) {
    setVariants((prev) => prev.filter((_, idx) => idx !== i));
  }

  function validatePayload(payload: ProductPayload) {
    if (!payload.name.trim()) return "Name is required.";
    if (!payload.category_id) return "Category is required.";
    if (!payload.product_type_id) return "Product type is required.";
    if (!payload.variants.length) return "At least 1 variant is required.";

    const sizes = payload.variants.map((v) => v.size.trim());
    if (sizes.some((s) => !s)) return "Variant size is required.";

    const uniq = new Set(sizes);
    if (uniq.size !== sizes.length) return "Variant sizes must be unique for the same product.";

    if (payload.variants.some((v) => isNaN(v.price) || v.price < 0)) return "Variant price must be valid number (>= 0).";
    return null;
  }

  async function save() {
    try {
      const payload: ProductPayload = {
        category_id: Number(categoryId),
        product_type_id: Number(typeId),
        name,
        slug: slug || slugify(name, true),
        variants: variants.map((v) => ({ size: String(v.size).trim(), price: Number(v.price) })),
      };

      const err = validatePayload(payload);
      if (err) {
        setToast({ type: "error", message: err });
        return;
      }

if (editing) {
  await updateProductWithImage(editing.id, {
    category_id: Number(categoryId),
    product_type_id: Number(typeId),
    name,
    slug: slug || slugify(name, true),
    variants: variants.map(v => ({ size: String(v.size).trim(), price: Number(v.price) })),
    imageFile: imageFile ?? undefined,
  });
} else {
  await createProductWithImage({
    category_id: Number(categoryId),
    product_type_id: Number(typeId),
    name,
    slug: slug || slugify(name, true),
    variants: variants.map(v => ({ size: String(v.size).trim(), price: Number(v.price) })),
    imageFile,
  });
}


      setOpen(false);
      setImageFile(null);
      await loadAll();
    } catch (e: any) {
      setToast({ type: "error", message: e.message });
    }
  }

  async function remove(p: Product) {
    if (!confirm(`Delete product "${p.name}"?`)) return;
    try {
      await api.del(`/products/${p.id}`);
      setToast({ type: "success", message: "Product deleted." });
      await loadAll();
    } catch (e: any) {
      setToast({ type: "error", message: e.message });
    }
  }

  const categoryOptions = categories.map((c) => ({ label: `${c.name} (${c.slug})`, value: c.id }));
  const typeOptions = types.map((t) => ({ label: `${t.name} (${t.slug})`, value: t.id }));
const sizeOptions = [
  { label: "Regular", value: "regular" },
  { label: "Medium", value: "medium" },
  { label: "Large", value: "large" },
];

  return (
    <div className="space-y-6">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <div className="rounded-2xl bg-[#99613f] p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-bold">Products</h2>
            <p className="text-sm text-black">Create products here!</p>
          </div>

          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <div className="w-full md:w-72 text-black">
              <Input
                
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search product by name..."
              />
            </div>
            <Button onClick={openCreate}>+ Add Product</Button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-[#99613f] p-6 shadow-sm">
        {loading ? (
          <div className="text-sm text-gray-800">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center">
            <div className="text-lg font-bold">No products yet</div>
            <div className="mt-1 text-sm text-gray-600">Create your first product with variants.</div>
            <div className="mt-4">
              <Button onClick={openCreate}>+ Add Product</Button>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-100">
            <table className="w-full text-sm">
              <thead className="bg-[#4f2206] text-gray-100 text-xl">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Product</th>
                  {/* <th className="px-4 py-3 text-left font-semibold">Slug</th> */}
                  <th className="px-4 py-3 text-left font-semibold">Variants</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-t border-gray-100">
                    <td className="px-4 py-3">
                      <div className="text-2xl text-black font-bold">Name: {p.name}</div>
                    
                      <img src={`${process.env.NEXT_PUBLIC_IMAGEPATH}/${p.image}`} className="w-32 rounded-xl"/>
                    </td>
                    {/* <td className="px-4 py-3 text-gray-600">{p.slug}</td> */}
                    <td className="px-4 py-3 text-black ">
                      <div className="flex flex-wrap gap-2 w-full">
                        {(p.variants ?? []).map((v, idx) => (
                          <span key={idx} className="rounded-xl bg-gray-100  items-center px-3 py-5 text-xl ">
                            <h1> Size: {v.size}</h1> 
                            <h1>Price: ${Number(v.price).toFixed(2)}</h1>
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-2">
                        <Button variant="secondary" onClick={() => openEdit(p)}>Edit</Button>
                        <Button variant="danger" onClick={() => remove(p)}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal  open={open} title={editing ? "Edit Product" : "Add Product"}  onClose={() => setOpen(false)} >
        <div className="space-y-4 ">
          {categories.length === 0 || types.length === 0 ? (
            <div className="rounded-xl border  p-3 text-sm text-yellow-900">
              Please create at least 1 Category and 1 Product Type before adding products.
            </div>
          ) : null}

          <div className="grid gap-3 md:grid-cols-2 text-lg">
            <Select
              label="Category"
              value={categoryId || (categories[0]?.id ?? 0)}
              onChange={(v) => setCategoryId(Number(v))}
              options={categoryOptions.length ? categoryOptions : [{ label: "No categories", value: 0 }]}
            />
            <Select
              label="Product Type"
              value={typeId || (types[0]?.id ?? 0)}
              onChange={(v) => setTypeId(Number(v))}
              options={typeOptions.length ? typeOptions : [{ label: "No product types", value: 0 }]}
            />
          </div>

          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Iced Latte"  className="w-full rounded-xl border border-gray-200 bg-gray-200 px-3 py-2 text-sm"/>
          <Input label="Slug (optional)" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="iced_latte" />
          <label className="block">
          <div className="mb-1 text-sm font-medium text-gray-900">Product Image</div>
          <input
          type="file"
          accept="image/*"
          className="w-full rounded-xl border border-gray-200 bg-gray-200 px-3 py-2 text-sm"
          onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
          />
         </label>

          <div className="rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold">Variants</div>
                <div className="text-sm text-gray-600">Add sizes and prices (unique sizes per product)</div>
              </div>
              <Button variant="secondary" onClick={addVariant}>+ Add Variant</Button>
            </div>

            <div className="mt-4 space-y-3">
              {variants.map((v, i) => (
                <div key={i} className="grid gap-3 rounded-xl bg-gray-50 p-3 md:grid-cols-5 md:items-end">
                  <div className="md:col-span-2">
                   <div className="md:col-span-2">
                   <Select
                     label="Size"
                      value={v.size || "regular"}
                      onChange={(val) => updateVariant(i, { size: String(val) })}
                      options={sizeOptions}
                     />
                  </div>
                  </div>
                  <div className="md:col-span-2">
                    <Input
                      label="Price"
                      type="number"
                      step="0.01"
                      value={String(v.price)}
                      onChange={(e) => updateVariant(i, { price: Number(e.target.value) })}
                      placeholder="2.82"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <Button
                      variant="danger"
                      className="w-full"
                      onClick={() => removeVariant(i)}
                      disabled={variants.length === 1}
                      title={variants.length === 1 ? "At least 1 variant required" : "Remove"}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? "Update" : "Create"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
