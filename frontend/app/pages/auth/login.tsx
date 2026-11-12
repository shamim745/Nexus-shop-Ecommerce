import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import toast from "react-hot-toast";
import { useLoginMutation } from "~/redux/api";
import { errorMessage } from "~/utils/format";

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = searchParams.get("next") || "/";
  const [login, { isLoading }] = useLoginMutation();
  const [form, setForm] = useState({ email: "", password: "" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(form).unwrap();
      toast.success("Welcome back!");
      navigate(next, { replace: true });
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <div className="card p-6 sm:p-8">
      <h1 className="text-xl font-semibold text-gray-900">Sign in</h1>
      <p className="mt-1 text-sm text-gray-500">
        Access your orders, wishlist and more.
      </p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="email" className="label">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            className="input"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@example.com"
          />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="label">
              Password
            </label>
            <Link
              to="/auth/forgot-password"
              className="text-xs font-medium text-indigo-600 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            className="input"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="••••••••"
          />
        </div>
        <button type="submit" disabled={isLoading} className="btn-primary w-full">
          {isLoading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        No account?{" "}
        <Link
          to={`/auth/register?next=${encodeURIComponent(next)}`}
          className="font-medium text-indigo-600 hover:underline"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
