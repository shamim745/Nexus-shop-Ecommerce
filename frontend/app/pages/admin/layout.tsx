import { NavLink, Navigate, Outlet, useLocation } from "react-router";
import {
  ArrowLeft,
  BarChart3,
  Boxes,
  LogOut,
  Percent,
  MessageSquareText as ReviewIcon,
  Settings,
  ShoppingCart,
  Star,
  Tags,
  Users,
} from "lucide-react";
import { api, useGetMeQuery, useLogoutMutation } from "~/redux/api";
import { PageLoader } from "~/components";
import { useNavigate } from "react-router";

const NAV = [
  { to: "/", label: "Back to store", icon: ArrowLeft, end: true },
  { to: "/admin", label: "Dashboard", icon: BarChart3, end: true },
  { to: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { to: "/admin/products", label: "Products", icon: Boxes },
  { to: "/admin/categories", label: "Categories", icon: Tags },
  { to: "/admin/brands", label: "Brands", icon: Star },
  { to: "/admin/coupons", label: "Coupons", icon: Percent },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/reviews", label: "Reviews", icon: ReviewIcon },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout() {
  const { data: user, isLoading, isError } = useGetMeQuery();
  const [logout] = useLogoutMutation();
  const navigate = useNavigate();
  const location = useLocation();

  if (isLoading) return <PageLoader label="Checking admin session..." />;

  if (isError || !user) {
    const next = encodeURIComponent(location.pathname);
    return <Navigate to={`/auth/login?next=${next}`} replace />;
  }

  if (user.role !== "ADMIN") {
    return <Navigate to="/" replace />;
  }

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      api.util.resetApiState();
      navigate("/");
    } catch {
      // keep the admin session UI if the request failed
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="shrink-0 border-b border-gray-200 bg-white lg:w-56 lg:border-b-0 lg:border-r">
        <div className="hidden items-center gap-2 px-5 py-4 lg:flex">
          <span className="flex size-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
            A
          </span>
          <span className="text-sm font-semibold">Admin panel</span>
        </div>
        <nav className="flex gap-1 overflow-x-auto p-2 lg:flex-col lg:gap-0.5 lg:overflow-visible">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`
              }
            >
              <item.icon size={16} /> {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden border-t border-gray-100 p-3 lg:block">
          <p className="truncate px-2 text-xs text-gray-400">{user.email}</p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}

export function AdminPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}
