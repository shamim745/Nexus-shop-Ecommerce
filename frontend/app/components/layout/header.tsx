import { useState } from "react";
import { Link, NavLink, useNavigate, useSearchParams } from "react-router";
import {
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  ShoppingCart,
  User,
  Package,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { api, useGetCartQuery, useGetMeQuery, useLogoutMutation } from "~/redux/api";

const NAV_LINKS = [
  { to: "/products", label: "All Products" },
  { to: "/products?sort=newest", label: "New Arrivals" },
  { to: "/products?sort=popular", label: "Best Selling" },
];

export function Header() {
  const [searchParams] = useSearchParams();
  const [term, setTerm] = useState(searchParams.get("search") ?? "");
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const { data: user } = useGetMeQuery();
  const { data: cart } = useGetCartQuery();
  const [logout, { isLoading: loggingOut }] = useLogoutMutation();

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = term.trim();
    navigate(q ? `/products?search=${encodeURIComponent(q)}` : "/products");
  };

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      // Clear every cached query (getMe, cart, wishlist, ...) so the UI
      // signs out instantly — no reload required.
      api.util.resetApiState();
      toast.success("Logged out");
      navigate("/");
    } catch {
      toast.error("Could not log out");
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <button
          type="button"
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <Link to="/" className="flex items-center gap-2 font-bold">
          <span className="flex size-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-black text-white">
            N
          </span>
          <span className="text-lg tracking-tight">
            {import.meta.env.VITE_APP_NAME ?? "Nexus Shop"}
          </span>
        </Link>

        <nav className="hidden items-center gap-5 lg:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.label}
              to={link.to}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors hover:text-indigo-600 ${
                  isActive ? "text-indigo-600" : "text-gray-700"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <form onSubmit={submitSearch} className="relative ml-auto hidden max-w-xs flex-1 md:block">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="search"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search products..."
            className="input pl-9"
            aria-label="Search products"
          />
        </form>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <Link
            to="/wishlist"
            className="rounded-lg p-2.5 text-gray-600 hover:bg-gray-100 hover:text-indigo-600"
            aria-label="Wishlist"
          >
            <Heart size={19} />
          </Link>
          <Link
            to="/cart"
            className="relative rounded-lg p-2.5 text-gray-600 hover:bg-gray-100 hover:text-indigo-600"
            aria-label="Cart"
          >
            <ShoppingCart size={19} />
            {(cart?.itemCount ?? 0) > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex min-w-4.5 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold leading-4.5 text-white">
                {cart!.itemCount > 99 ? "99+" : cart!.itemCount}
              </span>
            )}
          </Link>

          {user ? (
            <div className="group relative ml-1">
              <button
                type="button"
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                <span className="flex size-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <span className="hidden max-w-24 truncate sm:block">{user.name}</span>
              </button>
              <div className="invisible absolute right-0 top-full w-48 rounded-xl border border-gray-200 bg-white py-1 opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100">
                <Link
                  to="/account"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <User size={15} /> My Account
                </Link>
                <Link
                  to="/account/orders"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Package size={15} /> Orders
                </Link>
                {user.role === "ADMIN" && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <LayoutDashboard size={15} /> Admin Panel
                  </Link>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut size={15} /> Log out
                </button>
              </div>
            </div>
          ) : (
            <Link to="/auth/login" className="btn-primary ml-1 hidden sm:inline-flex">
              Sign in
            </Link>
          )}
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-gray-100 bg-white px-4 py-3 lg:hidden">
          <form onSubmit={submitSearch} className="relative mb-3 md:hidden">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="search"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search products..."
              className="input pl-9"
            />
          </form>
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {link.label}
              </Link>
            ))}
            {!user && (
              <Link
                to="/auth/login"
                onClick={() => setMenuOpen(false)}
                className="btn-primary mt-1"
              >
                Sign in
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
