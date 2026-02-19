export function slugify(input: string, underscore = true) {
  const s = input
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, underscore ? "_" : "-")
    .replace(/-+/g, "-")
    .replace(/_+/g, "_");
  return s;
}
