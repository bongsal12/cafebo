"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Category } from "@/types/entities";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import { slugify } from "@/lib/slug";

export function CategoriesPanel() {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  async function load() {
    setLoading(true);
    try {
      const data = await api.get<Category[]>("/categories");
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

  function openEdit(c: Category) {
    setEditing(c);
    setName(c.name);
    setSlug(c.slug);
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
        await api.put(`/categories/${editing.id}`, payload);
        setToast({ type: "success", message: "Category updated." });
      } else {
        await api.post(`/categories`, payload);
        setToast({ type: "success", message: "Category created." });
      }

      setOpen(false);
      await load();
    } catch (e: any) {
      setToast({ type: "error", message: e.message });
    }
  }

  async function remove(c: Category) {
    if (!confirm(`Delete category "${c.name}"? This may delete products too.`)) return;

    try {
      await api.del(`/categories/${c.id}`);
      setToast({ type: "success", message: "Category deleted." });
      await load();
    } catch (e: any) {
      setToast({ type: "error", message: e.message });
    }
  }

  return (
    <div className="rounded-2xl bg-[#059669] p-6 shadow-sm">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-black">Categories</h2>
          <p className="text-sm text-gray-900">Example: coffee, tea</p>
        </div>
        <Button onClick={openCreate}>+ Add Category</Button>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-gray-100">
        <table className="w-full text-sm">
          <thead className="bg-[#042f2e] text-gray-300 text-lg ">
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
              <tr><td className="px-4 py-4 text-gray-500" colSpan={3}>No categories yet.</td></tr>
            ) : (
              items.map((c) => (
                <tr key={c.id} className="border-t border-gray-100 text-lg text-black">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 ">{c.slug}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <Button variant="secondary" onClick={() => openEdit(c)}>Edit</Button>
                      <Button variant="danger" onClick={() => remove(c)}>Delete</Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={open}
        title={editing ? "Edit Category" : "Add Category"}
        onClose={() => setOpen(false)}
      >
        <div className="space-y-4">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Coffee" />
          <Input
            label="Slug (optional)"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="coffee"
          />

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? "Update" : "Create"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
