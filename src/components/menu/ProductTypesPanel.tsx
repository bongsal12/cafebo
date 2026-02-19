"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { ProductType } from "@/types/entities";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import { slugify } from "@/lib/slug";

export function ProductTypesPanel() {
  const [items, setItems] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProductType | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  async function load() {
    setLoading(true);
    try {
      const data = await api.get<ProductType[]>("/product-types");
      setItems(data);
    } catch (e: any) {
      setToast({ type: "error", message: e.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(null);
    setName("");
    setSlug("");
    setOpen(true);
  }

  function openEdit(t: ProductType) {
    setEditing(t);
    setName(t.name);
    setSlug(t.slug);
    setOpen(true);
  }

  async function save() {
    try {
      const payload = { name, slug: slug || slugify(name) };
      if (!payload.name.trim()) {
        setToast({ type: "error", message: "Name is required." });
        return;
      }

      if (editing) {
        await api.put(`/product-types/${editing.id}`, payload);
        setToast({ type: "success", message: "Product type updated." });
      } else {
        await api.post(`/product-types`, payload);
        setToast({ type: "success", message: "Product type created." });
      }

      setOpen(false);
      await load();
    } catch (e: any) {
      setToast({ type: "error", message: e.message });
    }
  }

  async function remove(t: ProductType) {
    if (!confirm(`Delete "${t.name}"? This may affect products.`)) return;

    try {
      await api.del(`/product-types/${t.id}`);
      setToast({ type: "success", message: "Product type deleted." });
      await load();
    } catch (e: any) {
      setToast({ type: "error", message: e.message });
    }
  }

  return (
    <div className="rounded-2xl bg-[#99613f] p-6 shadow-sm">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Product Types</h2>
          <p className="text-sm text-gray-900">Example: hot, iced</p>
        </div>
        <Button onClick={openCreate}>+ Add Type</Button>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-gray-100">
        <table className="w-full text-sm">
          <thead className="bg-[#4f2206] text-lg text-gray-300">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Name</th>
              <th className="px-4 py-3 text-left font-semibold">Slug</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-4 py-4 text-gray-500" colSpan={3}>Loading...</td></tr>
            ) : items.length === 0 ? (
              <tr><td className="px-4 py-4 text-gray-500" colSpan={3}>No product types yet.</td></tr>
            ) : (
              items.map((t) => (
                <tr key={t.id} className="border-t border-gray-100 text-lg text-black">
                  <td className="px-4 py-3 font-medium">{t.name}</td>
                  <td className="px-4 py-3 ">{t.slug}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <Button variant="secondary" onClick={() => openEdit(t)}>Edit</Button>
                      <Button variant="danger" onClick={() => remove(t)}>Delete</Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal open={open} title={editing ? "Edit Product Type" : "Add Product Type"} onClose={() => setOpen(false)}>
        <div className="space-y-4">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Hot" />
          <Input label="Slug (optional)" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="hot" />

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? "Update" : "Create"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
