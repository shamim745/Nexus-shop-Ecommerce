import { Link, NavLink, Navigate, Outlet, useLocation } from "react-router";
import { ArrowLeft, Package, MapPin, User } from "lucide-react";
import { useGetMeQuery } from "~/redux/api";
import { PageLoader } from "~/components";

const TABS = [
  { to: "/account", label: "Profile", icon: User, end: true },
  { to: "/account/orders", label: "My orders", icon: Package },
  { to: "/account/addresses", label: "Addresses", icon: MapPin },
];

export default function AccountLayout() {
  const { data: user, isLoading, isError } = useGetMeQuery();
  const location = useLocation();

  if (isLoading) return <PageLoader label="Checking your session..." />;

  if (isError || !user) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth/login?next=${next}`} replace />;
  }

  return (
    <div>
      <Link
        to="/"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 transition hover:text-indigo-600"
      >
        <ArrowLeft size={15} /> Back to store
      </Link>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My account</h1>
          <p className="text-sm text-gray-500">
            Signed in as <span className="font-medium text-gray-700">{user.email}</span>
          </p>
        </div>
        <Link to="/account/orders" className="btn-secondary text-sm">
          Track an order
        </Link>
      </div>

      <nav className="mb-6 flex gap-1 overflow-x-auto border-b border-gray-200">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`
            }
          >
            <tab.icon size={15} /> {tab.label}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
  );
}
