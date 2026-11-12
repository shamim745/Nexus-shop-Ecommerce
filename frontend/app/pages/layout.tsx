import { Outlet } from "react-router";
import { Header } from "~/components";
import { Footer } from "~/components";

export default function StoreLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
