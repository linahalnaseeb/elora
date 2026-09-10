import type { Product } from "@workspace/api-zod";

type CatalogProduct = Omit<Product, "stripePriceId"> & {
  stripePriceId: string | null;
  stripeProductId?: string;
};

const catalog: CatalogProduct[] = [
  {
    id: "sol-pendant",
    name: "Sol Pendant",
    category: "Necklaces",
    description: "A soft sculptural pendant that catches the light with every movement.",
    price: 68,
    currency: "usd",
    image:
      "https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=1200&q=86",
    material: "Gold vermeil",
    featured: true,
    badge: "New arrival",
    stripePriceId: null,
  },
  {
    id: "mira-hoops",
    name: "Mira Hoops",
    category: "Earrings",
    description: "Lightweight, polished hoops with a subtle organic curve.",
    price: 54,
    currency: "usd",
    image:
      "https://images.unsplash.com/photo-1635767798638-3e25273a8236?auto=format&fit=crop&w=1200&q=86",
    material: "Sterling silver",
    featured: true,
    badge: "Bestseller",
    stripePriceId: null,
  },
  {
    id: "lune-cuff",
    name: "Lune Cuff",
    category: "Bracelets",
    description: "A clean open cuff designed to sit close and stack beautifully.",
    price: 72,
    currency: "usd",
    image:
      "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&w=1200&q=86",
    material: "Gold plated brass",
    featured: true,
    badge: null,
    stripePriceId: null,
  },
  {
    id: "orla-ring",
    name: "Orla Ring",
    category: "Rings",
    description: "A rounded signet-inspired ring with a quietly confident finish.",
    price: 46,
    currency: "usd",
    image:
      "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1200&q=86",
    material: "Recycled brass",
    featured: false,
    badge: "Everyday",
    stripePriceId: null,
  },
  {
    id: "sola-clip",
    name: "Sola Clip",
    category: "Hair",
    description: "A glossy sculptural clip for an effortless up-do in seconds.",
    price: 32,
    currency: "usd",
    image:
      "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1200&q=86",
    material: "Acetate",
    featured: false,
    badge: "Small joy",
    stripePriceId: null,
  },
  {
    id: "noa-chain",
    name: "Noa Chain",
    category: "Necklaces",
    description: "A fine chain with just enough presence to wear on its own.",
    price: 84,
    currency: "usd",
    image:
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1200&q=86",
    material: "Gold vermeil",
    featured: false,
    badge: null,
    stripePriceId: null,
  },
];

export function getCatalogProducts(): Product[] {
  return catalog.map(({ stripeProductId: _stripeProductId, ...product }) => product);
}

export function getCatalogProduct(id: string): Product | undefined {
  const product = catalog.find((item) => item.id === id);
  if (!product) return undefined;
  const { stripeProductId: _stripeProductId, ...publicProduct } = product;
  return publicProduct;
}

export function getMutableCatalogProduct(id: string): CatalogProduct | undefined {
  return catalog.find((item) => item.id === id);
}

export function getCatalogCategories(): string[] {
  return [...new Set(catalog.map((product) => product.category))];
}
