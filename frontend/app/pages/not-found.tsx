import { Link } from "react-router";

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <p className="text-6xl font-black text-indigo-600">404</p>
      <h1 className="text-xl font-semibold">Page not found</h1>
      <p className="max-w-md text-sm text-gray-500">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/" className="btn-primary mt-2">
        Back to home
      </Link>
    </div>
  );
}
