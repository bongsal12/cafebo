export type Category = {
  id: number;
  name: string;
  slug: string;
};

export type ProductType = {
  id: number;
  name: string;
  slug: string; // hot / iced
};

export type ProductVariant = {
  id?: number;
  size: string;   // regular / medium / large
  price: number;  // 2.82
};

export type Product = {
  id: number;
  category_id: number;
  product_type_id: number;
  name: string;
  slug: string;
  image:string;
  variants: ProductVariant[];
};
