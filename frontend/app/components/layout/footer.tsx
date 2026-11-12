import { Link } from "react-router";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-gray-200 bg-gray-50">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 font-bold">
            <span className="flex size-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-black text-white">
              N
            </span>
            {import.meta.env.VITE_APP_NAME ?? "Nexus Shop"}
          </div>
          <p className="mt-3 text-sm text-gray-500">
            Quality products, honest prices, cash on delivery.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-900">Shop</h4>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            <li>
              <Link to="/products" className="hover:text-indigo-600">
                All products
              </Link>
            </li>
            <li>
              <Link to="/products?sort=newest" className="hover:text-indigo-600">
                New arrivals
              </Link>
            </li>
            <li>
              <Link to="/products?sort=popular" className="hover:text-indigo-600">
                Best selling
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-900">Account</h4>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            <li>
              <Link to="/account" className="hover:text-indigo-600">
                My account
              </Link>
            </li>
            <li>
              <Link to="/account/orders" className="hover:text-indigo-600">
                Order tracking
              </Link>
            </li>
            <li>
              <Link to="/wishlist" className="hover:text-indigo-600">
                Wishlist
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-900">Delivery</h4>
          <p className="mt-3 text-sm text-gray-600">
            Cash on delivery only. Shipping fee is shown at checkout and set by
            the store.
          </p>
        </div>
      </div>
      <div className="border-t border-gray-200 py-4 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} {import.meta.env.VITE_APP_NAME ?? "Nexus Shop"}.
        All rights reserved.
      </div>
    </footer>
  );
}
