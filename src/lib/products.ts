// lib/products.ts

import { API_BASE } from "@/lib/api";

export type VariantInput = { size: string; price: number };

/**
 * Helper: Get CSRF cookie before any state-changing request
 * Call this once on app startup (e.g., in layout or provider)
 */
export const ensureCsrfCookie = async () => {
  await fetch(`${API_BASE}/sanctum/csrf-cookie`, {
    method: "GET",
    credentials: "include", // Very important for Sanctum session auth
  });
};

/**
 * Create a new product with optional image upload
 */
export async function createProductWithImage(payload: {
  category_id: number;
  product_type_id: number;
  name: string;
  slug?: string;
  variants: VariantInput[];
  imageFile?: File | null;
}) {
  const form = new FormData();

  form.append("category_id", String(payload.category_id));
  form.append("product_type_id", String(payload.product_type_id));
  form.append("name", payload.name);
  if (payload.slug) form.append("slug", payload.slug);

  // Send variants using bracket notation (matches Laravel expectations)
  payload.variants.forEach((variant, index) => {
    form.append(`variants[${index}][size]`, variant.size.trim());
    form.append(`variants[${index}][price]`, String(variant.price));
  });

  if (payload.imageFile) {
    form.append("image", payload.imageFile);
  }

  const res = await fetch(`${API_BASE}/products`, {
    method: "POST",
    body: form,
    credentials: "include", // Required for Sanctum session cookies & CSRF
    // DO NOT set Content-Type — browser sets multipart boundary automatically
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || "Failed to create product");
  }

  return res.json();
}

/**
 * Update an existing product with optional image upload/replacement/removal
 */
export async function updateProductWithImage(
  productId: number,
  payload: {
    category_id?: number;
    product_type_id?: number;
    name?: string;
    slug?: string;
    variants?: VariantInput[];
    imageFile?: File | null;     // File = replace, null/undefined = keep (we won't send)
    removeImage?: boolean;       // true = remove image
  }
) {
  const form = new FormData();

  if (payload.category_id !== undefined) {
    form.append("category_id", String(payload.category_id));
  }

  if (payload.product_type_id !== undefined) {
    form.append("product_type_id", String(payload.product_type_id));
  }

  if (payload.name !== undefined) {
    form.append("name", payload.name);
  }

  if (payload.slug !== undefined) {
    form.append("slug", payload.slug);
  }

  // Only send variants if provided (replace all)
  if (payload.variants !== undefined) {
    payload.variants.forEach((variant, index) => {
      form.append(`variants[${index}][size]`, variant.size.trim());
      form.append(`variants[${index}][price]`, String(variant.price));
    });
  }

  // ✅ Only send image if user selected a NEW file
  if (payload.imageFile instanceof File) {
    form.append("image", payload.imageFile);
  }

  // ✅ Optional remove image
  if (payload.removeImage) {
    form.append("remove_image", "1");
  }

  // ✅ Use POST + method spoofing (best for multipart)
  form.append("_method", "PUT");

  const res = await fetch(`${API_BASE}/products/${productId}`, {
    method: "POST",
    body: form,
    credentials: "include",
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || "Failed to update product");
  }

  return res.json();
}