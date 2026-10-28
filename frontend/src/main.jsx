import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Search,
  UserRound,
  Heart,
  ShoppingBag,
  Menu,
  X,
  ArrowUpRight,
  ArrowRight,
  Truck,
  Package,
  BadgeCheck,
  LockKeyhole,
  SlidersHorizontal,
  Plus,
  Minus,
  Check,
  Instagram,
  ChevronDown,
} from "lucide-react";
import "./styles.css";
import { api, toProduct, toCart } from "./api.js";
import AccountPage from "./pages/Account.jsx";
import CheckoutPage from "./pages/Checkout.jsx";
import OrdersPage from "./pages/Orders.jsx";
import AdminPage from "./pages/Admin.jsx";

const image = (id, w = 800) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=85`;
const money = (n) => `₹${n.toLocaleString("en-IN")}`;
// Main navigation keeps the original storefront and shares live account/cart state.
function App() {
  const [products, setProducts] = useState([]);
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [cartBusy, setCartBusy] = useState(false);
  const [mockEnabled, setMockEnabled] = useState(false);
  // Refresh public inventory after an admin change or checkout.
  const reloadProducts = async () => {
    const list = await api("/products");
    setProducts(list.map(toProduct));
  };
  const refresh = async () => {
    setLoading(true);
    setLoadError("");
    try {
      await reloadProducts();
    } catch (e) {
      setLoadError(e.message);
    } finally {
      setLoading(false);
    }
  };
  // Restore the signed-in tab, then load that account's persisted cart.
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const list = await api("/products");
        if (live) setProducts(list.map(toProduct));
      } catch (e) {
        if (live) setLoadError(e.message);
      } finally {
        if (live) setLoading(false);
      }
      try {
        const config = await api("/payments/config");
        if (live) setMockEnabled(config.mockEnabled);
      } catch {}
      if (sessionStorage.getItem("gazu-token")) {
        try {
          const data = await api("/auth/me");
          const lines = await api("/cart");
          if (live) {
            setUser(data.user);
            setCart(toCart(lines));
          }
        } catch {
          sessionStorage.removeItem("gazu-token");
        }
      }
      if (live) setReady(true);
    })();
    return () => {
      live = false;
    };
  }, []);
  const signIn = async (data) => {
    sessionStorage.setItem("gazu-token", data.token);
    setUser(data.user);
    setCart(toCart(await api("/cart")));
    go(data.user.role === "admin" ? "admin" : "shop", "All");
  };
  const signOut = () => {
    sessionStorage.removeItem("gazu-token");
    setUser(null);
    setCart([]);
    setWishlist([]);
    go("account");
  };
  useEffect(() => {
    const expire = () => {
      sessionStorage.removeItem("gazu-token");
      setUser(null);
      setCart([]);
      setPage("account");
    };
    window.addEventListener("gazu-session-expired", expire);
    return () => window.removeEventListener("gazu-session-expired", expire);
  }, []);
  // Cart actions are server-backed; unavailable stock is rejected by the API.
  const updateCart = async (id, quantity) => {
    setCartBusy(true);
    try {
      setCart(
        toCart(
          await api("/cart/items/" + id, {
            method: quantity === 0 ? "DELETE" : "PATCH",
            ...(quantity ? { body: { quantity } } : {}),
          }),
        ),
      );
    } catch (e) {
      notify(e.message);
    } finally {
      setCartBusy(false);
    }
  };
  const completed = () => {
    setCart([]);
    reloadProducts().catch((e) => notify(e.message));
  };

  const [page, setPage] = useState("home");
  const [category, setCategory] = useState("All");
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [selected, setSelected] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sort, setSort] = useState("Featured");
  const [filter, setFilter] = useState("All");
  const [toast, setToast] = useState("");
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const go = (p, c) => {
    setPage(p);
    if (c) setCategory(c);
    setMenuOpen(false);
    setSearchOpen(false);
    setSelected(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const notify = (t) => {
    setToast(t);
    window.setTimeout(() => setToast(""), 2300);
  };
  const addToCart = async (p) => {
    if (!user) {
      notify("Please sign in to add items to your bag");
      go("account");
      return;
    }
    setCartBusy(true);
    try {
      setCart(
        toCart(
          await api("/cart/items", {
            method: "POST",
            body: { productId: p.id, quantity: 1 },
          }),
        ),
      );
      notify("Added to bag");
    } catch (e) {
      notify(e.message);
    } finally {
      setCartBusy(false);
    }
  };
  const toggleWish = (p) => {
    setWishlist((old) =>
      old.some((x) => x.id === p.id)
        ? old.filter((x) => x.id !== p.id)
        : [...old, p],
    );
    notify(
      wishlist.some((x) => x.id === p.id)
        ? "Removed from wishlist"
        : "Saved to wishlist",
    );
  };
  const visible = useMemo(() => {
    let list = products.filter(
      (p) =>
        (category === "All" ||
          p.category === category ||
          p.type === category) &&
        (filter === "All" || p.type === filter) &&
        `${p.name} ${p.category} ${p.type}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    );
    if (sort === "Price: Low to High") list.sort((a, b) => a.price - b.price);
    if (sort === "Price: High to Low") list.sort((a, b) => b.price - a.price);
    if (sort === "Newest")
      list.sort((a, b) => (b.tag === "NEW") - (a.tag === "NEW"));
    return list;
  }, [products, category, filter, query, sort]);
  const subtotal = cart.reduce((s, p) => s + p.price * p.qty, 0);
  const totalQty = cart.reduce((s, p) => s + p.qty, 0);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setSelected(null);
        setSearchOpen(false);
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const ProductCard = ({ p }) => (
    <article className="product-card">
      <button
        className="product-image"
        onClick={() => setSelected(p)}
        aria-label={`View ${p.name}`}
      >
        <img src={image(p.img, 700)} alt={p.name} loading="lazy" />
        {p.tag && <span className="tag">{p.tag}</span>}
        <span className="quick-view">
          QUICK VIEW <ArrowUpRight size={13} />
        </span>
      </button>
      <button
        className={`wish ${wishlist.some((x) => x.id === p.id) ? "active" : ""}`}
        onClick={() => toggleWish(p)}
        aria-label="Toggle wishlist"
      >
        <Heart
          size={17}
          fill={wishlist.some((x) => x.id === p.id) ? "currentColor" : "none"}
        />
      </button>
      <div className="product-info">
        <div>
          <h3>{p.name}</h3>
          <p>
            {p.color} · {p.category}
          </p>
          <p className="availability">
            {p.available
              ? `IN STOCK · ${p.quantity} available`
              : "OUT OF STOCK"}
          </p>
        </div>
        <div className="price">
          {money(p.price)} {p.old && <del>{money(p.old)}</del>}
        </div>
      </div>
      <button
        className="add-small"
        disabled={!p.available || cartBusy || !ready}
        onClick={() => addToCart(p)}
      >
        {p.available ? "ADD TO BAG" : "OUT OF STOCK"} <Plus size={13} />
      </button>
    </article>
  );
  const Header = () => (
    <>
      <div className="topbar">
        <span>COMPLIMENTARY DELIVERY ON ORDERS ABOVE ₹999</span>
        <div>
          <button onClick={() => notify("App experience coming soon")}>
            DOWNLOAD APP
          </button>
          <i /> <button onClick={() => go("track")}>TRACK ORDER</button>
          <i /> <button onClick={() => go("help")}>HELP</button>
        </div>
      </div>
      <header className="header">
        <button
          className="mobile-menu icon-btn"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Open menu"
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
        <nav className={`left-nav ${menuOpen ? "show" : ""}`}>
          <button onClick={() => go("shop", "Men")}>MEN</button>
          <button onClick={() => go("shop", "Women")}>WOMEN</button>
          <button onClick={() => go("shop", "Kids")}>KIDS</button>
          <button onClick={() => go("shop", "Accessories")}>ACCESSORIES</button>
        </nav>
        <button className="wordmark" onClick={() => go("home")}>
          GAZU
        </button>
        <div className="right-nav">
          {user?.role === "admin" && (
            <button onClick={() => go("admin")}>
              <UserRound />
              <span>ADMIN</span>
            </button>
          )}
          <button onClick={() => setSearchOpen(!searchOpen)}>
            <Search />
            <span>SEARCH</span>
          </button>
          <button onClick={() => go("account")}>
            <UserRound />
            <span>{user ? "ACCOUNT" : "SIGN IN"}</span>
          </button>
          <button onClick={() => go("wishlist")}>
            <Heart />
            <span>WISHLIST</span>
            <b>{wishlist.length || ""}</b>
          </button>
          <button onClick={() => go("cart")}>
            <ShoppingBag />
            <span>BAG</span>
            <b>({totalQty})</b>
          </button>
        </div>
      </header>
      {searchOpen && (
        <div className="search-panel">
          <Search size={19} />
          <input
            autoFocus
            placeholder="Search essentials, styles, collections..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && go("shop", "All")}
          />
          <button onClick={() => go("shop", "All")}>
            SEARCH <ArrowRight size={15} />
          </button>
          <button
            className="icon-btn"
            onClick={() => {
              setSearchOpen(false);
              setQuery("");
            }}
          >
            <X />
          </button>
        </div>
      )}
    </>
  );
  const Footer = () => (
    <footer className="footer">
      <div className="footer-main">
        <div className="footer-brand">
          <button className="wordmark footer-logo" onClick={() => go("home")}>
            GAZU
          </button>
          <p>Thoughtful essentials for wherever life takes you.</p>
          <div className="socials">
            <a href="https://instagram.com" aria-label="Instagram">
              <Instagram />
            </a>
            <span>IN / OUT / EVERYDAY</span>
          </div>
        </div>
        <div>
          <h4>EXPLORE</h4>
          <button onClick={() => go("shop", "Men")}>Men</button>
          <button onClick={() => go("shop", "Women")}>Women</button>
          <button onClick={() => go("shop", "Kids")}>Kids</button>
          <button onClick={() => go("shop", "Accessories")}>Accessories</button>
        </div>
        <div>
          <h4>HELP</h4>
          <button onClick={() => go("help")}>Contact us</button>
          <button onClick={() => go("track")}>Track order</button>
          <button onClick={() => go("help")}>Shipping & returns</button>
          <button onClick={() => go("help")}>FAQs</button>
        </div>
        <div className="newsletter">
          <h4>NOTES FROM GAZU</h4>
          <p>Demo newsletter preview — subscriptions are not sent or stored.</p>
          {subscribed ? (
            <div className="success">
              <Check size={17} /> DEMO PREVIEW COMPLETE
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (email.includes("@")) {
                  setSubscribed(true);
                  notify("Demo preview only — no subscription was sent");
                }
              }}
            >
              <input
                type="email"
                required
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button aria-label="Subscribe">
                <ArrowRight />
              </button>
            </form>
          )}
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 GAZU STUDIO</span>
        <span>MADE FOR EVERYDAY, MADE TO LAST</span>
        <div>
          <button onClick={() => go("help")}>PRIVACY</button>
          <button onClick={() => go("help")}>TERMS</button>
        </div>
      </div>
    </footer>
  );
  const Benefits = () => (
    <section className="benefits">
      <div>
        <Truck />
        <span>
          <b>FAST DELIVERY</b>
          <small>Quick & safe delivery</small>
        </span>
      </div>
      <div>
        <Package />
        <span>
          <b>EASY RETURNS</b>
          <small>Within 15 days</small>
        </span>
      </div>
      <div>
        <BadgeCheck />
        <span>
          <b>QUALITY ASSURED</b>
          <small>Better fabrics, built to last</small>
        </span>
      </div>
      <div>
        <LockKeyhole />
        <span>
          <b>SIMPLE CHECKOUT</b>
          <small>COD & mock payment</small>
        </span>
      </div>
    </section>
  );
  const Home = () => (
    <>
      <section className="hero">
        <img
          className="hero-img"
          src={image("photo-1515886657613-9f3515b0c78f", 1800)}
          alt="Minimal monochrome fashion editorial"
        />
        <div className="hero-overlay" />
        <div className="hero-copy">
          <p className="eyebrow">
            FASHION
            <br />
            THAT MOVES
            <br />
            WITH YOU.
          </p>
          <h1>GAZU</h1>
          <div className="hero-actions">
            <button className="btn dark" onClick={() => go("shop", "All")}>
              SHOP THE EDIT <ArrowUpRight size={15} />
            </button>
            <button className="text-link" onClick={() => go("shop", "All")}>
              EXPLORE NEW IN <ArrowRight size={14} />
            </button>
          </div>
        </div>
        <div className="hero-note">
          NEW COLLECTION
          <br />
          <strong>01 / 26</strong>
        </div>
        <span className="hero-index">01 — 04</span>
      </section>
      <section className="category-strip">
        {[
          {
            name: "MEN",
            desc: "Elevated everyday essentials.",
            cat: "Men",
            img: "photo-1503342217505-b0a15ec3261c",
          },
          {
            name: "WOMEN",
            desc: "Effortless style, for every you.",
            cat: "Women",
            img: "photo-1483985988355-763728e1935b",
          },
          {
            name: "KIDS",
            desc: "Comfort meets cool everyday.",
            cat: "Kids",
            img: "photo-1519238263530-99bdd11df2ea",
          },
        ].map((x) => (
          <button
            className="category-tile"
            key={x.name}
            onClick={() => go("shop", x.cat)}
          >
            <img src={image(x.img, 350)} alt="" />
            <span>
              <b>{x.name}</b>
              <small>{x.desc}</small>
              <em>
                SHOP {x.name} <ArrowRight size={13} />
              </em>
            </span>
          </button>
        ))}
      </section>
      <section className="season">
        <img
          src={image("photo-1529139574466-a303027c1d8b", 1400)}
          alt="New season fashion"
        />
        <div className="season-copy">
          <p className="eyebrow">A NEW POINT OF VIEW</p>
          <h2>
            NEW
            <br />
            VIBES.
          </h2>
          <p>
            Less noise. Better essentials.
            <br />
            Find your everyday uniform.
          </p>
          <button className="btn dark" onClick={() => go("shop", "All")}>
            EXPLORE COLLECTION <ArrowUpRight size={15} />
          </button>
        </div>
        <span className="season-caption">THE EVERYDAY STUDY / VOL. 01</span>
      </section>
      {Benefits()}
      <section className="section products-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">THE CONSIDERED EDIT</p>
            <h2>BEST OF GAZU</h2>
          </div>
          <button className="text-link" onClick={() => go("shop", "All")}>
            VIEW ALL <ArrowUpRight size={15} />
          </button>
        </div>
        <div className="product-grid home-grid">
          {products.slice(0, 4).map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      </section>
      <section className="manifesto">
        <p className="eyebrow">OUR POINT OF VIEW</p>
        <h2>
          GOOD STYLE ISN'T LOUD.
          <br />
          <i>IT JUST LASTS.</i>
        </h2>
        <button className="text-link" onClick={() => go("about")}>
          GET TO KNOW GAZU <ArrowRight size={14} />
        </button>
      </section>
    </>
  );
  const Shop = () => (
    <>
      <div className="shop-intro">
        <p className="eyebrow">THE GAZU WARDROBE</p>
        <h1>
          {category === "All" ? "ALL THE GOOD THINGS" : category.toUpperCase()}
        </h1>
        <p>Everyday pieces, thoughtfully considered.</p>
      </div>
      <div className="shop-toolbar">
        <span>{visible.length} PIECES</span>
        <div className="filters">
          <label>
            <SlidersHorizontal size={15} />
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="All">ALL CATEGORIES</option>
              {[
                "T-Shirts",
                "Shirts",
                "Knitwear",
                "Bottoms",
                "Outerwear",
                "Sweatshirts",
                "Sets",
                "Accessories",
              ].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label>
            SORT BY{" "}
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option>Featured</option>
              <option>Newest</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
            </select>
          </label>
        </div>
      </div>
      {visible.length ? (
        <div className="product-grid shop-grid">
          {visible.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      ) : (
        <div className="empty">
          <h2>NO PIECES FOUND</h2>
          <p>Try a different category or search term.</p>
          <button
            className="btn dark"
            onClick={() => {
              setFilter("All");
              setQuery("");
              setCategory("All");
            }}
          >
            RESET FILTERS
          </button>
        </div>
      )}
    </>
  );
  const Cart = () => (
    <div className="page-wrap">
      <div className="page-title">
        <p className="eyebrow">YOUR EDIT, YOUR WAY</p>
        <h1>
          YOUR BAG <span>({totalQty})</span>
        </h1>
      </div>
      {!cart.length ? (
        <div className="empty">
          <ShoppingBag size={36} />
          <h2>YOUR BAG IS TAKING A BREATHER.</h2>
          <p>It's a good time to find something you'll wear on repeat.</p>
          <button className="btn dark" onClick={() => go("shop", "All")}>
            EXPLORE THE COLLECTION <ArrowRight size={15} />
          </button>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items">
            {cart.map((p) => (
              <div className="cart-item" key={p.id}>
                <button onClick={() => setSelected(p)}>
                  <img src={image(p.img, 300)} alt={p.name} />
                </button>
                <div className="cart-item-copy">
                  <p className="eyebrow">
                    {p.category} / {p.color}
                  </p>
                  <h3>{p.name}</h3>
                  <strong>{money(p.price)}</strong>
                  {(!p.available || p.qty > p.quantity) && (
                    <p className="danger">
                      Unavailable quantity — reduce or remove this item.
                    </p>
                  )}
                  <div className="qty">
                    <button
                      disabled={cartBusy || p.qty <= 1}
                      onClick={() => updateCart(p.id, p.qty - 1)}
                    >
                      <Minus size={13} />
                    </button>
                    <span>{p.qty}</span>
                    <button
                      disabled={cartBusy || !p.available || p.qty >= p.quantity}
                      onClick={() => updateCart(p.id, p.qty + 1)}
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                </div>
                <button
                  className="remove"
                  disabled={cartBusy}
                  onClick={() => updateCart(p.id, 0)}
                >
                  REMOVE
                </button>
              </div>
            ))}
          </div>
          <aside className="order-summary">
            <h2>ORDER SUMMARY</h2>
            <div>
              <span>Subtotal</span>
              <b>{money(subtotal)}</b>
            </div>
            <div>
              <span>Delivery</span>
              <b>{subtotal >= 999 ? "FREE" : "₹99"}</b>
            </div>
            <div className="summary-total">
              <span>TOTAL</span>
              <b>{money(subtotal + (subtotal >= 999 ? 0 : 99))}</b>
            </div>
            <p>Taxes included. Shipping calculated at checkout.</p>
            <button
              className="btn dark full"
              disabled={
                cartBusy || cart.some((p) => !p.available || p.qty > p.quantity)
              }
              onClick={() => go("checkout")}
            >
              CONTINUE TO CHECKOUT <ArrowRight size={15} />
            </button>
            <button
              className="text-link center"
              onClick={() => go("shop", "All")}
            >
              CONTINUE SHOPPING
            </button>
          </aside>
        </div>
      )}
    </div>
  );
  const Wishlist = () => (
    <div className="page-wrap">
      <div className="page-title">
        <p className="eyebrow">KEEP THE GOOD ONES CLOSE</p>
        <h1>
          YOUR WISHLIST <span>({wishlist.length})</span>
        </h1>
      </div>
      {wishlist.length ? (
        <div className="product-grid shop-grid">
          {wishlist.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      ) : (
        <div className="empty">
          <Heart size={36} />
          <h2>NOTHING SAVED. YET.</h2>
          <p>Tap the heart on pieces you want to come back to.</p>
          <button className="btn dark" onClick={() => go("shop", "All")}>
            DISCOVER YOUR NEXT FAVOURITE
          </button>
        </div>
      )}
    </div>
  );
  const ContentPage = ({ title, sub, children }) => (
    <div className="page-wrap info-page">
      <p className="eyebrow">GAZU STUDIO / INFORMATION</p>
      <h1>{title}</h1>
      <p className="info-sub">{sub}</p>
      {children}
    </div>
  );
  const Help = () => (
    <ContentPage
      title="HERE TO HELP."
      sub="The details matter. So does getting them right."
    >
      <div className="help-grid">
        {[
          [
            "DELIVERY",
            "Orders above ₹999 ship free. Standard delivery usually takes 3–7 business days.",
          ],
          [
            "RETURNS",
            "Eligible unworn items can be returned within 15 days of delivery.",
          ],
          [
            "PRODUCT CARE",
            "Follow the care label. Wash similar colours together and air dry when possible.",
          ],
          [
            "CONTACT",
            "Write to hello@gazu.example for help with your order or product questions.",
          ],
        ].map(([h, p]) => (
          <article key={h}>
            <h2>{h}</h2>
            <p>{p}</p>
          </article>
        ))}
      </div>
    </ContentPage>
  );
  const About = () => (
    <>
      <section className="about-hero">
        <img
          src={image("photo-1529139574466-a303027c1d8b", 1600)}
          alt="GAZU editorial"
        />
        <div>
          <p className="eyebrow">OUR PHILOSOPHY</p>
          <h1>
            LESS, BUT
            <br />
            <i>BETTER.</i>
          </h1>
        </div>
      </section>
      <ContentPage
        title="MADE FOR REAL LIFE."
        sub="We believe the best wardrobe is the one you reach for every day."
      >
        <div className="about-copy">
          <p>
            GAZU is built around thoughtful essentials: considered shapes,
            versatile colours, and pieces that work hard without asking for
            attention. We favour clarity over clutter and quality over excess.
          </p>
          <p>
            Our point of view is simple. Style should move with you, feel like
            you, and last beyond a season.
          </p>
          <button className="btn dark" onClick={() => go("shop", "All")}>
            SHOP THE EDIT <ArrowRight size={15} />
          </button>
        </div>
      </ContentPage>
    </>
  );
  return (
    <>
      <div className="site-shell">
        {Header()}
        {loadError && (
          <div className="error-box" role="alert">
            {loadError}{" "}
            <button className="text-link" onClick={refresh}>
              RETRY
            </button>
          </div>
        )}
        {loading && <p className="loading-note">Loading products…</p>}
        {!ready ? (
          <div className="empty">Loading your account…</div>
        ) : page === "home" ? (
          Home()
        ) : page === "shop" ? (
          Shop()
        ) : page === "cart" ? (
          Cart()
        ) : page === "wishlist" ? (
          Wishlist()
        ) : page === "account" ? (
          <AccountPage
            user={user}
            onLogin={signIn}
            onLogout={signOut}
            go={go}
          />
        ) : page === "checkout" ? (
          <CheckoutPage
            cart={cart}
            user={user}
            mockEnabled={mockEnabled}
            onComplete={completed}
            go={go}
          />
        ) : page === "track" ? (
          <OrdersPage user={user} go={go} />
        ) : page === "admin" ? (
          <AdminPage
            user={user}
            products={products}
            reload={reloadProducts}
            go={go}
          />
        ) : page === "help" ? (
          Help()
        ) : page === "about" ? (
          About()
        ) : (
          Home()
        )}
        {Footer()}
      </div>
      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="product-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close icon-btn"
              onClick={() => setSelected(null)}
            >
              <X />
            </button>
            <div className="modal-image">
              <img src={image(selected.img, 900)} alt={selected.name} />
            </div>
            <div className="modal-copy">
              <p className="eyebrow">
                GAZU / {selected.category.toUpperCase()}
              </p>
              <h2>{selected.name}</h2>
              <div className="modal-price">
                {money(selected.price)}{" "}
                {selected.old && <del>{money(selected.old)}</del>}
              </div>
              <p className="description">
                {selected.description || "An everyday essential from GAZU."}
              </p>
              <div className="swatch-line">
                <span>COLOUR</span>
                <b>{selected.color}</b>
                <span className="swatch" />
              </div>
              <p className="availability">
                {selected.available
                  ? `IN STOCK · ${selected.quantity} available`
                  : "OUT OF STOCK"}
              </p>
              <button
                className="btn dark full"
                disabled={!selected.available || cartBusy || !ready}
                onClick={() => {
                  addToCart(selected);
                  setSelected(null);
                }}
              >
                ADD TO BAG — {money(selected.price)} <ShoppingBag size={16} />
              </button>
              <button
                className="text-link modal-wish"
                onClick={() => toggleWish(selected)}
              >
                <Heart size={15} />{" "}
                {wishlist.some((x) => x.id === selected.id)
                  ? "REMOVE FROM WISHLIST"
                  : "SAVE TO WISHLIST"}
              </button>
              <div className="modal-perks">
                <span>
                  <Truck size={15} /> FREE SHIPPING OVER ₹999
                </span>
                <span>
                  <Package size={15} /> 15-DAY RETURNS
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
      {toast && (
        <div className="toast">
          <Check size={16} />
          {toast}
        </div>
      )}
    </>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
