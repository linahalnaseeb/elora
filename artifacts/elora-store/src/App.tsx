import { useMemo, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  LoaderCircle,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import {
  getGetProductQueryKey,
  getGetStoreSummaryQueryKey,
  getListProductsQueryKey,
  useCreateCheckoutSession,
  useGetProduct,
  useGetStoreSummary,
  useListProducts,
  type Product,
} from '@workspace/api-client-react';
import { Route, Switch, Link, useLocation, useSearch, Router as WouterRouter } from 'wouter';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();

type CartLine = { product: Product; quantity: number };

const money = (price: number, currency: string) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(price);

function ProductImage({ product, className = '' }: { product: Product; className?: string }) {
  const [failed, setFailed] = useState(false);
  return failed || !product.image ? (
    <div className={`relative flex h-full min-h-48 items-center justify-center overflow-hidden bg-[#d99a83] ${className}`}>
      <span className="font-editorial text-7xl text-[#f7ddbe]/75">{product.name.slice(0, 1)}</span>
      <span className="absolute -right-4 -top-8 h-32 w-32 rounded-full border-[18px] border-[#f0b34c]/60" />
      <span className="absolute -bottom-12 -left-10 h-32 w-32 rounded-full bg-[#71384d]/25" />
    </div>
  ) : (
    <img src={product.image} alt={product.name} onError={() => setFailed(true)} className={`h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.045] ${className}`} />
  );
}

function ProductCard({ product, onQuickView, onAdd }: { product: Product; onQuickView: (id: string) => void; onAdd: (product: Product) => void }) {
  return (
    <article className="group elora-rise relative" data-testid={`card-product-${product.id}`}>
      <div className="relative aspect-[4/5] overflow-hidden rounded-[1.35rem] bg-[#e3b09a]">
        <ProductImage product={product} />
        {product.badge && <span className="absolute left-4 top-4 rounded-full bg-[#f6dfbf] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#673247]">{product.badge}</span>}
        <button type="button" onClick={() => onQuickView(product.id)} data-testid={`button-quick-view-${product.id}`} className="absolute bottom-4 left-4 right-4 translate-y-2 rounded-full bg-[#f8eadc]/95 py-3 text-xs font-bold uppercase tracking-[0.16em] text-[#4b2739] opacity-0 shadow-lg transition-all duration-300 hover:bg-[#f1b44d] group-hover:translate-y-0 group-hover:opacity-100">
          Quick view
        </button>
      </div>
      <div className="flex items-start justify-between gap-3 px-1 pt-4">
        <button type="button" onClick={() => onQuickView(product.id)} data-testid={`button-product-name-${product.id}`} className="text-left">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a36a5d]">{product.category}</p>
          <h3 className="mt-1 font-editorial text-[1.55rem] leading-none text-[#4b2739] transition-colors group-hover:text-[#b06258]">{product.name}</h3>
          <p className="mt-2 text-xs text-[#765361]">{product.material}</p>
        </button>
        <div className="text-right">
          <p className="text-sm font-semibold text-[#4b2739]">{money(product.price, product.currency)}</p>
          <button type="button" onClick={() => onAdd(product)} data-testid={`button-add-product-${product.id}`} className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[#b06258] transition-colors hover:text-[#4b2739]">
            Add <Plus size={13} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </article>
  );
}

function ProductSkeleton() {
  return <div className="animate-pulse"><div className="aspect-[4/5] rounded-[1.35rem] bg-[#e4c9bd]" /><div className="mt-4 h-3 w-20 rounded-full bg-[#e4c9bd]" /><div className="mt-2 h-7 w-36 rounded-full bg-[#e4c9bd]" /></div>;
}

function CartDrawer({ cart, open, onClose, onChange, onRemove, onCheckout, checkoutPending, checkoutUrl }: { cart: CartLine[]; open: boolean; onClose: () => void; onChange: (id: string, quantity: number) => void; onRemove: (id: string) => void; onCheckout: () => void; checkoutPending: boolean; checkoutUrl: string | null }) {
  const total = cart.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  return (
    <>
      {open && <button type="button" aria-label="Close cart" data-testid="button-cart-overlay" onClick={onClose} className="fixed inset-0 z-40 cursor-default bg-[#33212c]/35 backdrop-blur-[2px]" />}
      <aside className={`fixed right-0 top-0 z-50 flex h-[100dvh] w-full max-w-md flex-col bg-[#faeee4] shadow-2xl transition-transform duration-500 ${open ? 'translate-x-0' : 'translate-x-full'}`} aria-label="Shopping cart">
        <div className="flex items-center justify-between border-b border-[#e4cfc2] px-6 py-5">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a36a5d]">Your edit</p><h2 className="font-editorial text-3xl text-[#4b2739]">Shopping bag</h2></div>
          <button type="button" onClick={onClose} data-testid="button-close-cart" className="rounded-full p-2 text-[#4b2739] transition-colors hover:bg-[#efd1c0]"><X size={20} /></button>
        </div>
        {cart.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-10 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#efd1c0] text-[#b06258]"><ShoppingBag size={25} strokeWidth={1.5} /></div>
            <h3 className="font-editorial text-3xl text-[#4b2739]">Nothing here yet.</h3>
            <p className="mt-2 max-w-xs text-sm leading-6 text-[#765361]">The best edits start with one small, expressive thing.</p>
            <button type="button" onClick={onClose} data-testid="button-browse-cart-empty" className="mt-7 rounded-full bg-[#4b2739] px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-[#f9e9d8] transition-transform hover:-translate-y-0.5">Browse pieces</button>
          </div>
        ) : (
          <>
            <div className="scrollbar-hidden flex-1 space-y-5 overflow-y-auto px-6 py-6">
              {cart.map(({ product, quantity }) => (
                <div className="flex gap-4" key={product.id} data-testid={`row-cart-${product.id}`}>
                  <div className="h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-[#d99a83]"><ProductImage product={product} /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-2"><div><p className="text-[10px] uppercase tracking-[0.15em] text-[#a36a5d]">{product.category}</p><h3 className="truncate font-editorial text-xl text-[#4b2739]">{product.name}</h3></div><button type="button" onClick={() => onRemove(product.id)} data-testid={`button-remove-cart-${product.id}`} className="h-fit p-1 text-[#a36a5d] hover:text-[#4b2739]"><Trash2 size={15} /></button></div>
                    <div className="mt-3 flex items-center justify-between"><div className="flex items-center rounded-full border border-[#dcc1b4]"><button type="button" onClick={() => onChange(product.id, quantity - 1)} data-testid={`button-decrease-cart-${product.id}`} className="p-1.5 text-[#4b2739] hover:bg-[#efd1c0]"><Minus size={13} /></button><span className="w-7 text-center text-xs font-semibold">{quantity}</span><button type="button" onClick={() => onChange(product.id, quantity + 1)} data-testid={`button-increase-cart-${product.id}`} className="p-1.5 text-[#4b2739] hover:bg-[#efd1c0]"><Plus size={13} /></button></div><span className="text-sm font-semibold text-[#4b2739]">{money(product.price * quantity, product.currency)}</span></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-[#e4cfc2] px-6 py-6">
              <div className="mb-5 flex items-center justify-between"><span className="text-sm text-[#765361]">Subtotal</span><span className="font-editorial text-3xl text-[#4b2739]">{money(total, cart[0]?.product.currency || 'USD')}</span></div>
              <p className="mb-4 text-[11px] leading-5 text-[#8e6b72]">Shipping and taxes are calculated securely at checkout.</p>
              <button type="button" disabled={checkoutPending} onClick={onCheckout} data-testid="button-checkout" className="flex w-full items-center justify-center gap-2 rounded-full bg-[#4b2739] py-4 text-xs font-bold uppercase tracking-[0.18em] text-[#f9e9d8] transition-all hover:-translate-y-0.5 hover:bg-[#653247] disabled:cursor-wait disabled:opacity-70">
                {checkoutPending ? <LoaderCircle className="animate-spin" size={16} /> : <><span>Continue to checkout</span><ArrowUpRight size={16} /></>}
              </button>
              {checkoutUrl && (
                <div className="mt-4 rounded-2xl border border-[#e0b8ab] bg-[#f5ded4] px-4 py-4">
                  <p className="text-xs leading-5 text-[#765361]">If the secure checkout did not open automatically, continue here.</p>
                  <a href={checkoutUrl} target="_blank" rel="noreferrer" data-testid="link-open-checkout" className="mt-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#4b2739] underline decoration-[#c88740] decoration-2 underline-offset-4">
                    Open secure checkout <ArrowUpRight size={14} />
                  </a>
                </div>
              )}
            </div>
          </>
        )}
      </aside>
    </>
  );
}

function QuickView({ productId, onClose, onAdd }: { productId: string | null; onClose: () => void; onAdd: (product: Product) => void }) {
  const productQuery = useGetProduct(productId || '', { query: { enabled: Boolean(productId), queryKey: getGetProductQueryKey(productId || '') } });
  const product = productQuery.data;
  if (!productId) return null;
  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-[#33212c]/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label="Product details">
      <button type="button" onClick={onClose} data-testid="button-close-quick-view-overlay" className="absolute inset-0 cursor-default" aria-label="Close product details" />
      <div className="relative z-10 grid max-h-[92dvh] w-full max-w-4xl overflow-hidden rounded-t-[1.75rem] bg-[#faeee4] shadow-2xl sm:grid-cols-2 sm:rounded-[1.75rem]">
        <button type="button" onClick={onClose} data-testid="button-close-quick-view" className="absolute right-4 top-4 z-20 rounded-full bg-[#faeee4]/80 p-2 text-[#4b2739] backdrop-blur hover:bg-[#efd1c0]"><X size={18} /></button>
        <div className="min-h-[300px] bg-[#d99a83] sm:min-h-[520px]"><>{product ? <ProductImage product={product} /> : <div className="h-full animate-pulse bg-[#e4c9bd]" />}</></div>
        <div className="flex flex-col justify-center overflow-y-auto p-7 sm:p-12">
          {productQuery.isError ? <div className="text-center"><CircleAlert className="mx-auto mb-3 text-[#b06258]" /><p className="text-sm text-[#765361]">This piece is taking a moment to appear.</p><button type="button" onClick={() => productQuery.refetch()} data-testid="button-retry-product" className="mt-4 text-xs font-bold uppercase tracking-widest text-[#b06258]">Try again</button></div> : product ? <><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a36a5d]">{product.category} / {product.material}</p><h2 className="mt-3 font-editorial text-5xl leading-[.92] text-[#4b2739]">{product.name}</h2><p className="mt-5 text-2xl text-[#b06258]">{money(product.price, product.currency)}</p><p className="mt-6 text-sm leading-7 text-[#765361]">{product.description}</p><div className="mt-8 flex items-center gap-3 border-t border-[#e4cfc2] pt-6"><Sparkles size={18} className="text-[#c88740]" /><p className="text-xs leading-5 text-[#765361]">A small gesture with a point of view.</p></div><button type="button" onClick={() => { onAdd(product); onClose(); }} data-testid={`button-quick-add-${product.id}`} className="mt-8 flex items-center justify-center gap-2 rounded-full bg-[#4b2739] py-4 text-xs font-bold uppercase tracking-[0.18em] text-[#f9e9d8] transition-transform hover:-translate-y-0.5">Add to bag <Plus size={16} /></button></> : <div className="h-64 animate-pulse" />}
        </div>
      </div>
    </div>
  );
}

function Home() {
  const [category, setCategory] = useState<string | undefined>();
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [quickViewId, setQuickViewId] = useState<string | null>(null);
  const [shopOpen, setShopOpen] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const summaryQuery = useGetStoreSummary({ query: { queryKey: getGetStoreSummaryQueryKey() } });
  const productsQuery = useListProducts(category ? { category } : undefined, { query: { queryKey: getListProductsQueryKey(category ? { category } : undefined) } });
  const checkout = useCreateCheckoutSession();
  const summary = summaryQuery.data;
  const products = productsQuery.data || [];
  const featured = summary?.featured || [];
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const visibleCategories = useMemo(() => summary?.categories || [], [summary?.categories]);

  const addToCart = (product: Product) => {
    setCart((current) => {
      const found = current.find((line) => line.product.id === product.id);
      return found ? current.map((line) => line.product.id === product.id ? { ...line, quantity: Math.min(10, line.quantity + 1) } : line) : [...current, { product, quantity: 1 }];
    });
    setCartOpen(true);
  };
  const changeQuantity = (id: string, quantity: number) => setCart((current) => quantity < 1 ? current.filter((line) => line.product.id !== id) : current.map((line) => line.product.id === id ? { ...line, quantity: Math.min(10, quantity) } : line));
  const startCheckout = () => {
    if (!cart.length) return;
    setCheckoutUrl(null);
    checkout.mutate(
      { data: { items: cart.map(({ product, quantity }) => ({ productId: product.id, quantity })) } },
      {
        onSuccess: (session) => {
          setCheckoutUrl(session.url);
          window.location.href = session.url;
        },
      },
    );
  };

  return (
    <div className="paper-grain min-h-[100dvh] overflow-x-hidden bg-[#f8eee6] text-[#4b2739]">
      <header className="relative z-20 mx-auto flex max-w-[1440px] items-center justify-between px-5 py-5 sm:px-10 lg:px-14">
        <Link href="/" data-testid="link-logo" className="font-editorial text-3xl tracking-[-0.05em] text-[#4b2739]">ELORA<span className="text-[#c88740]">.</span></Link>
        <nav className="hidden items-center gap-8 text-[11px] font-bold uppercase tracking-[0.2em] text-[#765361] md:flex">
          <a href="#shop" data-testid="link-shop" className="transition-colors hover:text-[#b06258]">Shop</a>
          <a href="#story" data-testid="link-story" className="transition-colors hover:text-[#b06258]">The Elora edit</a>
        </nav>
        <button type="button" onClick={() => setCartOpen(true)} data-testid="button-open-cart" className="relative flex items-center gap-2 rounded-full border border-[#d9bdae] px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.15em] text-[#4b2739] transition-all hover:-translate-y-0.5 hover:bg-[#efd1c0]"><ShoppingBag size={16} strokeWidth={1.8} /><span>Bag</span>{cartCount > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#f1b44d] px-1 text-[10px]">{cartCount}</span>}</button>
      </header>

      <main>
        <section className="mx-auto grid max-w-[1440px] grid-cols-1 gap-10 px-5 pb-16 pt-10 sm:px-10 sm:pt-16 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:gap-16 lg:px-14 lg:pb-28 lg:pt-20">
          <div className="elora-rise">
            <p className="mb-5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-[#b06258]"><span className="h-px w-8 bg-[#d28b69]" /> Objects for an everyday life</p>
            <h1 className="max-w-2xl font-editorial text-[clamp(4.8rem,11vw,10rem)] leading-[.78] tracking-[-0.06em] text-[#4b2739]">Small<br /><em className="text-[#b06258]">signals.</em></h1>
            <p className="mt-9 max-w-md text-base leading-7 text-[#765361] sm:text-lg">Expressive accessories for the days you want to feel a little more like yourself.</p>
            <div className="mt-9 flex flex-wrap items-center gap-5"><a href="#shop" data-testid="link-explore-edit" className="group flex items-center gap-3 rounded-full bg-[#4b2739] px-6 py-4 text-xs font-bold uppercase tracking-[0.16em] text-[#f9e9d8] transition-all hover:-translate-y-1">Explore the edit <ArrowDownRight /></a><span className="text-xs text-[#a36a5d]">Made to be noticed,<br />never over-explained.</span></div>
          </div>
          <div className="relative mx-auto w-full max-w-[600px] elora-rise delay-2">
            <div className="relative aspect-[.9/1] overflow-hidden rounded-[2rem] bg-[#d88670] shadow-[var(--shadow-soft)]">
              {featured[0] ? <ProductImage product={featured[0]} /> : <div className="h-full bg-[#d88670]" />}
              <div className="absolute inset-0 bg-gradient-to-t from-[#4b2739]/35 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between text-[#f9e9d8]"><div><p className="text-[10px] uppercase tracking-[0.2em] opacity-75">Current feeling</p><p className="mt-1 font-editorial text-3xl">A little extra.</p></div><span className="elora-drift flex h-14 w-14 items-center justify-center rounded-full border border-[#f9e9d8]/60 text-[10px] uppercase tracking-widest">01 / 04</span></div>
            </div>
            <div className="absolute -bottom-7 -left-5 flex h-24 w-24 rotate-[-9deg] items-center justify-center rounded-full bg-[#f1b44d] text-center text-[10px] font-bold uppercase leading-4 tracking-[0.12em] text-[#4b2739] shadow-xl">Wear<br />your<br />point of view</div>
          </div>
        </section>

        <section id="story" className="border-y border-[#e4cfc2] bg-[#f1b44d] px-5 py-10 sm:px-10 lg:px-14"><div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-6 sm:flex-row sm:items-center"><p className="max-w-xl font-editorial text-3xl leading-[.95] text-[#4b2739] sm:text-4xl">The finishing touch is not an afterthought. It is the thought.</p><div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.18em] text-[#6d3a37]"><span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#9c6840]"><Check size={15} /></span> Small-batch objects<br />for daily rituals</div></div></section>

        <section id="shop" className="mx-auto max-w-[1440px] px-5 py-16 sm:px-10 lg:px-14 lg:py-24">
          <div className="flex flex-col justify-between gap-7 sm:flex-row sm:items-end"><div><p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#b06258]">The collection</p><h2 className="mt-3 font-editorial text-5xl leading-none text-[#4b2739] sm:text-6xl">Your everyday, <em>edited.</em></h2></div><button type="button" onClick={() => setShopOpen(!shopOpen)} data-testid="button-filter-categories" className="flex items-center gap-2 self-start rounded-full border border-[#d9bdae] px-4 py-3 text-[10px] font-bold uppercase tracking-[0.17em] text-[#765361] transition-colors hover:bg-[#efd1c0] sm:self-auto">Filter collection <ChevronDown size={15} className={`transition-transform ${shopOpen ? 'rotate-180' : ''}`} /></button></div>
          {shopOpen && <div className="scrollbar-hidden mt-7 flex gap-2 overflow-x-auto pb-1 elora-fade"><button type="button" onClick={() => { setCategory(undefined); setShopOpen(false); }} data-testid="button-category-all" className={`shrink-0 rounded-full px-5 py-2.5 text-xs font-semibold transition-colors ${!category ? 'bg-[#4b2739] text-[#f9e9d8]' : 'bg-[#efd1c0] text-[#765361] hover:bg-[#e3b7a2]'}`}>All pieces</button>{visibleCategories.map((item) => <button type="button" key={item} onClick={() => { setCategory(item); setShopOpen(false); }} data-testid={`button-category-${item}`} className={`shrink-0 rounded-full px-5 py-2.5 text-xs font-semibold transition-colors ${category === item ? 'bg-[#4b2739] text-[#f9e9d8]' : 'bg-[#efd1c0] text-[#765361] hover:bg-[#e3b7a2]'}`}>{item}</button>)}</div>}
          <div className="mt-12">
            {productsQuery.isLoading ? <div className="grid grid-cols-1 gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-4"><ProductSkeleton /><ProductSkeleton /><ProductSkeleton /><ProductSkeleton /></div> : productsQuery.isError ? <div className="rounded-[1.5rem] border border-[#e0b8ab] bg-[#f5ded4] px-6 py-14 text-center"><CircleAlert className="mx-auto mb-4 text-[#b06258]" size={28} /><h3 className="font-editorial text-3xl text-[#4b2739]">The shelves are shy.</h3><p className="mx-auto mt-2 max-w-sm text-sm text-[#765361]">We could not bring the collection in right now. Give it another moment.</p><button type="button" onClick={() => productsQuery.refetch()} data-testid="button-retry-products" className="mt-6 rounded-full bg-[#4b2739] px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-[#f9e9d8]">Try again</button></div> : products.length === 0 ? <div className="rounded-[1.5rem] border border-dashed border-[#d9bdae] px-6 py-16 text-center"><Search className="mx-auto mb-4 text-[#b06258]" /><h3 className="font-editorial text-3xl text-[#4b2739]">A quiet shelf.</h3><p className="mt-2 text-sm text-[#765361]">No pieces in this edit just yet. Try another category.</p><button type="button" onClick={() => setCategory(undefined)} data-testid="button-clear-filter" className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-[#b06258]">See all pieces</button></div> : <div className="grid grid-cols-1 gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">{products.map((product) => <ProductCard key={product.id} product={product} onQuickView={setQuickViewId} onAdd={addToCart} />)}</div>}
          </div>
        </section>
        <section className="mx-auto max-w-[1440px] px-5 pb-20 sm:px-10 lg:px-14"><div className="relative overflow-hidden rounded-[1.75rem] bg-[#71384d] px-7 py-12 text-[#f9e9d8] sm:px-14 sm:py-16"><div className="absolute -right-16 -top-20 h-64 w-64 rounded-full border-[40px] border-[#d88670]/50" /><div className="absolute bottom-[-75px] right-[20%] h-48 w-48 rounded-full bg-[#f1b44d]/80" /><p className="relative text-[10px] font-bold uppercase tracking-[0.23em] text-[#f1b44d]">A note from the studio</p><h2 className="relative mt-4 max-w-2xl font-editorial text-5xl leading-[.9] sm:text-7xl">Keep the ordinary<br /><em>interesting.</em></h2><p className="relative mt-6 max-w-md text-sm leading-6 text-[#f4dacc]/80">ELORA is a small collection of things with a strong opinion about the everyday. Wear one. Wear three. Make the day yours.</p></div></section>
      </main>
      <footer className="border-t border-[#e4cfc2] px-5 py-8 sm:px-10 lg:px-14"><div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-4 text-[10px] font-bold uppercase tracking-[0.18em] text-[#a36a5d] sm:flex-row"><span>ELORA / Objects with feeling</span><span>Designed for the in-between moments</span></div></footer>
      <CartDrawer cart={cart} open={cartOpen} onClose={() => setCartOpen(false)} onChange={changeQuantity} onRemove={(id) => changeQuantity(id, 0)} onCheckout={startCheckout} checkoutPending={checkout.isPending} checkoutUrl={checkoutUrl} />
      <QuickView productId={quickViewId} onClose={() => setQuickViewId(null)} onAdd={addToCart} />
    </div>
  );
}

function ArrowDownRight() {
  return <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />;
}

function Success() {
  const search = useSearch();
  const sessionId = new URLSearchParams(search).get('session_id');
  return <main className="flex min-h-[100dvh] items-center justify-center bg-[#f1b44d] px-6 py-12 text-[#4b2739]"><div className="relative w-full max-w-xl overflow-hidden rounded-[2rem] bg-[#faeee4] px-7 py-14 text-center shadow-[var(--shadow-soft)] sm:px-16"><div className="absolute -right-14 -top-14 h-40 w-40 rounded-full border-[24px] border-[#d88670]/50" /><div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#71384d] text-[#f1b44d]"><Check size={28} strokeWidth={2.5} /></div><p className="mt-8 text-[10px] font-bold uppercase tracking-[0.23em] text-[#b06258]">Order received</p><h1 className="mt-3 font-editorial text-6xl leading-[.85]">A good<br /><em>choice.</em></h1><p className="mx-auto mt-7 max-w-sm text-sm leading-6 text-[#765361]">Your ELORA pieces are on their way into the world. A confirmation will follow shortly.</p>{sessionId && <p data-testid="text-session-id" className="mt-7 break-all font-mono text-[10px] text-[#a36a5d]">Session {sessionId}</p>}<Link href="/" data-testid="link-continue-shopping" className="mt-9 inline-flex items-center gap-2 rounded-full bg-[#4b2739] px-6 py-4 text-xs font-bold uppercase tracking-[0.16em] text-[#f9e9d8] transition-transform hover:-translate-y-0.5">Continue shopping <ArrowUpRight size={16} /></Link></div></main>;
}

function Cancel() {
  return <main className="flex min-h-[100dvh] items-center justify-center bg-[#d88670] px-6 py-12 text-[#4b2739]"><div className="w-full max-w-xl rounded-[2rem] bg-[#faeee4] px-7 py-14 text-center shadow-[var(--shadow-soft)] sm:px-16"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#efd1c0] text-[#b06258]"><ArrowLeft size={27} /></div><p className="mt-8 text-[10px] font-bold uppercase tracking-[0.23em] text-[#b06258]">Checkout paused</p><h1 className="mt-3 font-editorial text-6xl leading-[.85]">Still<br /><em>thinking?</em></h1><p className="mx-auto mt-7 max-w-sm text-sm leading-6 text-[#765361]">No charge was made. Your pieces are waiting patiently back in the bag.</p><Link href="/" data-testid="link-return-shopping" className="mt-9 inline-flex items-center gap-2 rounded-full bg-[#4b2739] px-6 py-4 text-xs font-bold uppercase tracking-[0.16em] text-[#f9e9d8] transition-transform hover:-translate-y-0.5">Return to shopping <ArrowUpRight size={16} /></Link></div></main>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function Router() {
  return <RoutedErrorBoundary><Switch><Route path="/" component={Home} /><Route path="/success" component={Success} /><Route path="/cancel" component={Cancel} /><Route component={NotFound} /></Switch></RoutedErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;