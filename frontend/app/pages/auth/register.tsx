import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import toast from "react-hot-toast";
import { useRegisterMutation } from "~/redux/api";
import { errorMessage } from "~/utils/format";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = searchParams.get("next") || "/";
  const [register, { isLoading }] = useRegisterMutation();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
      }).unwrap();
      toast.success("Account created — welcome!");
      navigate(next, { replace: true });
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <div className="card p-6 sm:p-8">
      <h1 className="text-xl font-semibold text-gray-900">Create account</h1>
      <p className="mt-1 text-sm text-gray-500">
        It takes less than a minute.
      </p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="name" className="label">
            Full name
          </label>
          <input
            id="name"
            required
            minLength={2}
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Your name"
          />
        </div>
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
          <label htmlFor="phone" className="label">
            Phone <span className="text-gray-400">(optional)</span>
          </label>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            className="input"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="01XXXXXXXXX"
          />
        </div>
        <div>
          <label htmlFor="password" className="label">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="input"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="At least 8 characters"
          />
        </div>
        <button type="submit" disabled={isLoading} className="btn-primary w-full">
          {isLoading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Already registered?{" "}
        <Link
          to={`/auth/login?next=${encodeURIComponent(next)}`}
          className="font-medium text-indigo-600 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
