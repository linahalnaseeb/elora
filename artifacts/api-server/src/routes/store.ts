import { Router, type IRouter } from "express";
import {
  CreateCheckoutSessionBody,
  CreateCheckoutSessionResponse,
  GetProductParams,
  GetProductResponse,
  GetStoreSummaryResponse,
  ListProductsQueryParams,
  ListProductsResponse,
} from "@workspace/api-zod";
import {
  getCatalogCategories,
  getCatalogProduct,
  getCatalogProducts,
  getMutableCatalogProduct,
} from "../catalog";
import {
  createCheckoutSession,
  findOrCreatePrice,
} from "../stripe-client";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.get("/products", (req, res) => {
  const query = ListProductsQueryParams.parse(req.query);
  const products = getCatalogProducts().filter((product) => {
    const categoryMatch = query.category
      ? product.category.toLowerCase() === query.category.toLowerCase()
      : true;
    const featuredMatch =
      query.featured === undefined ? true : product.featured === query.featured;
    return categoryMatch && featuredMatch;
  });

  res.json(ListProductsResponse.parse(products));
});

router.get("/products/:id", (req, res) => {
  const { id } = GetProductParams.parse(req.params);
  const product = getCatalogProduct(id);
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json(GetProductResponse.parse(product));
});

router.get("/store/summary", (_req, res) => {
  const products = getCatalogProducts();
  res.json(
    GetStoreSummaryResponse.parse({
      featured: products.filter((product) => product.featured),
      categories: getCatalogCategories(),
      productCount: products.length,
    }),
  );
});

router.post("/checkout/session", async (req, res) => {
  const parsed = CreateCheckoutSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Your cart contains an invalid item." });
    return;
  }

  const products = parsed.data.items.map((item) => {
    const product = getMutableCatalogProduct(item.productId);
    return product ? { product, quantity: item.quantity } : undefined;
  });

  if (products.some((item) => !item)) {
    res.status(400).json({ error: "One or more items are no longer available." });
    return;
  }

  try {
    const lineItems = await Promise.all(
      products.map(async (item) => {
        if (!item) throw new Error("Missing product");
        const priceId =
          item.product.stripePriceId ??
          (await findOrCreatePrice(item.product));
        item.product.stripePriceId = priceId;
        return { price: priceId, quantity: item.quantity };
      }),
    );

    const requestOrigin =
      req.get("origin") ||
      (req.get("referer") ? new URL(req.get("referer")!).origin : undefined);
    const domain =
      process.env.FRONTEND_URL ||
      (process.env.REPLIT_DOMAINS
        ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`
        : undefined);
    const baseUrl =
      requestOrigin ||
      domain ||
      "https://elora-store-y1a8p7g77-linah1.vercel.app";
    const session = await createCheckoutSession({
      lineItems,
      successUrl: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/cancel`,
    });
    res.json(CreateCheckoutSessionResponse.parse(session));
  } catch (error) {
    logger.error({ err: error }, "Stripe checkout session creation failed");
    res.status(502).json({ error: "Checkout is temporarily unavailable. Please try again." });
  }
});

export default router;
