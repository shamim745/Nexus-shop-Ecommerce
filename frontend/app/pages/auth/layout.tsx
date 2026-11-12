import { Link, Outlet } from "react-router";

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 font-bold">
            <span className="flex size-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-black text-white">
              N
            </span>
            {import.meta.env.VITE_APP_NAME ?? "Nexus Shop"}
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
