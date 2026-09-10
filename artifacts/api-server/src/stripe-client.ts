function getStripeSecretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY environment variable is not configured. Please add STRIPE_SECRET_KEY to your Render environment variables.",
    );
  }
  return key;
}

type StripeResponse<T> = {
  id?: string;
  url?: string;
  data?: T[];
  metadata?: Record<string, string>;
  default_price?: string | { id: string } | null;
};

async function stripeRequest<T>(
  path: string,
  options: { method?: string; body?: URLSearchParams } = {},
): Promise<StripeResponse<T>> {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const response = await fetch(`https://api.stripe.com${cleanPath}`, {
    method: options.method ?? "GET",
    body: options.body,
    headers: {
      Authorization: `Bearer ${getStripeSecretKey()}`,
      ...(options.body
        ? { "Content-Type": "application/x-www-form-urlencoded" }
        : {}),
    },
  });

  const payload = (await response.json()) as StripeResponse<T> & {
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(payload.error?.message ?? `Stripe request failed with ${response.status}`);
  }

  return payload;
}

export async function findOrCreatePrice(product: {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
}): Promise<string> {
  const existingProducts = await stripeRequest<{
    id: string;
    metadata?: Record<string, string>;
    default_price?: string | { id: string } | null;
  }>(
    "/v1/products?active=true&limit=100",
  );
  const existingProduct = existingProducts.data?.find(
    (item) => item.metadata?.elora_product_id === product.id,
  );

  if (existingProduct?.default_price) {
    return typeof existingProduct.default_price === "string"
      ? existingProduct.default_price
      : existingProduct.default_price.id;
  }

  const stripeProduct =
    existingProduct ??
    (await stripeRequest<{ id: string }>("/v1/products", {
      method: "POST",
      body: new URLSearchParams({
        name: product.name,
        description: product.description,
        "metadata[elora_product_id]": product.id,
      }),
    }));

  const stripePrice = await stripeRequest<{ id: string }>("/v1/prices", {
    method: "POST",
    body: new URLSearchParams({
      product: stripeProduct.id ?? "",
      unit_amount: String(Math.round(product.price * 100)),
      currency: product.currency,
      "metadata[elora_product_id]": product.id,
    }),
  });

  if (!stripePrice.id) {
    throw new Error(`Stripe did not return a price for ${product.id}`);
  }

  return stripePrice.id;
}

export async function createCheckoutSession(params: {
  lineItems: Array<{ price: string; quantity: number }>;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ sessionId: string; url: string }> {
  const body = new URLSearchParams({
    mode: "payment",
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    billing_address_collection: "auto",
  });

  params.lineItems.forEach((item, index) => {
    body.set(`line_items[${index}][price]`, item.price);
    body.set(`line_items[${index}][quantity]`, String(item.quantity));
  });

  const session = await stripeRequest("/v1/checkout/sessions", {
    method: "POST",
    body,
  });

  if (!session.id || !session.url) {
    throw new Error("Stripe did not return a checkout URL");
  }

  return { sessionId: session.id, url: session.url };
}
